import { getPatientSession } from '@/lib/patient-session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PatientNav from '../components/patient-nav';
import { getDemoRoutines, isDemoMode } from '@/lib/demo-mode';
import { getDictionary, t } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/context';

export const dynamic = 'force-dynamic';

export default async function MyDayPage() {
  const session = await getPatientSession();

  if (!session) {
    redirect('/patient/login');
  }

  const locale = session.preferred_language || 'en';
  const dict = getDictionary(locale);

  let routinesList = [];

  if (isDemoMode()) {
    routinesList = getDemoRoutines(session.id, true);
  } else {
    const supabase = createClient();
    const { data } = await supabase
      .from('daily_routines')
      .select('id, time_of_day, title, description, is_enabled')
      .eq('patient_id', session.id)
      .eq('is_enabled', true)
      .order('time_of_day', { ascending: true });

    routinesList = data || [];
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
                {t(dict, 'routines.chronologicalRoutine')}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-black mt-2">
                {t(dict, 'routines.myDaySchedule')}
              </h1>
              <p className="text-lg font-bold text-gray-700 mt-1">
                {t(dict, 'routines.myDaySubtitle')}
              </p>
            </div>
            <span className="text-6xl hidden sm:inline">🗓️</span>
          </section>

          {/* Routine Items Timeline */}
          <section className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-md space-y-6">
            {routinesList.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <span className="text-6xl">🌤️</span>
                <p className="text-xl font-extrabold text-gray-800">{t(dict, 'routines.noRoutinesPatient')}</p>
                <p className="text-base text-gray-600">{t(dict, 'routines.caregiverWillAdd')}</p>
              </div>
            ) : (
              <div className="relative border-l-4 border-emerald-500 ml-4 space-y-6 pl-6 my-2">
                {routinesList.map((item) => (
                  <div key={item.id} className="relative bg-amber-50/50 border-2 border-black p-5 rounded-2xl space-y-1 shadow-sm">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[35px] top-5 h-6 w-6 rounded-full bg-emerald-600 border-4 border-white ring-4 ring-emerald-300" />

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-lg bg-emerald-600 text-white px-3 py-1 rounded-xl shadow-2xs">
                        {item.time_of_day}
                      </span>
                      <h3 className="text-2xl font-extrabold text-gray-900">{item.title}</h3>
                    </div>

                    {item.description && (
                      <p className="text-lg font-semibold text-gray-700 pt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </I18nProvider>
  );
}
