'use client';

import { useState } from 'react';
import { generateWeeklyReport } from '@/app/actions/weekly-reports';

export interface WeeklyReportItem {
  id: string;
  patient_id: string;
  week_start: string;
  summary_text: string | null;
  metrics_json: any;
  created_at: string;
}

export default function WeeklyReportCard({
  patientId,
  patientName,
  reports,
}: {
  patientId: string;
  patientName: string;
  reports: WeeklyReportItem[];
}) {
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const latestReport = reports && reports.length > 0 ? reports[0] : null;

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const res = await generateWeeklyReport(patientId);
      if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate weekly report.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-semibold text-gray-900">
              Weekly Cognitive & Routine Trend Report
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            AI-synthesized observational summary of past 7-day memory activity and adherence.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 self-start"
        >
          {generating ? (
            <>
              <span className="animate-spin">🌀</span> Generating Analysis...
            </>
          ) : (
            <>
              <span>✨</span> Generate Weekly Report
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}

      {!latestReport ? (
        <div className="p-6 text-center text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg space-y-2">
          <p className="font-medium text-gray-700">No weekly report generated yet for {patientName}.</p>
          <p className="text-xs text-gray-400">
            Click &quot;Generate Weekly Report&quot; above to aggregate the past 7 days of performance into an AI trend summary.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Latest Summary Box */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border-2 border-indigo-200 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-indigo-900 uppercase tracking-wider">
                Latest 7-Day Trend Analysis
              </span>
              <span className="text-gray-500">
                Generated: {new Date(latestReport.created_at).toLocaleDateString()} at{' '}
                {new Date(latestReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <p className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed bg-white/90 p-4 rounded-lg border border-indigo-100 shadow-xs">
              &ldquo;{latestReport.summary_text}&rdquo;
            </p>

            {/* Quick Metrics Badges */}
            {latestReport.metrics_json && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <div className="text-[11px] text-gray-500 font-medium">Sessions (7d)</div>
                  <div className="text-base font-bold text-indigo-700">
                    {latestReport.metrics_json.total_sessions_completed || 0}
                  </div>
                </div>

                <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <div className="text-[11px] text-gray-500 font-medium">Avg Accuracy</div>
                  <div className="text-base font-bold text-emerald-600">
                    {latestReport.metrics_json.overall_accuracy_percent || 0}%
                  </div>
                </div>

                <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <div className="text-[11px] text-gray-500 font-medium">Routine Adherence</div>
                  <div className="text-base font-bold text-blue-600">
                    {latestReport.metrics_json.reminder_adherence_percent || 0}%
                  </div>
                </div>

                <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <div className="text-[11px] text-gray-500 font-medium">Total Mistakes</div>
                  <div className="text-base font-bold text-amber-600">
                    {latestReport.metrics_json.total_mistakes || 0}
                  </div>
                </div>
              </div>
            )}
            {/* AI Recommendations List */}
            {Array.isArray(latestReport.metrics_json?.recommendations) && latestReport.metrics_json.recommendations.length > 0 && (
              <div className="bg-white/90 p-4 rounded-lg border border-indigo-100 shadow-xs space-y-2 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  <span>💡</span> AI Caregiver Recommendations:
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-gray-800 font-medium list-disc list-inside">
                  {latestReport.metrics_json.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="text-[11px] text-gray-400 text-right">
            ℹ️ Trend analysis is non-diagnostic and intended strictly for caregiver progress tracking.
          </div>
        </div>
      )}
    </div>
  );
}
