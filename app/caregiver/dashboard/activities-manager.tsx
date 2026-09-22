'use client';

import { useState } from 'react';
import { updateActivitySettings, resetDifficultyBaseline } from '@/app/actions/activities';
import type { DemoPatient } from '@/lib/demo-types';

interface ActivitiesManagerProps {
  patient: DemoPatient;
}

export default function ActivitiesManager({ patient }: ActivitiesManagerProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetBaseline = async () => {
    setIsResetting(true);
    try {
      const res = await resetDifficultyBaseline(patient.id);
      if (res.success) {
        setFeedback(res.message || 'Difficulty baseline reset.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informative Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Cognitive Activity Preferences for {patient.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Set high-level schedule preferences. The AI and adaptive rules engine dynamically curate and scale daily games.
            </p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
            Adaptive Engine Active
          </span>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-in fade-in">
            {feedback}
          </div>
        )}

        <form
          action={async (formData) => {
            const res = await updateActivitySettings(patient.id, formData);
            if (res.success) {
              setFeedback(res.message || 'Settings saved');
              setTimeout(() => setFeedback(null), 3000);
            }
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="daily_target_activities">
                Activities Target Per Day
              </label>
              <select
                id="daily_target_activities"
                name="daily_target_activities"
                defaultValue={patient.daily_target_activities || 3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="1">1 Session / Day (Light)</option>
                <option value="2">2 Sessions / Day</option>
                <option value="3">3 Sessions / Day (Recommended)</option>
                <option value="4">4 Sessions / Day (Active)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="session_duration_minutes">
                Session Duration Target
              </label>
              <select
                id="session_duration_minutes"
                name="session_duration_minutes"
                defaultValue={patient.session_duration_minutes || 10}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="5">5 Minutes (Brief)</option>
                <option value="10">10 Minutes (Standard)</option>
                <option value="15">15 Minutes (Comprehensive)</option>
                <option value="20">20 Minutes (Extended)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="preferred_activity_time">
                Preferred Activity Time
              </label>
              <select
                id="preferred_activity_time"
                name="preferred_activity_time"
                defaultValue={patient.preferred_activity_time || 'morning'}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="morning">Morning (09:00 - 11:00 AM)</option>
                <option value="afternoon">Afternoon (02:00 - 04:00 PM)</option>
                <option value="evening">Evening (05:00 - 07:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Focus Activity Domains
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-emerald-50/40">
                <input
                  type="checkbox"
                  name="activity_types"
                  value="memory"
                  defaultChecked={patient.preferred_activity_types?.includes('memory') ?? true}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-bold text-gray-800">Visual & Object Memory</p>
                  <p className="text-[11px] text-gray-500">Remember Objects, What Changed</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-emerald-50/40">
                <input
                  type="checkbox"
                  name="activity_types"
                  value="sequence"
                  defaultChecked={patient.preferred_activity_types?.includes('sequence') ?? true}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-bold text-gray-800">Sequence & Logic</p>
                  <p className="text-[11px] text-gray-500">Sequence Recall, Pattern Pair</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-emerald-50/40">
                <input
                  type="checkbox"
                  name="activity_types"
                  value="routine"
                  defaultChecked={patient.preferred_activity_types?.includes('routine') ?? true}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-bold text-gray-800">Daily Routine & Story</p>
                  <p className="text-[11px] text-gray-500">Daily Routine Recall, Story Recall</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Save Activity Preferences
            </button>

            <button
              type="button"
              onClick={handleResetBaseline}
              disabled={isResetting}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-300 rounded-lg transition"
            >
              {isResetting ? 'Resetting...' : '🔄 Reset Difficulty to Baseline (Level 1)'}
            </button>
          </div>
        </form>
      </div>

      {/* Responsibilities Clarity Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Caregiver Responsibilities */}
        <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-200 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
            <span>✅</span> What the Caregiver Controls:
          </h3>
          <ul className="text-xs text-emerald-800 space-y-1.5 list-disc list-inside">
            <li>Session duration and target games per day.</li>
            <li>Enabling or disabling routine and story recall.</li>
            <li>Providing authentic memories & daily routines.</li>
            <li>Resetting difficulty to baseline calibration when needed.</li>
          </ul>
        </div>

        {/* AI & System Responsibilities */}
        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
            <span>🤖</span> What the System Automatically Handles:
          </h3>
          <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
            <li>No need to manually choose every game every day.</li>
            <li>No need to hand-craft game questions or calculate scores.</li>
            <li>Adaptive difficulty scales smoothly based on patient performance.</li>
            <li>Synthesizes objective trends without clinical diagnostic burdens.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
