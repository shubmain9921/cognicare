'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { isDemoMode } from '@/lib/demo-mode';
import { generateCaregiverWeeklySummary, WeeklyMetrics } from '@/lib/ai/gemini';

export interface WeeklyReportResult {
  error?: string;
  success?: boolean;
  reportId?: string;
  summaryText?: string;
  recommendations?: string[];
  metrics?: WeeklyMetrics;
}

/**
 * Generates a weekly report for a patient by aggregating 7-day game sessions and reminders
 * Pre-calculates all metrics deterministically, then invokes Gemini for narrative summary.
 */
export async function generateWeeklyReport(patientId: string): Promise<WeeklyReportResult> {
  if (isDemoMode()) {
    // Generate real metrics for demo patient
    const mockMetrics: WeeklyMetrics = {
      week_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total_sessions_completed: 6,
      overall_accuracy_percent: 78,
      avg_response_time_ms: 2400,
      total_mistakes: 3,
      reminder_adherence_percent: 92,
      reminders_completed: 12,
      total_reminders: 13,
      per_game_breakdown: {
        'Remember the Objects': { sessions: 2, avgAccuracy: 85, avgSpeedSec: '2.1' },
        'Find the Pair': { sessions: 2, avgAccuracy: 80, avgSpeedSec: '2.3' },
        'Story Recall': { sessions: 1, avgAccuracy: 75, avgSpeedSec: '3.1' },
        'Daily Routine Recall': { sessions: 1, avgAccuracy: 70, avgSpeedSec: '2.8' },
      },
    };

    const { summaryText, recommendations } = await generateCaregiverWeeklySummary({
      patientName: 'Anita Sharma',
      language: 'en',
      metrics: mockMetrics,
    });

    revalidatePath('/caregiver/dashboard');
    return {
      success: true,
      reportId: `demo-weekly-report-${Date.now()}`,
      summaryText,
      recommendations,
      metrics: mockMetrics,
    };
  }

  const supabase = createClient();
  const {
    data: { user: caregiverUser },
  } = await supabase.auth.getUser();

  if (!caregiverUser) {
    return { error: 'Unauthorized.' };
  }

  // 1. Fetch caregiver preferred language
  const { data: caregiver } = await supabase
    .from('caregivers')
    .select('preferred_language')
    .eq('id', caregiverUser.id)
    .maybeSingle();

  const caregiverLang = caregiver?.preferred_language || 'en';

  // 2. Verify patient belongs to caregiver
  const { data: patient, error: patientErr } = await supabase
    .from('patients')
    .select('id, name, caregiver_id')
    .eq('id', patientId)
    .eq('caregiver_id', caregiverUser.id)
    .single();

  if (patientErr || !patient) {
    return { error: 'Patient not found or unauthorized.' };
  }

  // 3. Fetch past 7 days of game sessions
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();
  const weekStartDate = sevenDaysAgo.toISOString().split('T')[0];

  const { data: sessions } = await supabase
    .from('game_sessions')
    .select(`
      id,
      game_id,
      difficulty_level,
      accuracy,
      avg_response_time_ms,
      mistakes,
      completed,
      played_at,
      games (
        name,
        category
      )
    `)
    .eq('patient_id', patientId)
    .gte('played_at', sevenDaysAgoISO)
    .order('played_at', { ascending: true });

  // 4. Fetch reminders adherence
  const { data: reminders } = await supabase
    .from('reminders')
    .select('id, title, type, is_done')
    .eq('patient_id', patientId);

  const sessionList = sessions || [];
  const reminderList = reminders || [];

  const totalReminders = reminderList.length;
  const doneReminders = reminderList.filter((r) => r.is_done).length;
  const adherenceRatePct =
    totalReminders > 0 ? Math.round((doneReminders / totalReminders) * 100) : 100;

  // Aggregate Game Metrics deterministically
  const totalSessions = sessionList.length;
  let totalAccuracySum = 0;
  let totalResponseTimeSum = 0;
  let totalMistakesSum = 0;

  const perGameMap: Record<
    string,
    { sessionsCount: number; accuracySum: number; responseTimeSum: number; mistakesSum: number }
  > = {};

  sessionList.forEach((s: any) => {
    const acc = s.accuracy > 1 ? s.accuracy / 100 : s.accuracy;
    totalAccuracySum += acc;
    totalResponseTimeSum += s.avg_response_time_ms || 0;
    totalMistakesSum += s.mistakes || 0;

    const gameName = s.games?.name || 'General Exercise';
    if (!perGameMap[gameName]) {
      perGameMap[gameName] = {
        sessionsCount: 0,
        accuracySum: 0,
        responseTimeSum: 0,
        mistakesSum: 0,
      };
    }
    perGameMap[gameName].sessionsCount += 1;
    perGameMap[gameName].accuracySum += acc;
    perGameMap[gameName].responseTimeSum += s.avg_response_time_ms || 0;
    perGameMap[gameName].mistakesSum += s.mistakes || 0;
  });

  const overallAvgAccuracy =
    totalSessions > 0 ? Math.round((totalAccuracySum / totalSessions) * 100) : 0;
  const overallAvgResponseTime =
    totalSessions > 0 ? Math.round(totalResponseTimeSum / totalSessions) : 0;

  const perGameBreakdown: Record<string, { sessions: number; avgAccuracy: number; avgSpeedSec: string }> = {};
  Object.keys(perGameMap).forEach((name) => {
    const item = perGameMap[name];
    perGameBreakdown[name] = {
      sessions: item.sessionsCount,
      avgAccuracy: Math.round((item.accuracySum / item.sessionsCount) * 100),
      avgSpeedSec: (item.responseTimeSum / item.sessionsCount / 1000).toFixed(1),
    };
  });

  const metricsJson: WeeklyMetrics = {
    week_start: weekStartDate,
    total_sessions_completed: totalSessions,
    overall_accuracy_percent: overallAvgAccuracy,
    avg_response_time_ms: overallAvgResponseTime,
    total_mistakes: totalMistakesSum,
    reminder_adherence_percent: adherenceRatePct,
    reminders_completed: doneReminders,
    total_reminders: totalReminders,
    per_game_breakdown: perGameBreakdown,
  };

  // 5. Generate AI Summary & Recommendations via Google Gemini
  const { summaryText, recommendations } = await generateCaregiverWeeklySummary({
    patientName: patient.name,
    language: caregiverLang,
    metrics: metricsJson,
  });

  // 6. Save to weekly_reports table
  const { data: insertedReport, error: reportErr } = await supabase
    .from('weekly_reports')
    .insert({
      patient_id: patientId,
      week_start: weekStartDate,
      summary_text: summaryText,
      metrics_json: {
        ...metricsJson,
        recommendations,
      },
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (reportErr) {
    console.error('Failed to save weekly report:', reportErr);
    return { error: reportErr.message };
  }

  revalidatePath('/caregiver/dashboard');
  return {
    success: true,
    reportId: insertedReport.id,
    summaryText,
    recommendations,
    metrics: metricsJson,
  };
}
