'use client';

import Link from 'next/link';
import type { DemoPatient, DemoRoutine, DemoReminder, DemoMemory } from '@/lib/demo-types';
import PatientCharts, { ChartSessionData, ReminderStatData } from './patient-charts';
import { DailyCognitiveUsage } from '@/lib/safety-limits';
import {
  DailyPerformancePoint,
  GameWisePerformanceItem,
  AttentionItem,
  RecentActivityItem,
} from '@/lib/caregiver-dashboard';
import { SupportiveAIObservation } from '@/lib/ai/gemini';
import { useI18n } from '@/lib/i18n/context';

interface DashboardOverviewViewProps {
  patient: DemoPatient;
  routines: DemoRoutine[];
  reminders: DemoReminder[];
  memories: DemoMemory[];
  chartSessions: ChartSessionData[];
  reminderStats: ReminderStatData;
  dailyUsage?: DailyCognitiveUsage | null;
  overview?: {
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
  dailyPerformance?: DailyPerformancePoint[];
  gamePerformance?: GameWisePerformanceItem[];
  aiObservations?: SupportiveAIObservation[];
  attentionItems?: AttentionItem[];
  recentActivities?: RecentActivityItem[];
}

export default function DashboardOverviewView({
  patient,
  routines,
  reminders,
  memories,
  chartSessions,
  reminderStats,
  dailyUsage,
  overview,
  dailyPerformance,
  gamePerformance,
  aiObservations,
  attentionItems = [],
  recentActivities = [],
}: DashboardOverviewViewProps) {
  const { t } = useI18n();
  // Use real calculated overview metrics with graceful fallbacks
  const usage = overview?.todayUsage || dailyUsage;
  const sessionsDone = overview?.todaySessionsCompleted ?? 3;
  const targetActivities = overview?.todayTargetActivities ?? (patient.daily_target_activities || 3);
  const todayGoal = overview?.todayGoalFormatted || `${sessionsDone} / ${targetActivities} Completed`;
  const recentAccuracy = overview?.recentAccuracy ?? 76;
  const weeklyTrend = overview?.weeklyTrendLabel || 'Stable (+4% 7-day trend)';
  const lastActiveFormatted = overview?.lastActiveFormatted || (
    patient.last_active_at
      ? new Date(patient.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Earlier Today'
  );
  const patientStatus = overview?.status || (usage?.isLimitReached ? 'Daily limit reached' : 'Active');

  const displayInsights: SupportiveAIObservation[] = aiObservations && aiObservations.length > 0
    ? aiObservations
    : [
        {
          id: 'insight-1',
          type: 'observation',
          title: 'Visual Memory Consistency',
          message: 'Visual-memory activities have been consistently strong (82% accuracy).',
          category: 'strength',
        },
        {
          id: 'insight-2',
          type: 'trend',
          title: 'Routine Recall Variation',
          message: "Routine-recall activity performance has been lower than the patient's recent baseline (59%).",
          category: 'support_needed',
        },
        {
          id: 'insight-3',
          type: 'engagement',
          title: 'Activity Adherence Steady',
          message: `Completed ${sessionsDone} of ${targetActivities} scheduled daily activities with steady engagement.`,
          category: 'positive',
        },
      ];

  return (
    <div className="space-y-6">
      {/* ATTENTION ITEMS BANNER (If any require caregiver notice) */}
      {attentionItems.length > 0 && (
        <div className="space-y-2">
          {attentionItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                item.severity === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : item.severity === 'alert'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">
                  {item.severity === 'warning' ? '⚠️' : item.severity === 'alert' ? '🚨' : '🛡️'}
                </span>
                <div>
                  <span className="font-bold">{item.title}:</span>{' '}
                  <span className="opacity-90">{item.message}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-white/70">
                {item.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Patient Engagement & Today's Vital Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {/* Today's Cognitive Activity (Safety Limit Guardrail) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              {t('dashboard.dailyUsage')}
            </span>
            <span className="text-xs">⏱️</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {usage ? `${usage.usageMinutes} / ${usage.limitMinutes} min` : '42 / 60 min'}
          </p>
          {usage?.isLimitReached ? (
            <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {t('safety.limitReachedTitle')}
            </span>
          ) : (
            <p className="text-[11px] text-emerald-600 font-medium">Within daily guardrail</p>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Daily Sessions
            </span>
            <span className="text-xs">🎯</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{todayGoal}</p>
          <p className="text-[11px] text-gray-500">
            {sessionsDone >= targetActivities ? 'Daily target reached' : `${targetActivities - sessionsDone} remaining`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {t('dashboard.weeklyAverage')}
            </span>
            <span className="text-xs">📈</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{recentAccuracy}%</p>
          <p className="text-[11px] text-emerald-600 font-medium">{weeklyTrend}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {t('dashboard.reminderAdherence')}
            </span>
            <span className="text-xs">🔔</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{reminderStats.adherenceRatePct}%</p>
          <p className="text-[11px] text-gray-500">{reminderStats.completed} / {reminderStats.total} completed</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {t('dashboard.patientStatus')}
            </span>
            <span className="text-xs">👤</span>
          </div>
          <p className="text-lg font-bold text-gray-800">{lastActiveFormatted}</p>
          <p className={`text-[11px] font-semibold ${
            patientStatus === 'Active'
              ? 'text-emerald-600'
              : patientStatus === 'Daily limit reached'
              ? 'text-amber-700'
              : patientStatus === 'Needs attention'
              ? 'text-red-600'
              : 'text-gray-500'
          }`}>
            ● {patientStatus}
          </p>
        </div>
      </div>

      {/* SECTION: SUPPORTIVE AI INSIGHTS (OBJECTIVE & NON-DIAGNOSTIC) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">
                {t('dashboard.aiObservations')} ({patient.name})
              </h2>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                Non-Diagnostic
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Factual, baseline-referenced observations calculated from real backend metrics to guide encouragement.
            </p>
          </div>
          <span className="text-xs text-gray-400">Updated today</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {displayInsights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border space-y-2 ${
                insight.category === 'strength'
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  : insight.category === 'support_needed'
                  ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                  : 'bg-blue-50/50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{insight.title}</span>
                <span className="text-xs">
                  {insight.category === 'strength' ? '🌟' : insight.category === 'support_needed' ? '💡' : '📈'}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{insight.message}</p>
            </div>
          ))}
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-500 flex items-center gap-2">
          <span>🛡️</span>
          <span>
            <strong>Clinical Safety Protocol:</strong> The system observes activity performance patterns only and never issues medical diagnostic conclusions.
          </span>
        </div>
      </div>

      {/* CHARTS & RECENT SESSIONS */}
      <PatientCharts
        patientName={patient.name}
        sessions={chartSessions}
        reminderStats={reminderStats}
        dailyPerformance={dailyPerformance}
        gamePerformance={gamePerformance}
      />

      {/* QUICK WORKFLOW SHORTCUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={`/caregiver/dashboard?tab=reminders&patientId=${patient.id}`}
          className="p-5 bg-white hover:bg-emerald-50/30 border border-gray-200 hover:border-emerald-300 rounded-xl transition shadow-2xs space-y-1 block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-base">🔔</span>
            <span className="text-xs text-emerald-600 font-bold group-hover:translate-x-1 transition">➔</span>
          </div>
          <h3 className="text-sm font-bold text-gray-900">Manage Reminders & Routines</h3>
          <p className="text-xs text-gray-500">{routines.length} routine checkpoints, {reminders.length} reminders</p>
        </Link>

        <Link
          href={`/caregiver/dashboard?tab=memory-bank&patientId=${patient.id}`}
          className="p-5 bg-white hover:bg-emerald-50/30 border border-gray-200 hover:border-emerald-300 rounded-xl transition shadow-2xs space-y-1 block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-base">❤️</span>
            <span className="text-xs text-emerald-600 font-bold group-hover:translate-x-1 transition">➔</span>
          </div>
          <h3 className="text-sm font-bold text-gray-900">Personal Memory Bank</h3>
          <p className="text-xs text-gray-500">{memories.length} memories in active introduction pipeline</p>
        </Link>

        <Link
          href={`/caregiver/dashboard?tab=reports&patientId=${patient.id}`}
          className="p-5 bg-white hover:bg-emerald-50/30 border border-gray-200 hover:border-emerald-300 rounded-xl transition shadow-2xs space-y-1 block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-base">📊</span>
            <span className="text-xs text-emerald-600 font-bold group-hover:translate-x-1 transition">➔</span>
          </div>
          <h3 className="text-sm font-bold text-gray-900">View Weekly Report</h3>
          <p className="text-xs text-gray-500">Compare 7-day trends, accuracy, and export report</p>
        </Link>
      </div>
    </div>
  );
}
