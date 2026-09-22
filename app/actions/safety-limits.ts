'use server';

import { getPatientSession } from '@/lib/patient-session';
import { getDailyCognitiveUsage, DailyCognitiveUsage, DEFAULT_DAILY_LIMIT_MINUTES } from '@/lib/safety-limits';
import { isDemoMode, addDemoGameSession } from '@/lib/demo-mode';
import { createClient } from '@/lib/supabase/server';

/**
 * Fetch current patient's daily cognitive game usage status
 */
export async function getPatientDailyUsage(): Promise<DailyCognitiveUsage | null> {
  const session = await getPatientSession();
  if (!session) return null;

  return await getDailyCognitiveUsage(session.id, 'Asia/Kolkata');
}

/**
 * Record active game duration ticks (e.g. from game completion or active session pulse)
 */
export async function recordActiveGameDuration(
  durationSeconds: number,
  gameName: string = 'Cognitive Activity'
): Promise<DailyCognitiveUsage | null> {
  const session = await getPatientSession();
  if (!session) return null;

  // Check if limit is already reached
  const currentUsage = await getDailyCognitiveUsage(session.id, 'Asia/Kolkata');
  if (currentUsage.isLimitReached) {
    return currentUsage;
  }

  if (isDemoMode()) {
    addDemoGameSession({
      id: `demo-session-${Date.now()}`,
      patient_id: session.id,
      game_name: gameName,
      difficulty_level: 2,
      accuracy: 0.85,
      avg_response_time_ms: 2000,
      duration_seconds: Math.max(1, Math.round(durationSeconds)),
      mistakes: 0,
      completed: true,
      played_at: new Date().toISOString(),
    });
  } else {
    const supabase = createClient();
    // Find game
    const { data: game } = await supabase
      .from('games')
      .select('id')
      .ilike('name', gameName)
      .maybeSingle();

    if (game) {
      await supabase.from('game_sessions').insert({
        patient_id: session.id,
        game_id: game.id,
        difficulty_level: 2,
        accuracy: 0.85,
        avg_response_time_ms: 2000,
        duration_seconds: Math.max(1, Math.round(durationSeconds)),
        completed: true,
        played_at: new Date().toISOString(),
      });
    }
  }

  return await getDailyCognitiveUsage(session.id, 'Asia/Kolkata');
}
