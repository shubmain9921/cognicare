import { getPatientSession } from '@/lib/patient-session';
import { patientLogout } from '@/app/actions/patient';
import { createClient } from '@/lib/supabase/server';
import PatientReminderCard, { PatientReminderView } from './patient-reminder-card';
import { redirect } from 'next/navigation';
import { getDictionary, t } from '@/lib/i18n';
import { formatDate } from '@/lib/i18n/formatters';
import { I18nProvider } from '@/lib/i18n/context';
import OfflineBanner from '../components/offline-banner';
import OfflineDataHydrator from '../components/offline-data-hydrator';
import ServiceWorkerRegister from '../components/sw-register';
import PatientNav from '../components/patient-nav';
import PatientAssistant from '../components/patient-assistant';
import Link from 'next/link';
import {
  getDemoMemories,
  getDemoReminders,
  getDemoRoutines,
  getDemoGameSessions,
  isDemoMode,
} from '@/lib/demo-mode';

export const dynamic = 'force-dynamic';

function getGreetingTime(dict: any): string {
  const hour = new Date().getHours();
  if (hour < 12) return t(dict, 'dashboard.goodMorning');
  if (hour < 17) return t(dict, 'dashboard.goodAfternoon');
  return t(dict, 'dashboard.goodEvening');
}

