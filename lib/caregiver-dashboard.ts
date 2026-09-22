import { isDemoMode, getDemoPatients, getDemoReminders, getDemoRoutines, getDemoGameSessions, DemoPatient, DemoGameSession, DemoReminder } from '@/lib/demo-mode';
import { getDailyCognitiveUsage, DailyCognitiveUsage, DEFAULT_DAILY_LIMIT_MINUTES } from '@/lib/safety-limits';
import { generateSupportiveAIObservations, SupportiveAIObservation } from '@/lib/ai/gemini';

export interface PatientSummaryItem {
  id: string;
  name: string;
  patient_code: string;
  status: 'Active' | 'No recent activity' | 'Daily limit reached' | 'Needs attention';
  todayActivityProgress: string; // e.g. "3 / 3 completed" or "4 / 5 completed"
  currentActivityPerformance: number; // e.g. 76%
  reminderAdherence: number; // e.g. 93%
  lastActiveFormatted: string; // e.g. "Today, 10:42 AM"
  todayUsageMinutes: number;
  dailyLimitMinutes: number;
  relationship: string;
  is_active: boolean;
  preferred_language: string;
  created_at: string;
  last_active_at?: string | null;
}

export interface DailyPerformancePoint {
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  score: number | null;
  sessions: number;
  statusText: string;
}

export interface GameWisePerformanceItem {
  name: string;
  category: string;
  score: number | null;
  sessions: number;
  status: string; // e.g. "82%" or "Not attempted yet"
}

export interface AttentionItem {
  id: string;
  type: 'limit' | 'reminders' | 'inactivity' | 'milestone';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'alert';
}

export interface RecentActivityItem {
  id: string;
  gameName: string;
  playedAt: string;
  formattedDate: string;
  accuracyPct: number;
  avgResponseTimeMs: number;
  durationSeconds: number;
  difficulty: number;
}

export interface CaregiverDashboardData {
  caregiver: {
    id: string;
    name: string;
    email: string;
    preferred_language: string;
  };
  patients: PatientSummaryItem[];
  selectedPatient: DemoPatient | null;
  overview: {
    todayUsage: DailyCognitiveUsage;
    todaySessionsCompleted: number;
    todayTargetActivities: number;
    todayGoalFormatted: string;
    recentAccuracy: number;
    weeklyAverage: number | null;
    previousWeekAverage: number | null;
    weeklyTrendLabel: string;
    status: 'Active' | 'No recent activity' | 'Daily limit reached' | 'Needs attention';
    lastActiveFormatted: string;
  };
  dailyPerformance: DailyPerformancePoint[];
  gamePerformance: GameWisePerformanceItem[];
  reminderStats: {
    total: number;
    completed: number;
    postponed: number;
    missed: number;
    adherenceRatePct: number;
  };
  attentionItems: AttentionItem[];
  recentActivities: RecentActivityItem[];
  aiObservations: SupportiveAIObservation[];
  aiRecommendations: string[];
}

export const STANDARD_GAMES = [
  { name: 'Remember the Objects', category: 'Visual Memory' },
  { name: 'Sequence Recall', category: 'Working Memory' },
  { name: 'Find the Pair', category: 'Associative Memory' },
  { name: 'What Changed?', category: 'Visual Attention' },
  { name: 'Story Recall', category: 'Verbal Memory' },
  { name: 'Daily Routine Recall', category: 'Routine Memory' },
  { name: 'Who / Where / When?', category: 'Orientation & Episodic' },
];

/**
 * Calculates start and end timestamps for the current calendar week (Monday 00:00:00 to Sunday 23:59:59)
 * and the previous calendar week.
 */
function getWeekBoundaries(): {
  currentWeekStart: Date;
  currentWeekEnd: Date;
  previousWeekStart: Date;
  previousWeekEnd: Date;
} {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = (currentDay + 6) % 7; // days since Monday

  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - distanceToMonday);
  currentWeekStart.setHours(0, 0, 0, 0);

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(currentWeekStart.getDate() - 7);

  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setMilliseconds(-1);

  return {
    currentWeekStart,
    currentWeekEnd,
    previousWeekStart,
    previousWeekEnd,
  };
}

/**
 * Formats relative or absolute time for last active display
 */
