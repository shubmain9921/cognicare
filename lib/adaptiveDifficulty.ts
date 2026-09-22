export interface GameSessionRecord {
  id?: string;
  difficulty_level: number;
  accuracy: number; // 0.0 - 1.0 or 0 - 100
  avg_response_time_ms: number;
  mistakes: number;
  completed?: boolean;
  played_at?: string;
}

export const SLUG_TO_GAME_NAME: Record<string, string> = {
  'remember-objects': 'Remember the Objects',
  'sequence-recall': 'Sequence Recall',
  'find-pair': 'Find the Pair',
  'what-changed': 'What Changed?',
  'story-recall': 'Story Recall',
  'daily-routine-recall': 'Daily Routine Recall',
  'who-where-when': 'Who/Where/When?',
};

/**
 * Calculates adaptive difficulty (1 - 5) based on a patient's last 5 game sessions.
 * 
 * Rules:
 * - If avg accuracy > 85% and avg_response_time is trending faster → increase difficulty by 1 (max 5)
 * - If avg accuracy < 50% or mistakes trending up → decrease difficulty by 1 (min 1)
 * - Else → keep current difficulty (clamped 1 - 5, default 2 if no history)
 * 
 * @param sessions Array of up to 5 game sessions (can be newest-first or oldest-first)
 * @param defaultDifficulty Default difficulty level if no sessions exist (default: 2)
 */
export function computeAdaptiveDifficulty(
  sessions: GameSessionRecord[],
  defaultDifficulty: number = 2
): number {
  if (!sessions || sessions.length === 0) {
    return Math.max(1, Math.min(5, defaultDifficulty));
  }

  // Sort chronologically (oldest first, newest last)
  const chronological = [...sessions].sort((a, b) => {
    const timeA = a.played_at ? new Date(a.played_at).getTime() : 0;
    const timeB = b.played_at ? new Date(b.played_at).getTime() : 0;
    return timeA - timeB;
  });

  const latestSession = chronological[chronological.length - 1];
  const currentDifficulty = latestSession.difficulty_level || defaultDifficulty;

  // 1. Calculate Average Accuracy (normalized to 0 - 1)
  const totalAccuracy = chronological.reduce((sum, s) => {
    const acc = s.accuracy > 1 ? s.accuracy / 100 : s.accuracy;
    return sum + Math.max(0, Math.min(1, acc));
  }, 0);
  const avgAccuracy = totalAccuracy / chronological.length;

  // 2. Trend Analysis for Response Time (faster = decreasing response time ms)
  let isTrendingFaster = false;
  if (chronological.length >= 2) {
    const mid = Math.floor(chronological.length / 2);
    const olderHalf = chronological.slice(0, mid);
    const recentHalf = chronological.slice(mid);

    const olderAvgTime =
      olderHalf.reduce((sum, s) => sum + s.avg_response_time_ms, 0) / olderHalf.length;
    const recentAvgTime =
      recentHalf.reduce((sum, s) => sum + s.avg_response_time_ms, 0) / recentHalf.length;

    // Response time is trending faster if recent avg time is strictly lower
    isTrendingFaster = recentAvgTime < olderAvgTime;
  } else {
    // Single session: high accuracy indicates readiness
    isTrendingFaster = avgAccuracy >= 0.9;
  }

  // 3. Trend Analysis for Mistakes (trending up = increasing mistakes)
  let isMistakesTrendingUp = false;
  if (chronological.length >= 2) {
    const mid = Math.floor(chronological.length / 2);
    const olderHalf = chronological.slice(0, mid);
    const recentHalf = chronological.slice(mid);

    const olderAvgMistakes =
      olderHalf.reduce((sum, s) => sum + s.mistakes, 0) / olderHalf.length;
    const recentAvgMistakes =
      recentHalf.reduce((sum, s) => sum + s.mistakes, 0) / recentHalf.length;

    isMistakesTrendingUp = recentAvgMistakes > olderAvgMistakes && recentAvgMistakes > 0;
  } else {
    isMistakesTrendingUp = (latestSession.mistakes || 0) >= 3;
  }

  // 4. Evaluate Rules
  if (avgAccuracy > 0.85 && isTrendingFaster) {
    return Math.min(5, currentDifficulty + 1);
  }

  if (avgAccuracy < 0.50 || isMistakesTrendingUp) {
    return Math.max(1, currentDifficulty - 1);
  }

  return Math.max(1, Math.min(5, currentDifficulty));
}
