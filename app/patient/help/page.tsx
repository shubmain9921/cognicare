import { getPatientSession } from '@/lib/patient-session';
import { redirect } from 'next/navigation';
import PatientNav from '../components/patient-nav';
import PatientAssistant from '../components/patient-assistant';
import Link from 'next/link';
import { getDictionary, t } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/context';

export const dynamic = 'force-dynamic';

export default async function PatientHelpPage() {
  const session = await getPatientSession();

  if (!session) {
    redirect('/patient/login');
  }

  const locale = session.preferred_language || 'en';
  const dict = getDictionary(locale);

  return (
    <I18nProvider locale={locale} dictionary={dict}>
      <div className="min-h-screen bg-amber-50/40 text-black flex flex-col justify-between">
        <PatientNav />

        <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* Header */}
          <section className="bg-white border-4 border-black rounded-3xl p-6 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                {t(dict, 'help.assistanceAndSupport')}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-black mt-2">
                {t(dict, 'help.helpAndSupportTitle')}
              </h1>
              <p className="text-lg font-bold text-gray-700 mt-1">
                {t(dict, 'help.helpSubtitle')}
              </p>
            </div>
            <span className="text-6xl hidden sm:inline">❓</span>
          </section>

          {/* Voice & Conversational Assistant */}
          <PatientAssistant patientName={session.name} />

          {/* Big Help Options */}
          <section className="space-y-6">
            <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-md space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-5xl">👨‍⚕️</span>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-black">
                    {t(dict, 'help.needHelpTitle')}
                  </h2>
                  <p className="text-base md:text-lg font-bold text-gray-700 mt-1">
                    {t(dict, 'help.askCaregiverDesc')}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border-2 border-black rounded-2xl flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t(dict, 'help.yourPatientId')}</p>
                  <p className="text-2xl font-mono font-extrabold text-gray-900 mt-0.5">
                    {session.patient_code}
                  </p>
                </div>

                <Link
                  href="/patient/home"
                  className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg border-2 border-black rounded-2xl transition"
                >
                  {t(dict, 'help.returnToHome')}
                </Link>
              </div>
            </div>

            <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-md space-y-3">
              <h3 className="text-2xl font-extrabold text-black">{t(dict, 'help.helpfulTipsTitle')}</h3>
              <ul className="space-y-3 text-lg font-semibold text-gray-800 list-disc list-inside">
                <li dangerouslySetInnerHTML={{ __html: t(dict, 'help.tip1') }} />
                <li dangerouslySetInnerHTML={{ __html: t(dict, 'help.tip2') }} />
                <li dangerouslySetInnerHTML={{ __html: t(dict, 'help.tip3') }} />
              </ul>
            </div>
          </section>
        </main>
      </div>
    </I18nProvider>
  );
}
