import { isDemoMode, getDemoGameSessions } from '@/lib/demo-mode';

/**
 * ========================================================
 * SAFETY FEATURE — DAILY COGNITIVE ACTIVITY TIME LIMIT
 * ========================================================
 * Default maximum daily cognitive-game usage: 60 minutes per patient per calendar day.
 * Tracks cumulative duration across all games based on the database.
 */

export const DEFAULT_DAILY_LIMIT_MINUTES = 60;

export interface DailyCognitiveUsage {
  usageSeconds: number;
  usageMinutes: number;
  limitMinutes: number;
  remainingMinutes: number;
  isLimitReached: boolean;
  formattedProgress: string; // e.g. "42 / 60 min"
  reminderMilestone?: 15 | 30 | 45 | 55 | 60;
  reminderMessage?: string;
}

/**
 * Calculates start and end ISO timestamps for the current calendar day in patient's timezone.
 */
export function getCalendarDayRange(timeZone: string = 'Asia/Kolkata'): { startISO: string; endISO: string } {
  try {
    const now = new Date();
    // Format current date in patient's timezone (YYYY-MM-DD)
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(now); // e.g. "2026-09-16"

    // Construct start of day in that timezone
    const startObj = new Date(`${dateStr}T00:00:00`);
    const endObj = new Date(`${dateStr}T23:59:59.999`);

    return {
      startISO: startObj.toISOString(),
      endISO: endObj.toISOString(),
    };
  } catch {
    // Fallback: UTC calendar day
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startISO = now.toISOString();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return {
      startISO,
      endISO: end.toISOString(),
    };
  }
}

/**
 * Computes the gentle usage reminder based on minutes spent today.
 */
export function getUsageReminder(usageMinutes: number, limitMinutes: number = DEFAULT_DAILY_LIMIT_MINUTES): {
  milestone?: 15 | 30 | 45 | 55 | 60;
  message?: string;
} {
  if (usageMinutes >= limitMinutes) {
    return {
      milestone: 60,
      message: "Today's activity is complete. You have spent about 1 hour on memory activities today. Taking a break is good for you. Come back tomorrow for your next activity.",
    };
  }
  if (usageMinutes >= 55) {
    return {
      milestone: 55,
      message: "5 minutes of today's activity remaining.",
    };
  }
  if (usageMinutes >= 45) {
    return {
      milestone: 45,
      message: "You have been practicing for 45 minutes.",
    };
  }
  if (usageMinutes >= 30) {
    return {
      milestone: 30,
      message: "You have been practicing for 30 minutes. A short break can be helpful.",
    };
  }
  if (usageMinutes >= 15) {
    return {
      milestone: 15,
      message: "You have been practicing for 15 minutes.",
    };
  }
  return {};
}

/**
 * Calculates total cumulative cognitive-game usage for the authenticated patient today.
 * The database is the source of truth.
 */
export async function getDailyCognitiveUsage(
  patientId: string,
  timeZone: string = 'Asia/Kolkata',
  configuredLimitMinutes: number = DEFAULT_DAILY_LIMIT_MINUTES
): Promise<DailyCognitiveUsage> {
  const limitMinutes = configuredLimitMinutes > 0 ? configuredLimitMinutes : DEFAULT_DAILY_LIMIT_MINUTES;
  const { startISO } = getCalendarDayRange(timeZone);

  let totalUsageSeconds = 0;

  if (isDemoMode()) {
    const demoSessions = getDemoGameSessions(patientId);
    // Sum duration_seconds for sessions played today
    totalUsageSeconds = demoSessions.reduce((acc, s) => {
      const playedTime = new Date(s.played_at).getTime();
      const startTime = new Date(startISO).getTime();
      if (playedTime >= startTime) {
        return acc + (s.duration_seconds || 0);
      }
      return acc;
    }, 0);
  } else {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data: sessions, error } = await supabase
      .from('game_sessions')
      .select('duration_seconds, played_at')
      .eq('patient_id', patientId)
      .gte('played_at', startISO);

    if (!error && sessions) {
      totalUsageSeconds = sessions.reduce((acc, s: any) => acc + (s.duration_seconds || 0), 0);
    }
  }

  const usageMinutes = Math.round(totalUsageSeconds / 60);
  const remainingMinutes = Math.max(0, limitMinutes - usageMinutes);
  const isLimitReached = usageMinutes >= limitMinutes;
  const reminder = getUsageReminder(usageMinutes, limitMinutes);

  return {
    usageSeconds: totalUsageSeconds,
    usageMinutes,
    limitMinutes,
    remainingMinutes,
    isLimitReached,
    formattedProgress: `${usageMinutes} / ${limitMinutes} min`,
    reminderMilestone: reminder.milestone,
    reminderMessage: reminder.message,
  };
}