export default async function PatientHomePage() {
  const session = await getPatientSession();

  if (!session) {
    redirect('/patient/login');
  }

  const locale = session.preferred_language || 'en';
  const dict = getDictionary(locale);

  let remindersList: PatientReminderView[] = [];
  let memoriesList: any[] = [];
  let routinesList: any[] = [];
  let completedCountThisWeek = 0;

  if (isDemoMode()) {
    remindersList = getDemoReminders(session.id) as PatientReminderView[];
    memoriesList = getDemoMemories(session.id);
    routinesList = getDemoRoutines(session.id, true);
    const demoSessions = getDemoGameSessions(session.id);
    completedCountThisWeek = demoSessions.length;
  } else {
    const supabase = createClient();

    const [remindersRes, memoriesRes, routinesRes, sessionsRes] = await Promise.all([
      supabase
        .from('reminders')
        .select('id, type, title, scheduled_time, recurrence_rule, is_done')
        .eq('patient_id', session.id)
        .order('scheduled_time', { ascending: true }),
      supabase
        .from('memory_bank')
        .select('id, category, key_term, description')
        .eq('patient_id', session.id),
      supabase
        .from('daily_routines')
        .select('id, time_of_day, title, description, is_enabled')
        .eq('patient_id', session.id)
        .order('time_of_day', { ascending: true }),
      supabase
        .from('game_sessions')
        .select('id')
        .eq('patient_id', session.id),
    ]);

    remindersList = remindersRes.data || [];
    memoriesList = memoriesRes.data || [];
    routinesList = routinesRes.data || [];
    if (sessionsRes.data) {
      completedCountThisWeek = Math.max(sessionsRes.data.length, 1);
    }
  }

  const today = new Date();
  const todayDateStr = today.toDateString();

  const todaysReminders = remindersList.filter((r) => {
    if (r.type === 'recurring') return true;
    const remDate = new Date(r.scheduled_time);
    return remDate.toDateString() === todayDateStr;
  });

  const pendingCount = todaysReminders.filter((r) => !r.is_done).length;

  const formattedToday = formatDate(
    today,
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    },
    locale
  );

  const greetingPrefix = getGreetingTime(dict);

  return (
    <I18nProvider locale={locale} dictionary={dict}>
      <ServiceWorkerRegister />
      <OfflineBanner />
      <OfflineDataHydrator reminders={remindersList} memories={memoriesList as any} />

      <div className="min-h-screen bg-amber-50/40 text-black flex flex-col justify-between">
        {/* Navigation Header */}
        <PatientNav />

        <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* 1. Warm Personalized Greeting */}
          <section className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-md flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl md:text-7xl">🌻</span>
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-black tracking-tight leading-tight">
                  {greetingPrefix}, {session.name}
                </h1>
                <p className="text-lg md:text-xl font-bold text-emerald-800 mt-1">
                  {formattedToday}
                </p>
              </div>
            </div>

            <Link
              href="/patient/help"
              className="py-3 px-5 bg-amber-100 hover:bg-amber-200 border-2 border-black rounded-2xl text-base md:text-lg font-extrabold text-gray-900 transition flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <span>❓</span>
              <span className="hidden sm:inline">{t(dict, 'dashboard.helpButton')}</span>
            </Link>
          </section>

          {/* Conversational AI Assistant */}
          <PatientAssistant patientName={session.name} />

          {/* 2. Today's Featured Activity Card (Large Button) */}
          <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest bg-black/30 px-3 py-1 rounded-full text-emerald-100">
                {t(dict, 'dashboard.todaysMemoryActivity')}
              </span>
              <span className="text-3xl">⭐</span>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold">{t(dict, 'dashboard.rememberObjectsTitle')}</h2>
              <p className="text-base md:text-lg text-emerald-100 mt-1">
                {t(dict, 'dashboard.rememberObjectsDesc')}
              </p>
            </div>

            <Link
              href="/patient/games/remember-objects"
              className="inline-flex items-center justify-center gap-3 w-full py-4 sm:py-5 px-6 bg-amber-400 hover:bg-amber-300 text-black border-4 border-black font-extrabold text-2xl rounded-2xl transition shadow-lg active:scale-98"
            >
              <span>▶</span>
              <span>{t(dict, 'dashboard.startActivityBtn')}</span>
            </Link>
          </section>

          {/* 3 & 4. Recommended Activity & Routine Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommended Activity Card */}
            <section className="bg-white border-4 border-black rounded-3xl p-6 space-y-3 shadow-md flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  {t(dict, 'dashboard.recommendedForYou')}
                </span>
                <h3 className="text-2xl font-extrabold text-black pt-1">
                  {t(dict, 'dashboard.dailyRoutineRecallTitle')}
                </h3>
                <p className="text-base text-gray-700 font-medium">
                  {t(dict, 'dashboard.dailyRoutineRecallDesc')}
                </p>
              </div>

              <Link
                href="/patient/games/daily-routine-recall"
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg border-2 border-black rounded-2xl text-center block transition active:scale-95"
              >
                {t(dict, 'dashboard.practiceRoutineBtn')}
              </Link>
            </section>

            {/* Simple Progress Card */}
            <section className="bg-white border-4 border-black rounded-3xl p-6 space-y-3 shadow-md flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {t(dict, 'dashboard.weeklyGoal')}
                </span>
                <h3 className="text-2xl font-extrabold text-black pt-1">
                  {t(dict, 'dashboard.thisWeeksActivity')}
                </h3>
                <p className="text-3xl font-extrabold text-emerald-700 mt-1">
                  {t(dict, 'dashboard.activitiesCompleted', { count: completedCountThisWeek })}
                </p>
              </div>

              <Link
                href="/patient/progress"
                className="py-3 px-5 bg-amber-50 hover:bg-amber-100 text-gray-900 font-extrabold text-lg border-2 border-black rounded-2xl text-center block transition"
              >
                {t(dict, 'dashboard.viewProgressBtn')}
              </Link>
            </section>
          </div>

          {/* 5. Today's Reminders Schedule */}
          <section className="space-y-4">
            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-black">{t(dict, 'dashboard.todaysReminders')}</h2>
                <p className="text-lg font-bold text-gray-700 mt-1">
                  {todaysReminders.length === 0
                    ? t(dict, 'dashboard.noRemindersToday')
                    : pendingCount === 0
                    ? t(dict, 'dashboard.allRemindersAcknowledged')
                    : t(dict, 'dashboard.remindersWaiting', { count: pendingCount })}
                </p>
              </div>
              <span className="text-4xl md:text-6xl">
                {pendingCount === 0 ? '🌟' : '📋'}
              </span>
            </div>

            {todaysReminders.length === 0 ? (
              <div className="bg-white border-4 border-dashed border-gray-300 rounded-3xl p-8 text-center space-y-2">
                <span className="text-5xl block">☕</span>
                <p className="text-xl font-bold text-gray-700">{t(dict, 'dashboard.calmDayMessage')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysReminders.map((reminder) => (
                  <PatientReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto w-full flex items-center justify-between py-6 px-4">
          <span className="text-sm font-bold text-gray-600">
            CogniCare • {t(dict, 'dashboard.patientCode')} <span className="font-mono text-black">{session.patient_code}</span>
          </span>
          <form action={patientLogout}>
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-red-600 underline font-bold transition"
            >
              {t(dict, 'common.signOut')}
            </button>
          </form>
        </footer>
      </div>
    </I18nProvider>
  );
}
