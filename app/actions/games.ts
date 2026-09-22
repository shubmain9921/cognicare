'use server';

import { createClient } from '@/lib/supabase/server';
import { getPatientSession } from '@/lib/patient-session';
import { SLUG_TO_GAME_NAME, computeAdaptiveDifficulty } from '@/lib/adaptiveDifficulty';
import { isDemoMode, addDemoGameSession, getDemoGameSessions } from '@/lib/demo-mode';
import { getDailyCognitiveUsage } from '@/lib/safety-limits';
import { revalidatePath } from 'next/cache';

export interface GameSessionPayload {
  gameName: string;
  difficulty_level: number;
  accuracy: number; // 0.0 to 1.0 (or 0 to 100)
  avg_response_time_ms: number;
  mistakes: number;
  completed: boolean;
  duration_seconds?: number;
}

export interface LogGameResult {
  error?: string;
  success?: boolean;
  sessionId?: string;
  isLimitReached?: boolean;
}

/**
 * Log a completed game session to the database
 * Enforces daily cognitive activity limits on the backend.
 */
export async function logGameSession(
  payload: GameSessionPayload
): Promise<LogGameResult> {
  const session = await getPatientSession();

  if (!session) {
    return { error: 'No active patient session found.' };
  }

  // Safety guardrail: Check if daily cognitive activity limit has already been reached
  const usageStatus = await getDailyCognitiveUsage(session.id);
  if (usageStatus.isLimitReached) {
    return {
      error: "Today's cognitive activity limit has been reached. Please come back tomorrow.",
      isLimitReached: true,
    };
  }

  const durationSec = Math.max(1, Math.round(payload.duration_seconds || (payload.avg_response_time_ms ? payload.avg_response_time_ms / 1000 * 5 : 60)));

  if (isDemoMode()) {
    const newDemoSession = {
      id: `demo-session-${Date.now()}`,
      patient_id: session.id,
      game_name: payload.gameName,
      difficulty_level: Math.max(1, Math.min(5, payload.difficulty_level)),
      accuracy: payload.accuracy > 1 ? payload.accuracy / 100 : payload.accuracy,
      avg_response_time_ms: Math.round(payload.avg_response_time_ms),
      duration_seconds: durationSec,
      mistakes: Math.max(0, payload.mistakes),
      completed: payload.completed,
      played_at: new Date().toISOString(),
    };
    addDemoGameSession(newDemoSession);

    // Check if this newly recorded session just crossed the limit
    const updatedUsage = await getDailyCognitiveUsage(session.id);

    revalidatePath('/caregiver/dashboard');
    revalidatePath('/patient/games');
    revalidatePath('/patient/home');
    revalidatePath('/patient/progress');

    return {
      success: true,
      sessionId: newDemoSession.id,
      isLimitReached: updatedUsage.isLimitReached,
    };
  }

  const supabase = createClient();

  // Find game ID by name
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id')
    .ilike('name', payload.gameName)
    .maybeSingle();

  if (gameError || !game) {
    const { data: fallbackGame } = await supabase
      .from('games')
      .select('id, name')
      .limit(1)
      .single();

    if (!fallbackGame) {
      return { error: 'Game not registered in database.' };
    }
  }

  const targetGameId = game
    ? game.id
    : (
        await supabase
          .from('games')
          .select('id')
          .ilike('name', `%${payload.gameName}%`)
          .single()
      ).data?.id;

  if (!targetGameId) {
    return { error: `Game "${payload.gameName}" not found.` };
  }

  // Ensure accuracy is stored as float between 0.0 and 1.0
  const normalizedAccuracy =
    payload.accuracy > 1 ? Math.min(1, payload.accuracy / 100) : Math.max(0, payload.accuracy);

  const { data: insertedSession, error: insertError } = await supabase
    .from('game_sessions')
    .insert({
      patient_id: session.id,
      game_id: targetGameId,
      difficulty_level: Math.max(1, Math.min(5, payload.difficulty_level)),
      accuracy: normalizedAccuracy,
      avg_response_time_ms: Math.round(payload.avg_response_time_ms),
      mistakes: Math.max(0, payload.mistakes),
      completed: payload.completed,
      duration_seconds: durationSec,
      played_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Error logging game session:', insertError);
    return { error: insertError.message };
  }

  const updatedUsage = await getDailyCognitiveUsage(session.id);

  revalidatePath('/caregiver/dashboard');
  revalidatePath('/patient/games');
  revalidatePath('/patient/home');
  revalidatePath('/patient/progress');

  return {
    success: true,
    sessionId: insertedSession.id,
    isLimitReached: updatedUsage.isLimitReached,
  };
}

/**
 * Fetches the patient's last 5 sessions for a specific game and computes adaptive difficulty
 */
export async function getAdaptiveDifficultyForGame(
  gameSlug: string,
  defaultDifficulty: number = 2
): Promise<{ difficulty: number; sessionCount: number }> {
  const session = await getPatientSession();
  if (!session) {
    return { difficulty: defaultDifficulty, sessionCount: 0 };
  }

  const gameName = SLUG_TO_GAME_NAME[gameSlug] || gameSlug;

  if (isDemoMode()) {
    const allDemoSessions = getDemoGameSessions(session.id);
    const gameSessions = allDemoSessions
      .filter((s) => {
        const name = (s.game_name || s.game_type || '').toLowerCase().trim();
        return name === gameName.toLowerCase().trim() || name === gameSlug.toLowerCase().trim();
      })
      .slice(0, 5);

    if (gameSessions.length === 0) {
      return { difficulty: defaultDifficulty, sessionCount: 0 };
    }

    const computedDifficulty = computeAdaptiveDifficulty(gameSessions, defaultDifficulty);
    return {
      difficulty: computedDifficulty,
      sessionCount: gameSessions.length,
    };
  }
  const supabase = createClient();

  // 1. Get Game ID
  const { data: game } = await supabase
    .from('games')
    .select('id')
    .ilike('name', gameName)
    .maybeSingle();

  if (!game) {
    return { difficulty: defaultDifficulty, sessionCount: 0 };
  }

  // 2. Fetch last 5 sessions for this patient and game
  const { data: sessions, error } = await supabase
    .from('game_sessions')
    .select('id, difficulty_level, accuracy, avg_response_time_ms, mistakes, played_at')
    .eq('patient_id', session.id)
    .eq('game_id', game.id)
    .order('played_at', { ascending: false })
    .limit(5);

  if (error || !sessions || sessions.length === 0) {
    return { difficulty: defaultDifficulty, sessionCount: 0 };
  }

  const computedDifficulty = computeAdaptiveDifficulty(sessions, defaultDifficulty);

  return {
    difficulty: computedDifficulty,
    sessionCount: sessions.length,
  };
}
