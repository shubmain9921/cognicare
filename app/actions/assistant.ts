'use server';

import { createClient } from '@/lib/supabase/server';
import { getPatientSession } from '@/lib/patient-session';
import { isDemoMode, getDemoReminders, getDemoRoutines, getDemoMemories } from '@/lib/demo-mode';
import { handlePatientAssistantQuery } from '@/lib/ai/gemini';

export interface AssistantResponse {
  reply: string;
  error?: string;
}

/**
 * Server action to handle conversational assistance for the authenticated patient.
 * Backend retrieves data and passes ONLY approved minimal context to Gemini.
 */
export async function askPatientAssistant(query: string): Promise<AssistantResponse> {
  const session = await getPatientSession();
  if (!session) {
    return {
      reply: 'Please sign in to your patient account.',
      error: 'Unauthenticated',
    };
  }

  const trimmedQuery = (query || '').trim();
  if (!trimmedQuery) {
    return { reply: 'How can I help you today?' };
  }

  let schedule: Array<{ title: string; scheduled_time: string; is_done: boolean }> = [];
  let routines: Array<{ time_of_day: string; title: string }> = [];
  let memories: Array<{ category: string; key_term: string; description: string }> = [];

  if (isDemoMode()) {
    const demoRems = getDemoReminders(session.id);
    schedule = demoRems.map((r) => ({
      title: r.title,
      scheduled_time: new Date(r.scheduled_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      is_done: r.is_done,
    }));

    const demoRouts = getDemoRoutines(session.id);
    routines = demoRouts.map((rt) => ({
      time_of_day: rt.time_of_day,
      title: rt.title,
    }));

    const demoMems = getDemoMemories(session.id);
    memories = demoMems.map((m) => ({
      category: m.category,
      key_term: m.key_term,
      description: m.description,
    }));
  } else {
    const supabase = createClient();

    // Fetch reminders
    const { data: remData } = await supabase
      .from('reminders')
      .select('title, scheduled_time, is_done')
      .eq('patient_id', session.id);

    schedule = (remData || []).map((r) => ({
      title: r.title,
      scheduled_time: new Date(r.scheduled_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      is_done: r.is_done,
    }));

    // Fetch routines
    const { data: routData } = await supabase
      .from('daily_routines')
      .select('time_of_day, title')
      .eq('patient_id', session.id);

    routines = routData || [];

    // Fetch memories
    const { data: memData } = await supabase
      .from('memory_bank')
      .select('category, key_term, description')
      .eq('patient_id', session.id);

    memories = memData || [];
  }

  const result = await handlePatientAssistantQuery({
    query: trimmedQuery,
    patientName: session.name,
    language: session.preferred_language || 'en',
    schedule,
    routines,
    memories,
  });

  return {
    reply: result.reply,
  };
}
