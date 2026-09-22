'use client';

import { useState, useEffect } from 'react';
import { patientLogout } from '@/app/actions/patient';
import { getPatientDailyUsage } from '@/app/actions/safety-limits';
import { DailyCognitiveUsage } from '@/lib/safety-limits';

export default function CognitiveTimeTracker({
  initialUsage,
  showFullProgress = true,
}: {
  initialUsage?: DailyCognitiveUsage | null;
  showFullProgress?: boolean;
}) {
  const [usage, setUsage] = useState<DailyCognitiveUsage | null>(initialUsage || null);
  const [dismissedNotice, setDismissedNotice] = useState<number | null>(null);

  // Poll usage periodically while game is active
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const data = await getPatientDailyUsage();
        if (data) {
          setUsage(data);
        }
      } catch (err) {
        console.warn('Failed to fetch cognitive usage:', err);
      }
    };

    if (!initialUsage) {
      fetchUsage();
    }

    const interval = setInterval(fetchUsage, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [initialUsage]);

  if (!usage) return null;

  const { usageMinutes, limitMinutes, isLimitReached, reminderMilestone, reminderMessage } = usage;
  const percent = Math.min(100, Math.round((usageMinutes / limitMinutes) * 100));

  // Full-screen takeover when daily limit is reached
  if (isLimitReached) {
    return (
      <div className="fixed inset-0 z-50 bg-amber-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="max-w-xl w-full bg-white border-4 border-black rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
          <div className="text-7xl">☕</div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Today's activity is complete.
            </h1>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-800">
              You have spent about {usageMinutes >= 60 ? '1 hour' : `${usageMinutes} minutes`} on memory activities today.
            </p>
            <p className="text-base sm:text-lg font-bold text-gray-600 max-w-md mx-auto leading-relaxed">
              Taking a break is good for you. Come back tomorrow for your next activity.
            </p>
          </div>

          <div className="pt-4">
            <form action={patientLogout}>
              <button
                type="submit"
                className="w-full py-5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xl rounded-2xl border-4 border-black shadow-lg transition active:scale-95"
              >
                End Today's Activity
              </button>
            </form>
          </div>

          <p className="text-xs font-bold text-gray-400">
            CogniCare Safety Guardrail • Resets tomorrow morning
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {/* Gentle Usage Reminder Banner */}
      {reminderMilestone && reminderMessage && dismissedNotice !== reminderMilestone && (
        <div className="p-4 bg-amber-100/90 border-3 border-amber-400 text-amber-950 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-extrabold">
            <span className="text-2xl">🌱</span>
            <span>{reminderMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setDismissedNotice(reminderMilestone)}
            className="text-xs font-black uppercase tracking-wider bg-white/70 hover:bg-white px-2.5 py-1 rounded-lg border border-amber-300 transition"
          >
            Okay
          </button>
        </div>
      )}

      {/* Soft Progress Bar Indicator */}
      {showFullProgress && (
        <div className="bg-white border-3 border-black rounded-2xl p-3.5 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold">
            <span className="text-gray-700 flex items-center gap-1.5">
              <span>⏱️</span>
              <span>Today's Activity</span>
            </span>
            <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
              {usageMinutes} / {limitMinutes} min
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-300">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                percent >= 90 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
