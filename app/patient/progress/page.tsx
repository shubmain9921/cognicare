import { getPatientSession } from '@/lib/patient-session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PatientNav from '../components/patient-nav';
import Link from 'next/link';
import { isDemoMode } from '@/lib/demo-mode';
import { getDictionary, t } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/context';

export const dynamic = 'force-dynamic';

export default async function PatientProgressPage() {
  const session = await getPatientSession();

  if (!session) {
    redirect('/patient/login');
  }

  const locale = session.preferred_language || 'en';
  const dict = getDictionary(locale);

  let completedSessions = 4;

  if (!isDemoMode()) {
    const supabase = createClient();
    const { data } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('patient_id', session.id);

    if (data) {
      completedSessions = Math.max(data.length, 1);
    }
  }

  return (
    <I18nProvider locale={locale} dictionary={dict}>
      <div className="min-h-screen bg-amber-50/40 text-black flex flex-col justify-between">
        <PatientNav />

        <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* Header */}
          <section className="bg-white border-4 border-black rounded-3xl p-6 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                {t(dict, 'progress.warmEncouragement')}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-black mt-2">
                {t(dict, 'progress.myActivityProgress')}
              </h1>
              <p className="text-lg font-bold text-gray-700 mt-1">
                {t(dict, 'progress.progressSubtitle')}
              </p>
            </div>
            <span className="text-6xl hidden sm:inline">🌟</span>
          </section>

          {/* Simple Progress Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-4 border-black rounded-3xl p-8 space-y-4 shadow-md text-center">
              <span className="text-6xl">🏆</span>
              <h2 className="text-3xl font-extrabold text-black">{t(dict, 'progress.thisWeek')}</h2>
              <p className="text-5xl font-extrabold text-emerald-600">
                {t(dict, 'progress.activitiesCount', { count: completedSessions })}
              </p>
              <p className="text-lg font-bold text-gray-600">
                {t(dict, 'progress.completedWithCare')}
              </p>
            </div>

            <div className="bg-white border-4 border-black rounded-3xl p-8 space-y-4 shadow-md text-center flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-6xl">✨</span>
                <h2 className="text-3xl font-extrabold text-black">{t(dict, 'progress.keepGoing')}</h2>
                <p className="text-lg font-bold text-gray-700">
                  {t(dict, 'progress.regularPracticeText')}
                </p>
              </div>

              <Link
                href="/patient/games"
                className="py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xl border-2 border-black rounded-2xl text-center block transition shadow-md active:scale-95"
              >
                {t(dict, 'progress.playAnotherGame')}
              </Link>
            </div>
          </section>
        </main>
      </div>
    </I18nProvider>
  );
}
