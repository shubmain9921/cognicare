'use server';

import { createClient } from '@/lib/supabase/server';
import { getPatientSession } from '@/lib/patient-session';
import { isDemoMode, getDemoMemories, getDemoReminders, getDemoRoutines } from '@/lib/demo-mode';
import {
  generatePersonalizedStory,
  generateRoutineRecallQuestions as aiGenerateRoutineQuestions,
  generateWhoWhereWhenQuestions as aiGenerateWhoWhereWhenQuestions,
  QuizQuestion,
} from '@/lib/ai/gemini';

export type { QuizQuestion };

export interface StoryRecallData {
  notEnoughData?: boolean;
  memoryCount?: number;
  story?: string;
  title?: string;
  featuredItems?: string[];
  questions?: QuizQuestion[];
  isAiGenerated?: boolean;
  error?: string;
}

export interface RoutineRecallData {
  notEnoughData?: boolean;
  count?: number;
  questions?: QuizQuestion[];
  error?: string;
}

export interface WhoWhereWhenData {
  notEnoughData?: boolean;
  memoryCount?: number;
  questions?: QuizQuestion[];
  error?: string;
}

/**
 * 1. Generate Story Recall from patient's memory bank using Google Gemini AI
 */
export async function getPersonalizedStory(): Promise<StoryRecallData> {
  const session = await getPatientSession();
  if (!session) {
    return { error: 'No active patient session.' };
  }

  let memories: Array<{ id?: string; category: string; key_term: string; description: string }> = [];

  if (isDemoMode()) {
    memories = getDemoMemories(session.id);
  } else {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('memory_bank')
      .select('id, category, key_term, description')
      .eq('patient_id', session.id);

    if (error) {
      return { error: error.message };
    }
    memories = data || [];
  }

  if (!memories || memories.length < 2) {
    return { notEnoughData: true, memoryCount: memories?.length || 0 };
  }

  // Pick up to 3 memories (shuffled)
  const shuffled = [...memories].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(3, memories.length));

  const result = await generatePersonalizedStory({
    patientName: session.name,
    language: session.preferred_language || 'en',
    memories: selected,
    difficulty: 2,
  });

  return {
    title: result.title,
    story: result.story,
    featuredItems: result.featuredItems,
    questions: result.questions,
    isAiGenerated: result.isAiGenerated,
  };
}

/**
 * 2. Generate Daily Routine Recall quiz from recurring reminders / routines using Google Gemini AI
 */
export async function getRoutineRecallQuestions(): Promise<RoutineRecallData> {
  const session = await getPatientSession();
  if (!session) {
    return { error: 'No active patient session.' };
  }

  let routineItems: Array<{ time_of_day?: string; scheduled_time?: string; title: string; description?: string }> = [];

  if (isDemoMode()) {
    const demoRoutines = getDemoRoutines(session.id);
    const demoReminders = getDemoReminders(session.id);

    if (demoRoutines && demoRoutines.length > 0) {
      routineItems = demoRoutines.map((r) => ({
        time_of_day: r.time_of_day,
        title: r.title,
        description: r.description,
      }));
    } else {
      routineItems = demoReminders.map((r) => ({
        scheduled_time: r.scheduled_time,
        title: r.title,
        description: r.description,
      }));
    }
  } else {
    const supabase = createClient();
    const { data: routines } = await supabase
      .from('daily_routines')
      .select('time_of_day, title, description')
      .eq('patient_id', session.id);

    if (routines && routines.length >= 2) {
      routineItems = routines.map((r) => ({
        time_of_day: r.time_of_day,
        title: r.title,
        description: r.description || undefined,
      }));
    } else {
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('id, type, title, scheduled_time, recurrence_rule')
        .eq('patient_id', session.id);

      if (error) {
        return { error: error.message };
      }
      routineItems = (reminders || []).map((r) => ({
        scheduled_time: r.scheduled_time,
        title: r.title,
      }));
    }
  }

  if (!routineItems || routineItems.length < 2) {
    return { notEnoughData: true, count: routineItems?.length || 0 };
  }

  const questions = await aiGenerateRoutineQuestions({
    patientName: session.name,
    language: session.preferred_language || 'en',
    routines: routineItems,
    difficulty: 2,
  });

  return {
    questions,
  };
}

/**
 * 3. Generate Who/Where/When? quiz from categorized memory bank using Google Gemini AI
 */
export async function getWhoWhereWhenQuiz(): Promise<WhoWhereWhenData> {
  const session = await getPatientSession();
  if (!session) {
    return { error: 'No active patient session.' };
  }

  let memories: Array<{ id?: string; category: string; key_term: string; description: string }> = [];

  if (isDemoMode()) {
    memories = getDemoMemories(session.id);
  } else {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('memory_bank')
      .select('id, category, key_term, description')
      .eq('patient_id', session.id);

    if (error) {
      return { error: error.message };
    }
    memories = data || [];
  }

  if (!memories || memories.length < 2) {
    return { notEnoughData: true, memoryCount: memories?.length || 0 };
  }

  const questions = await aiGenerateWhoWhereWhenQuestions({
    patientName: session.name,
    language: session.preferred_language || 'en',
    memories,
    difficulty: 2,
  });

  return {
    questions,
  };
}
