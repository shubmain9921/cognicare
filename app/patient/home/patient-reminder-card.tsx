'use client';

import { useState } from 'react';
import { toggleReminderPatient } from '@/app/actions/reminders';
import { useI18n } from '@/lib/i18n/context';

export interface PatientReminderView {
  id: string;
  type: 'recurring' | 'one_time';
  title: string;
  scheduled_time: string;
  recurrence_rule: string | null;
  is_done: boolean;
}

export default function PatientReminderCard({
  reminder,
}: {
  reminder: PatientReminderView;
}) {
  const { t } = useI18n();
  const [isDone, setIsDone] = useState(reminder.is_done);
  const [pending, setPending] = useState(false);

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const handleToggle = async () => {
    const nextStatus = !isDone;
    setIsDone(nextStatus);
    setPending(true);
    try {
      await toggleReminderPatient(reminder.id, nextStatus);
    } catch {
      setIsDone(!nextStatus); // Revert on failure
    } finally {
      setPending(false);
    }
  };

  const handlePostpone = async () => {
    setPending(true);
    try {
      await toggleReminderPatient(reminder.id, false);
    } catch {
      // ignore
    } finally {
      setPending(false);
    }
  };

  const getEmoji = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('med') || lower.includes('pill') || lower.includes('tablet') || lower.includes('दवा') || lower.includes('गोली')) return '💊';
    if (lower.includes('water') || lower.includes('drink') || lower.includes('hydrat') || lower.includes('पानी')) return '💧';
    if (lower.includes('eat') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('breakfast') || lower.includes('meal') || lower.includes('खाना') || lower.includes('नाश्ता') || lower.includes('भोजन')) return '🥗';
    if (lower.includes('walk') || lower.includes('exercise') || lower.includes('stretch') || lower.includes('टहलना') || lower.includes('व्यायाम')) return '🚶';
    if (lower.includes('doctor') || lower.includes('clinic') || lower.includes('hospital') || lower.includes('डॉक्टर') || lower.includes('अस्पताल')) return '🩺';
    if (lower.includes('sleep') || lower.includes('bed') || lower.includes('सोना') || lower.includes('आराम')) return '🛏️';
    return '⏰';
  };

  return (
    <div
      className={`rounded-3xl p-6 md:p-8 transition-all border-4 shadow-md ${
        isDone
          ? 'bg-gray-100 border-gray-300 opacity-75'
          : 'bg-white border-black hover:border-emerald-600'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Info */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-4">
            <span className="text-5xl md:text-6xl" role="img" aria-label="Reminder icon">
              {getEmoji(reminder.title)}
            </span>
            <div className="inline-block bg-black text-white text-xl md:text-2xl font-bold px-5 py-2 rounded-full font-mono">
              {formatTime(reminder.scheduled_time)}
            </div>
            {reminder.type === 'recurring' && (
              <span className="text-base md:text-lg font-semibold text-gray-700 bg-gray-200 px-3 py-1 rounded-full">
                🔄 {reminder.recurrence_rule || t('common.daily')}
              </span>
            )}
          </div>

          <h3
            className={`text-3xl md:text-4xl font-extrabold tracking-tight leading-tight ${
              isDone ? 'line-through text-gray-500' : 'text-black'
            }`}
          >
            {reminder.title}
          </h3>
        </div>

        {/* Action Button — large touch target for elderly accessibility */}
        <div className="w-full md:w-auto min-w-[220px] flex flex-col gap-2">
          <button
            onClick={handleToggle}
            disabled={pending}
            className={`w-full py-4 px-6 rounded-2xl font-extrabold text-xl md:text-2xl flex items-center justify-center gap-3 transition active:scale-95 shadow-md border-4 ${
              isDone
                ? 'bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300'
                : 'bg-emerald-600 border-emerald-800 text-white hover:bg-emerald-700 hover:shadow-xl'
            }`}
          >
            {isDone ? (
              <>
                <span className="text-2xl">✓</span> {t('common.completed')}
              </>
            ) : (
              <>
                <span className="text-2xl font-bold">✓</span> {t('common.markDone')}
              </>
            )}
          </button>

          {!isDone && (
            <button
              onClick={handlePostpone}
              disabled={pending}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 transition flex items-center justify-center gap-1.5"
            >
              <span>⏰</span> Remind Me Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