function formatLastActive(isoString?: string | null): string {
  if (!isoString) return 'No recent activity';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 5) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) {
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return isToday ? `Today, ${timeStr}` : `Yesterday, ${timeStr}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Evaluates patient status based on strict real activity rules (non-diagnostic)
 */
function evaluatePatientStatus(
  dailyUsage: DailyCognitiveUsage,
  recentSessionsCount: number,
  lastActiveIso?: string | null,
  reminderAdherence?: number
): 'Active' | 'No recent activity' | 'Daily limit reached' | 'Needs attention' {
  if (dailyUsage.isLimitReached) {
    return 'Daily limit reached';
  }

  // Check reminder adherence flag (non-diagnostic application condition)
  if (typeof reminderAdherence === 'number' && reminderAdherence < 60 && reminderAdherence > 0) {
    return 'Needs attention';
  }

  if (!lastActiveIso || recentSessionsCount === 0) {
    return 'No recent activity';
  }

  const lastActiveTime = new Date(lastActiveIso).getTime();
  const hoursSinceActive = (Date.now() - lastActiveTime) / (1000 * 60 * 60);

  if (hoursSinceActive > 48) {
    return 'No recent activity';
  }

  return 'Active';
}

/**
 * Main aggregator: fetches and calculates all caregiver dashboard data
 */
export async function getCaregiverDashboardData(params?: string | {
  caregiverId?: string;
  patientId?: string;
}): Promise<CaregiverDashboardData> {
  const patientId = typeof params === 'string' ? params : params?.patientId;
  const caregiverId = typeof params === 'string' ? undefined : params?.caregiverId;

  if (isDemoMode()) {
    const patients = getDemoPatients();
    const selectedPatient = (patientId ? patients.find((p) => p.id === patientId) : null) || patients[0];
    const sessions = getDemoGameSessions(selectedPatient.id);
    const reminders = getDemoReminders(selectedPatient.id);
    const routines = getDemoRoutines(selectedPatient.id);
    const dailyUsage = await getDailyCognitiveUsage(selectedPatient.id, selectedPatient.time_zone || 'Asia/Kolkata');

    const { currentWeekStart, previousWeekStart, previousWeekEnd } = getWeekBoundaries();

    // 1. Session Splitting: Current Week vs Previous Week vs Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySessions = sessions.filter((s) => new Date(s.played_at).getTime() >= todayStart.getTime());
    const currentWeekSessions = sessions.filter((s) => new Date(s.played_at).getTime() >= currentWeekStart.getTime());
    const previousWeekSessions = sessions.filter((s) => {
      const time = new Date(s.played_at).getTime();
      return time >= previousWeekStart.getTime() && time <= previousWeekEnd.getTime();
    });

    // 2. Weekly Average Calculation: SUM(valid performance) / COUNT(valid completed sessions)
    const computeAvgAccuracy = (sessList: DemoGameSession[]): number | null => {
      const completed = sessList.filter((s) => s.completed !== false);
      if (completed.length === 0) return null;
      const total = completed.reduce((acc, s) => acc + (s.accuracy > 1 ? s.accuracy : s.accuracy * 100), 0);
      return Math.round(total / completed.length);
    };

    const weeklyAvg = computeAvgAccuracy(currentWeekSessions);
    const prevWeeklyAvg = computeAvgAccuracy(previousWeekSessions);

    let weeklyTrendLabel = 'Building baseline';
    if (weeklyAvg !== null && prevWeeklyAvg !== null) {
      const diff = weeklyAvg - prevWeeklyAvg;
      weeklyTrendLabel = diff >= 0 ? `↑ ${diff}% from last week` : `↓ ${Math.abs(diff)}% from last week`;
    }

    // 3. 7-Day Daily Breakdown (Monday through Sunday)
    const dayNames: DailyPerformancePoint['dayName'][] = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];

    const dailyPerformance: DailyPerformancePoint[] = dayNames.map((dayName, idx) => {
      // Monday is day 1, Sunday is day 0
      const targetJsDay = idx === 6 ? 0 : idx + 1;
      const daySessions = currentWeekSessions.filter((s) => new Date(s.played_at).getDay() === targetJsDay);

      if (daySessions.length === 0) {
        return {
          dayName,
          score: null,
          sessions: 0,
          statusText: 'Not enough activity data yet',
        };
      }

      const avg = computeAvgAccuracy(daySessions);
      return {
        dayName,
        score: avg,
        sessions: daySessions.length,
        statusText: avg !== null ? `${avg}%` : 'Not enough activity data yet',
      };
    });

    // 4. Game-Wise Performance (Standard 7 Games)
    const gamePerformance: GameWisePerformanceItem[] = STANDARD_GAMES.map((game) => {
      const gameSessions = sessions.filter(
        (s) => s.game_name.toLowerCase().trim() === game.name.toLowerCase().trim()
      );

      if (gameSessions.length === 0) {
        return {
          name: game.name,
          category: game.category,
          score: null,
          sessions: 0,
          status: 'Not attempted yet',
        };
      }

      const avg = computeAvgAccuracy(gameSessions);
      return {
        name: game.name,
        category: game.category,
        score: avg,
        sessions: gameSessions.length,
        status: avg !== null ? `${avg}%` : 'Not attempted yet',
      };
    });

    // 5. Reminder Adherence
    const totalReminders = reminders.length;
    const acknowledgedReminders = reminders.filter((r) => r.is_done || r.status === 'acknowledged').length;
    const postponedReminders = reminders.filter((r) => r.status === 'postponed').length;
    const missedReminders = reminders.filter((r) => r.status === 'missed').length;
    const reminderAdherence =
      totalReminders > 0 ? Math.round((acknowledgedReminders / totalReminders) * 1000) / 10 : 100;

    // 6. Patient Status & Engagement
    const recentAccuracy = computeAvgAccuracy(sessions.slice(0, 5)) ?? (weeklyAvg ?? 76);
    const todayTarget = selectedPatient.daily_target_activities || 3;
    const patientStatus = evaluatePatientStatus(
      dailyUsage,
      sessions.length,
      selectedPatient.last_active_at,
      reminderAdherence
    );

    // 7. Attention Items
    const attentionItems: AttentionItem[] = [];
    if (dailyUsage.isLimitReached) {
      attentionItems.push({
        id: 'att-limit',
        type: 'limit',
        title: 'Daily Cognitive Activity Limit Reached',
        message: `${selectedPatient.name} has practiced for ${dailyUsage.usageMinutes} minutes today. Rest is recommended until tomorrow.`,
        severity: 'info',
      });
    }
    if (postponedReminders > 0) {
      attentionItems.push({
        id: 'att-rem-postponed',
        type: 'reminders',
        title: `${postponedReminders} Reminder Postponed`,
        message: 'A scheduled routine task was postponed. Consider gently checking in.',
        severity: 'warning',
      });
    }
    if (patientStatus === 'Active' && !dailyUsage.isLimitReached) {
      attentionItems.push({
        id: 'att-good-engagement',
        type: 'milestone',
        title: 'Consistent Activity Engagement',
        message: `${selectedPatient.name} completed ${todaySessions.length} session(s) today within recommended comfort bounds.`,
        severity: 'info',
      });
    }

    // 8. Recent Activities Feed
    const recentActivities: RecentActivityItem[] = sessions.slice(0, 10).map((s) => {
      const d = new Date(s.played_at);
      const formattedDate = `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      return {
        id: s.id,
        gameName: s.game_name,
        playedAt: s.played_at,
        formattedDate,
        accuracyPct: Math.round(s.accuracy > 1 ? s.accuracy : s.accuracy * 100),
        avgResponseTimeMs: s.avg_response_time_ms,
        durationSeconds: s.duration_seconds || 60,
        difficulty: s.difficulty_level,
      };
    });

    // 9. AI Observations from Structured Real Metrics
    const visualGame = gamePerformance.find((g) => g.name === 'Remember the Objects');
    const routineGame = gamePerformance.find((g) => g.name === 'Daily Routine Recall');

    const aiRes = await generateSupportiveAIObservations({
      patientName: selectedPatient.name,
      language: selectedPatient.preferred_language || 'en',
      metrics: {
        weeklyAverage: weeklyAvg ?? 74,
        previousWeekAverage: prevWeeklyAvg,
        routineRecall: routineGame?.score ?? 59,
        visualMemory: visualGame?.score ?? 82,
        sessionsCompleted: currentWeekSessions.length,
        sessionsScheduled: todayTarget * 7,
        reminderAdherence: Math.round(reminderAdherence),
      },
    });

    // 10. Patient Summaries for Patient Selector / Directory
    const patientSummaries: PatientSummaryItem[] = patients.map((p) => {
      const pSessions = getDemoGameSessions(p.id);
      const pTodaySessions = pSessions.filter((s) => new Date(s.played_at).getTime() >= todayStart.getTime());
      const pAvg = computeAvgAccuracy(pSessions) ?? 76;
      const pReminders = getDemoReminders(p.id);
      const pAck = pReminders.filter((r) => r.is_done || r.status === 'acknowledged').length;
      const pAdh = pReminders.length > 0 ? Math.round((pAck / pReminders.length) * 100) : 100;
      const pStatus = evaluatePatientStatus(
        dailyUsage,
        pSessions.length,
        p.last_active_at,
        pAdh
      );

      return {
        id: p.id,
        name: p.name,
        patient_code: p.patient_code,
        status: pStatus,
        todayActivityProgress: `${pTodaySessions.length} / ${p.daily_target_activities || 3} completed`,
        currentActivityPerformance: pAvg,
        reminderAdherence: pAdh,
        lastActiveFormatted: formatLastActive(p.last_active_at),
        todayUsageMinutes: dailyUsage.usageMinutes,
        dailyLimitMinutes: dailyUsage.limitMinutes,
        relationship: p.relationship || 'Care Recipient',
        is_active: p.is_active !== false,
        preferred_language: p.preferred_language || 'en',
        created_at: p.created_at || new Date().toISOString(),
        last_active_at: p.last_active_at,
      };
    });

    return {
      caregiver: {
        id: 'demo-caregiver-1',
        name: 'Rahul Sharma',
        email: 'demo@memorycare.app',
        preferred_language: 'en',
      },
      patients: patientSummaries,
      selectedPatient,
      overview: {
        todayUsage: dailyUsage,
        todaySessionsCompleted: todaySessions.length,
        todayTargetActivities: todayTarget,
        todayGoalFormatted: `${todaySessions.length} / ${todayTarget} Completed`,
        recentAccuracy,
        weeklyAverage: weeklyAvg,
        previousWeekAverage: prevWeeklyAvg,
        weeklyTrendLabel,
        status: patientStatus,
        lastActiveFormatted: formatLastActive(selectedPatient.last_active_at),
      },
      dailyPerformance,
      gamePerformance,
      reminderStats: {
        total: totalReminders,
        completed: acknowledgedReminders,
        postponed: postponedReminders,
        missed: missedReminders,
        adherenceRatePct: reminderAdherence,
      },
      attentionItems,
      recentActivities,
      aiObservations: aiRes.observations,
      aiRecommendations: aiRes.recommendations,
    };
  }

  // ==========================================
  // SUPABASE PRODUCTION PIPELINE
  // ==========================================
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized caregiver');
  }

  // Fetch caregiver profile
  const { data: caregiver } = await supabase
    .from('caregivers')
    .select('id, name, email, preferred_language')
    .eq('id', user.id)
    .single();

  // Enforce Caregiver-Patient authorization
  const { data: dbPatients } = await supabase
    .from('patients')
    .select('*')
    .eq('caregiver_id', user.id)
    .order('created_at', { ascending: true });

  const authorizedPatients = (dbPatients || []) as unknown as DemoPatient[];

  if (authorizedPatients.length === 0) {
    return {
      caregiver: {
        id: user.id,
        name: caregiver?.name || 'Caregiver',
        email: user.email || '',
        preferred_language: caregiver?.preferred_language || 'en',
      },
      patients: [],
      selectedPatient: null,
      overview: {
        todayUsage: {
          usageSeconds: 0,
          usageMinutes: 0,
          limitMinutes: DEFAULT_DAILY_LIMIT_MINUTES,
          remainingMinutes: DEFAULT_DAILY_LIMIT_MINUTES,
          isLimitReached: false,
          formattedProgress: `0 / ${DEFAULT_DAILY_LIMIT_MINUTES} min`,
        },
        todaySessionsCompleted: 0,
        todayTargetActivities: 3,
        todayGoalFormatted: '0 / 3 Completed',
        recentAccuracy: 0,
        weeklyAverage: null,
        previousWeekAverage: null,
        weeklyTrendLabel: 'Building baseline',
        status: 'No recent activity',
        lastActiveFormatted: 'No recent activity',
      },
      dailyPerformance: [],
      gamePerformance: STANDARD_GAMES.map((g) => ({
        name: g.name,
        category: g.category,
        score: null,
        sessions: 0,
        status: 'Not attempted yet',
      })),
      reminderStats: {
        total: 0,
        completed: 0,
        postponed: 0,
        missed: 0,
        adherenceRatePct: 100,
      },
      attentionItems: [],
      recentActivities: [],
      aiObservations: [],
      aiRecommendations: [],
    };
  }

  // Pick authorized patient
  const targetPatient =
    (patientId ? authorizedPatients.find((p) => p.id === patientId) : null) ||
    authorizedPatients[0];

  const dailyUsage = await getDailyCognitiveUsage(targetPatient.id, targetPatient.time_zone || 'Asia/Kolkata');
  const { currentWeekStart, previousWeekStart, previousWeekEnd } = getWeekBoundaries();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Parallel fetch for patient data
  const [sessionsRes, remindersRes, gamesRes] = await Promise.all([
    supabase
      .from('game_sessions')
      .select('id, difficulty_level, accuracy, avg_response_time_ms, mistakes, completed, played_at, duration_seconds, games(name)')
      .eq('patient_id', targetPatient.id)
      .order('played_at', { ascending: false })
      .limit(50),
    supabase
      .from('reminders')
      .select('*')
      .eq('patient_id', targetPatient.id),
    supabase.from('games').select('id, name, category'),
  ]);

  const rawSessions = sessionsRes.data || [];
  const rawReminders = remindersRes.data || [];

  const sessions: DemoGameSession[] = rawSessions.map((s: any) => ({
    id: s.id,
    patient_id: targetPatient.id,
    game_name: s.games?.name || 'Cognitive Game',
    difficulty_level: s.difficulty_level,
    accuracy: s.accuracy,
    avg_response_time_ms: s.avg_response_time_ms,
    duration_seconds: s.duration_seconds || 60,
    mistakes: s.mistakes,
    completed: s.completed,
    played_at: s.played_at,
  }));

  // Calculations for Supabase
  const todaySessions = sessions.filter((s) => new Date(s.played_at).getTime() >= todayStart.getTime());
  const currentWeekSessions = sessions.filter((s) => new Date(s.played_at).getTime() >= currentWeekStart.getTime());
  const previousWeekSessions = sessions.filter((s) => {
    const time = new Date(s.played_at).getTime();
    return time >= previousWeekStart.getTime() && time <= previousWeekEnd.getTime();
  });

  const computeAvgAccuracy = (sessList: DemoGameSession[]): number | null => {
    const completed = sessList.filter((s) => s.completed !== false);
    if (completed.length === 0) return null;
    const total = completed.reduce((acc, s) => acc + (s.accuracy > 1 ? s.accuracy : s.accuracy * 100), 0);
    return Math.round(total / completed.length);
  };

  const weeklyAvg = computeAvgAccuracy(currentWeekSessions);
  const prevWeeklyAvg = computeAvgAccuracy(previousWeekSessions);

  let weeklyTrendLabel = 'Building baseline';
  if (weeklyAvg !== null && prevWeeklyAvg !== null) {
    const diff = weeklyAvg - prevWeeklyAvg;
    weeklyTrendLabel = diff >= 0 ? `↑ ${diff}% from last week` : `↓ ${Math.abs(diff)}% from last week`;
  }

  // 7-day breakdown
  const dayNames: DailyPerformancePoint['dayName'][] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
  const dailyPerformance: DailyPerformancePoint[] = dayNames.map((dayName, idx) => {
    const targetJsDay = idx === 6 ? 0 : idx + 1;
    const daySessions = currentWeekSessions.filter((s) => new Date(s.played_at).getDay() === targetJsDay);
    if (daySessions.length === 0) {
      return {
        dayName,
        score: null,
        sessions: 0,
        statusText: 'Not enough activity data yet',
      };
    }
    const avg = computeAvgAccuracy(daySessions);
    return {
      dayName,
      score: avg,
      sessions: daySessions.length,
      statusText: avg !== null ? `${avg}%` : 'Not enough activity data yet',
    };
  });

  // Game-wise performance
  const gamePerformance: GameWisePerformanceItem[] = STANDARD_GAMES.map((game) => {
    const gameSessions = sessions.filter(
      (s) => s.game_name.toLowerCase().trim() === game.name.toLowerCase().trim()
    );
    if (gameSessions.length === 0) {
      return {
        name: game.name,
        category: game.category,
        score: null,
        sessions: 0,
        status: 'Not attempted yet',
      };
    }
    const avg = computeAvgAccuracy(gameSessions);
    return {
      name: game.name,
      category: game.category,
      score: avg,
      sessions: gameSessions.length,
      status: avg !== null ? `${avg}%` : 'Not attempted yet',
    };
  });

  // Reminders
  const totalReminders = rawReminders.length;
  const acknowledgedReminders = rawReminders.filter((r) => r.is_done || r.status === 'acknowledged').length;
  const postponedReminders = rawReminders.filter((r) => r.status === 'postponed').length;
  const missedReminders = rawReminders.filter((r) => r.status === 'missed').length;
  const reminderAdherence =
    totalReminders > 0 ? Math.round((acknowledgedReminders / totalReminders) * 1000) / 10 : 100;

  const recentAccuracy = computeAvgAccuracy(sessions.slice(0, 5)) ?? (weeklyAvg ?? 0);
  const todayTarget = targetPatient.daily_target_activities || 3;
  const patientStatus = evaluatePatientStatus(
    dailyUsage,
    sessions.length,
    targetPatient.last_active_at,
    reminderAdherence
  );

  const attentionItems: AttentionItem[] = [];
  if (dailyUsage.isLimitReached) {
    attentionItems.push({
      id: 'att-limit',
      type: 'limit',
      title: 'Daily Cognitive Activity Limit Reached',
      message: `${targetPatient.name} has reached their 60-minute cognitive activity limit for today.`,
      severity: 'info',
    });
  }

  const recentActivities: RecentActivityItem[] = sessions.slice(0, 10).map((s) => {
    const d = new Date(s.played_at);
    return {
      id: s.id,
      gameName: s.game_name,
      playedAt: s.played_at,
      formattedDate: `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
      accuracyPct: Math.round(s.accuracy > 1 ? s.accuracy : s.accuracy * 100),
      avgResponseTimeMs: s.avg_response_time_ms,
      durationSeconds: s.duration_seconds || 60,
      difficulty: s.difficulty_level,
    };
  });

  const visualGame = gamePerformance.find((g) => g.name === 'Remember the Objects');
  const routineGame = gamePerformance.find((g) => g.name === 'Daily Routine Recall');

  const aiRes = await generateSupportiveAIObservations({
    patientName: targetPatient.name,
    language: targetPatient.preferred_language || 'en',
    metrics: {
      weeklyAverage: weeklyAvg ?? 70,
      previousWeekAverage: prevWeeklyAvg,
      routineRecall: routineGame?.score ?? null,
      visualMemory: visualGame?.score ?? null,
      sessionsCompleted: currentWeekSessions.length,
      sessionsScheduled: todayTarget * 7,
      reminderAdherence: Math.round(reminderAdherence),
    },
  });

  const patientSummaries: PatientSummaryItem[] = authorizedPatients.map((p) => {
    const isSelected = p.id === targetPatient.id;
    return {
      id: p.id,
      name: p.name,
      patient_code: p.patient_code,
      status: isSelected ? patientStatus : 'Active',
      todayActivityProgress: isSelected
        ? `${todaySessions.length} / ${p.daily_target_activities || 3} completed`
        : `0 / ${p.daily_target_activities || 3} completed`,
      currentActivityPerformance: isSelected ? recentAccuracy : 0,
      reminderAdherence: isSelected ? Math.round(reminderAdherence) : 100,
      lastActiveFormatted: formatLastActive(p.last_active_at),
      todayUsageMinutes: isSelected ? dailyUsage.usageMinutes : 0,
      dailyLimitMinutes: dailyUsage.limitMinutes,
      relationship: (p as any).relationship || 'Care Recipient',
      is_active: p.is_active !== false,
      preferred_language: p.preferred_language || 'en',
      created_at: p.created_at || new Date().toISOString(),
      last_active_at: p.last_active_at,
    };
  });

  return {
    caregiver: {
      id: user.id,
      name: caregiver?.name || user.email?.split('@')[0] || 'Caregiver',
      email: user.email || '',
      preferred_language: caregiver?.preferred_language || 'en',
    },
    patients: patientSummaries,
    selectedPatient: targetPatient,
    overview: {
      todayUsage: dailyUsage,
      todaySessionsCompleted: todaySessions.length,
      todayTargetActivities: todayTarget,
      todayGoalFormatted: `${todaySessions.length} / ${todayTarget} Completed`,
      recentAccuracy,
      weeklyAverage: weeklyAvg,
      previousWeekAverage: prevWeeklyAvg,
      weeklyTrendLabel,
      status: patientStatus,
      lastActiveFormatted: formatLastActive(targetPatient.last_active_at),
    },
    dailyPerformance,
    gamePerformance,
    reminderStats: {
      total: totalReminders,
      completed: acknowledgedReminders,
      postponed: postponedReminders,
      missed: missedReminders,
      adherenceRatePct: reminderAdherence,
    },
    attentionItems,
    recentActivities,
    aiObservations: aiRes.observations,
    aiRecommendations: aiRes.recommendations,
  };
}
