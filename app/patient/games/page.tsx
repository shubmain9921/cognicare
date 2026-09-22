import { getPatientSession } from '@/lib/patient-session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getDictionary, t } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/context';
import OfflineBanner from '../components/offline-banner';
import PatientNav from '../components/patient-nav';
import CognitiveTimeTracker from '../components/cognitive-time-tracker';
import { getDailyCognitiveUsage } from '@/lib/safety-limits';

export const dynamic = 'force-dynamic';

export default async function PatientGamesHubPage() {
  const session = await getPatientSession();

  if (!session) {
    redirect('/patient/login');
  }

  const locale = session.preferred_language || 'en';
  const dict = getDictionary(locale);

  // Safety Feature: Check daily cognitive usage
  const dailyUsage = await getDailyCognitiveUsage(session.id);

  const CORE_GAMES = [
    {
      slug: 'remember-objects',
      title: dict.games.rememberObjects.title,
      emoji: '👀',
      category: dict.gamesHub.coreBadge,
      description: dict.games.rememberObjects.description,
      color: 'bg-emerald-50 border-emerald-500 text-emerald-900',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      slug: 'sequence-recall',
      title: dict.games.sequenceRecall.title,
      emoji: '✨',
      category: dict.gamesHub.coreBadge,
      description: dict.games.sequenceRecall.description,
      color: 'bg-blue-50 border-blue-500 text-blue-900',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      slug: 'find-pair',
      title: dict.games.findPair.title,
      emoji: '🃏',
      category: dict.gamesHub.coreBadge,
      description: dict.games.findPair.description,
      color: 'bg-indigo-50 border-indigo-500 text-indigo-900',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      slug: 'what-changed',
      title: dict.games.whatChanged.title,
      emoji: '🔍',
      category: dict.gamesHub.coreBadge,
      description: dict.games.whatChanged.description,
      color: 'bg-amber-50 border-amber-500 text-amber-900',
      buttonColor: 'bg-amber-600 hover:bg-amber-700',
    },
  ];

  const PERSONALIZED_GAMES = [
    {
      slug: 'story-recall',
      title: dict.games.storyRecall.title,
      emoji: '📖',
      category: dict.gamesHub.personalizedBadge,
      description: dict.games.storyRecall.description,
      color: 'bg-rose-50 border-rose-500 text-rose-900',
      buttonColor: 'bg-rose-600 hover:bg-rose-700',
    },
    {
      slug: 'daily-routine-recall',
      title: dict.games.dailyRoutineRecall.title,
      emoji: '⏰',
      category: dict.gamesHub.personalizedBadge,
      description: dict.games.dailyRoutineRecall.description,
      color: 'bg-teal-50 border-teal-500 text-teal-900',
      buttonColor: 'bg-teal-600 hover:bg-teal-700',
    },
    {
      slug: 'who-where-when',
      title: dict.games.whoWhereWhen.title,
      emoji: '👥',
      category: dict.gamesHub.personalizedBadge,
      description: dict.games.whoWhereWhen.description,
      color: 'bg-purple-50 border-purple-500 text-purple-900',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <I18nProvider locale={locale} dictionary={dict}>
      <OfflineBanner />
      <div className="min-h-screen bg-amber-50/40 text-black flex flex-col justify-between">
        <PatientNav />

        {/* Main Games Grid */}
        <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-8 flex-1">
          {/* Top Header */}
          <header className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-md flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl md:text-5xl">🧠</span>
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-black tracking-tight">
                  {t(dict, 'gamesHub.title')}
                </h1>
                <p className="text-lg md:text-xl font-bold text-gray-700">
                  {t(dict, 'gamesHub.subtitle', { name: session.name })}
                </p>
              </div>
            </div>

            <Link
              href="/patient/home"
              className="py-3 px-5 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-2xl text-base md:text-lg font-extrabold text-black transition active:scale-95 shrink-0"
            >
              {t(dict, 'gamesHub.dailySchedule')}
            </Link>
          </header>

          {/* Soft Progress Bar & Milestones */}
          <CognitiveTimeTracker initialUsage={dailyUsage} />

          {/* Daily Limit Reached Banner */}
          {dailyUsage.isLimitReached && (
            <div className="p-6 bg-amber-100/90 border-4 border-amber-500 rounded-3xl text-center space-y-2 shadow-md">
              <div className="text-4xl">☕</div>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-950">
                {t(dict, 'safety.limitReachedTitle')} ({dailyUsage.usageMinutes} / {dailyUsage.limitMinutes} min)
              </h2>
              <p className="text-base sm:text-lg font-bold text-amber-900 max-w-lg mx-auto">
                {t(dict, 'safety.limitReachedDesc')}
              </p>
            </div>
          )}

          {/* Section 1: Personalized Games */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌟</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-black">
                {t(dict, 'gamesHub.personalizedSectionTitle')}
              </h2>
            </div>
            <p className="text-base font-semibold text-gray-700">
              {t(dict, 'gamesHub.personalizedSectionDesc')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PERSONALIZED_GAMES.map((game) => (
                <div
                  key={game.slug}
                  className={`border-4 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-md transition-all hover:shadow-xl ${game.color}`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-5xl">{game.emoji}</span>
                      <span className="text-xs font-extrabold bg-white/80 border border-black/20 px-2.5 py-1 rounded-full text-gray-800">
                        {game.category}
                      </span>
                    </div>
                    <h3 className="text-3xl font-extrabold text-black tracking-tight leading-tight">
                      {game.title}
                    </h3>
                    <p className="text-base font-semibold text-gray-700">
                      {game.description}
                    </p>
                  </div>

                  {dailyUsage.isLimitReached ? (
                    <div className="w-full py-4 px-4 bg-gray-200 border-3 border-gray-400 text-gray-600 font-extrabold text-lg rounded-2xl text-center">
                      {t(dict, 'safety.limitReachedTitle')}
                    </div>
                  ) : (
                    <Link
                      href={`/patient/games/${game.slug}`}
                      className={`w-full py-5 px-4 text-white font-extrabold text-2xl md:text-3xl rounded-2xl border-4 border-black text-center shadow-md transition active:scale-95 flex items-center justify-center gap-2 ${game.buttonColor}`}
                    >
                      ▶ {t(dict, 'common.playActivity')}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Core Cognitive Games */}
          <section className="space-y-4 pt-4 border-t-2 border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-black">
                {t(dict, 'gamesHub.coreSectionTitle')}
              </h2>
            </div>
            <p className="text-base font-semibold text-gray-700">
              {t(dict, 'gamesHub.coreSectionDesc')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CORE_GAMES.map((game) => (
                <div
                  key={game.slug}
                  className={`border-4 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-md transition-all hover:shadow-xl ${game.color}`}
                >
                  <div className="space-y-3">
                    <div className="text-5xl">{game.emoji}</div>
                    <h2 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      {game.title}
                    </h2>
                    <p className="text-sm font-semibold text-gray-700">
                      {game.description}
                    </p>
                  </div>

                  {dailyUsage.isLimitReached ? (
                    <div className="w-full py-3 px-3 bg-gray-200 border-3 border-gray-400 text-gray-600 font-extrabold text-base rounded-2xl text-center">
                      {t(dict, 'safety.limitReachedTitle')}
                    </div>
                  ) : (
                    <Link
                      href={`/patient/games/${game.slug}`}
                      className={`w-full py-4 px-4 text-white font-extrabold text-xl md:text-2xl rounded-2xl border-4 border-black text-center shadow-md transition active:scale-95 flex items-center justify-center gap-2 ${game.buttonColor}`}
                    >
                      ▶ {t(dict, 'common.play')}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto w-full text-center py-4 text-sm md:text-base font-bold text-gray-600">
          {t(dict, 'gamesHub.footer')}
        </footer>
      </div>
    </I18nProvider>
  );
}
