import { getPatientSession } from '@/lib/patient-session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PatientNav from '../components/patient-nav';
import { getDemoMemories, isDemoMode } from '@/lib/demo-mode';
import { getDictionary, t } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/context';

export const dynamic = 'force-dynamic';

export default async function MyMemoriesPage() {
  const session = await getPatientSession();

  if (!session) {
    redirect('/patient/login');
  }

  const locale = session.preferred_language || 'en';
  const dict = getDictionary(locale);

  let memoriesList: any[] = [];

  if (isDemoMode()) {
    memoriesList = getDemoMemories(session.id);
  } else {
    const supabase = createClient();
    const { data } = await supabase
      .from('memory_bank')
      .select('id, category, key_term, description, status')
      .eq('patient_id', session.id)
      .order('created_at', { ascending: false });

    memoriesList = data || [];
  }

  return (
    <I18nProvider locale={locale} dictionary={dict}>
      <div className="min-h-screen bg-amber-50/40 text-black flex flex-col justify-between">
        <PatientNav />

        <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* Header */}
          <section className="bg-white border-4 border-black rounded-3xl p-6 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-rose-800 bg-rose-100 px-3 py-1 rounded-full">
                {t(dict, 'memoryBank.personalizedCards')}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-black mt-2">
                {t(dict, 'memoryBank.myMemoriesTitle')}
              </h1>
              <p className="text-lg font-bold text-gray-700 mt-1">
                {t(dict, 'memoryBank.myMemoriesSubtitle')}
              </p>
            </div>
            <span className="text-6xl hidden sm:inline">❤️</span>
          </section>

          {/* Memory Introduction Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memoriesList.length === 0 ? (
              <div className="md:col-span-2 bg-white border-4 border-dashed border-gray-300 rounded-3xl p-12 text-center space-y-3">
                <span className="text-6xl">📖</span>
                <h3 className="text-2xl font-bold text-gray-800">{t(dict, 'memoryBank.bankBeingPrepared')}</h3>
                <p className="text-lg text-gray-600">
                  {t(dict, 'memoryBank.caregiverWillAddMemories')}
                </p>
              </div>
            ) : (
              memoriesList.map((mem) => {
                const iconMap: Record<string, string> = {
                  person: '👥',
                  place: '📍',
                  event: '🎉',
                  preference: '❤️',
                  routine: '☕',
                };
                const icon = iconMap[mem.category] || '🌟';

                return (
                  <div
                    key={mem.id}
                    className="bg-white border-4 border-black rounded-3xl p-6 space-y-4 shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{icon}</span>
                        <span className="text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full">
                          {mem.category}
                        </span>
                      </div>

                      <h3 className="text-2xl font-extrabold text-gray-900 pt-1">
                        {mem.key_term}
                      </h3>

                      {/* Gentle introduction phrasing */}
                      <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl">
                        <p className="text-lg font-bold text-emerald-950 leading-relaxed">
                          {t(dict, 'memoryBank.thisIsPhrase', { term: mem.key_term, description: mem.description })}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>{t(dict, 'memoryBank.introducedAndSaved')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </main>
      </div>
    </I18nProvider>
  );
}
