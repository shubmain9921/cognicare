import { getPatientSession } from '@/lib/patient-session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdaptiveDifficultyForGame } from '@/app/actions/games';
import { getDictionary, t } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/context';
import OfflineBanner from '../../components/offline-banner';
import CognitiveTimeTracker from '../../components/cognitive-time-tracker';
import { getDailyCognitiveUsage } from '@/lib/safety-limits';
import { patientLogout } from '@/app/actions/patient';

import RememberObjectsGame from '../components/remember-objects';
import SequenceRecallGame from '../components/sequence-recall';
import FindPairGame from '../components/find-pair';
import WhatChangedGame from '../components/what-changed';
import StoryRecallGame from '../components/story-recall';
import DailyRoutineRecallGame from '../components/daily-routine-recall';
import WhoWhereWhenGame from '../components/who-where-when';

export const dynamic = 'force-dynamic';

interface GamePageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    difficulty?: string;
  };
}

export default async function IndividualGamePage({
  params,
  searchParams,
}: GamePageProps) {
  const session = await getPatientSession();

  if (!session) {
    redirect('/patient/login');
  }

  const locale = session.preferred_language || 'en';
  const dict = getDictionary(locale);

  // Safety Feature: Check daily cognitive activity usage against limit
  const dailyUsage = await getDailyCognitiveUsage(session.id);

  // If daily limit reached (e.g. >= 60 min), STOP games and display calm completion screen
  if (dailyUsage.isLimitReached) {
    return (
      <I18nProvider locale={locale} dictionary={dict}>
        <div className="min-h-screen bg-amber-50/50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="max-w-xl w-full bg-white border-4 border-black rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
            <div className="text-7xl">☕</div>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
                {t(dict, 'safety.limitReachedTitle')}
              </h1>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-800">
                {t(dict, 'safety.spentTime', {
                  time: `${dailyUsage.usageMinutes} min`,
                })}
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-600 max-w-md mx-auto leading-relaxed">
                {t(dict, 'safety.limitReachedDesc')}
              </p>
            </div>

            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-sm sm:text-base font-bold text-amber-900">
              {t(dict, 'safety.limitReachedBadge')}
            </div>

            <div className="pt-2">
              <form action={patientLogout}>
                <button
                  type="submit"
                  className="w-full py-5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xl rounded-2xl border-4 border-black shadow-lg transition active:scale-95"
                >
                  {t(dict, 'safety.endTodayBtn')}
                </button>
              </form>
            </div>

            <div className="pt-1">
              <Link
                href="/patient/home"
                className="text-sm font-bold text-gray-500 hover:text-black underline underline-offset-2"
              >
                ← {t(dict, 'nav.home')}
              </Link>
            </div>
          </div>
        </div>
      </I18nProvider>
    );
  }

  // Fetch patient's last 5 sessions for this game and calculate adaptive difficulty
  const adaptiveInfo = await getAdaptiveDifficultyForGame(params.slug, 2);

  // Use explicit searchParam override if passed, otherwise use computed adaptive difficulty
  const overrideDifficulty = searchParams?.difficulty
    ? parseInt(searchParams.difficulty, 10)
    : undefined;

  const resolvedDifficulty =
    overrideDifficulty !== undefined && !isNaN(overrideDifficulty)
      ? overrideDifficulty
      : adaptiveInfo.difficulty;

  const validDifficulty = Math.max(1, Math.min(5, resolvedDifficulty));

  const renderGame = () => {
    switch (params.slug) {
      // Core Games
      case 'remember-objects':
        return <RememberObjectsGame difficulty={validDifficulty} />;
      case 'sequence-recall':
        return <SequenceRecallGame difficulty={validDifficulty} />;
      case 'find-pair':
        return <FindPairGame difficulty={validDifficulty} />;
      case 'what-changed':
        return <WhatChangedGame difficulty={validDifficulty} />;

      // Personalized Games
      case 'story-recall':
        return <StoryRecallGame difficulty={validDifficulty} />;
      case 'daily-routine-recall':
        return <DailyRoutineRecallGame difficulty={validDifficulty} />;
      case 'who-where-when':
        return <WhoWhereWhenGame difficulty={validDifficulty} />;

      default:
        notFound();
    }
  };

  const getGameTitle = () => {
    switch (params.slug) {
      case 'remember-objects':
        return dict.games.rememberObjects.title;
      case 'sequence-recall':
        return dict.games.sequenceRecall.title;
      case 'find-pair':
        return dict.games.findPair.title;
      case 'what-changed':
        return dict.games.whatChanged.title;
      case 'story-recall':
        return dict.games.storyRecall.title;
      case 'daily-routine-recall':
        return dict.games.dailyRoutineRecall.title;
      case 'who-where-when':
        return dict.games.whoWhereWhen.title;
      default:
        return 'Memory Game';
    }
  };

  const isPersonalized = ['story-recall', 'daily-routine-recall', 'who-where-when'].includes(
    params.slug
  );

  return (
    <I18nProvider locale={locale} dictionary={dict}>
      <OfflineBanner />
      <div className="min-h-screen bg-amber-50/40 text-black p-4 md:p-8 pt-12 md:pt-14 flex flex-col justify-between">
        {/* Game Header */}
        <header className="max-w-4xl mx-auto w-full bg-white border-4 border-black rounded-3xl p-4 md:p-6 shadow-md flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/patient/games"
              className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-2xl text-base md:text-lg font-extrabold text-black transition active:scale-95 flex items-center gap-1"
            >
              ← {dict.home.brainGames}
            </Link>
            <h1 className="text-xl md:text-3xl font-extrabold text-black tracking-tight">
              {getGameTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isPersonalized && (
              <span className="text-xs md:text-sm font-extrabold bg-rose-100 text-rose-900 border-2 border-rose-400 px-3 py-1 rounded-full">
                🌟 {dict.gamesHub.personalizedBadge}
              </span>
            )}
            <span className="text-xs md:text-sm font-extrabold bg-emerald-100 text-emerald-900 border-2 border-emerald-500 px-3 py-1 rounded-full flex items-center gap-1">
              <span>⚡ {dict.common.level} {validDifficulty}</span>
              {adaptiveInfo.sessionCount > 0 && (
                <span className="text-[10px] text-emerald-700 bg-emerald-200 px-1.5 py-0.2 rounded-full font-bold">
                  {dict.common.adaptive}
                </span>
              )}
            </span>
          </div>
        </header>

        {/* Live Cognitive Time Tracker & Gentle Milestones */}
        <div className="max-w-4xl mx-auto w-full pt-4">
          <CognitiveTimeTracker initialUsage={dailyUsage} />
        </div>

        {/* Game Stage */}
        <main className="max-w-4xl mx-auto w-full py-6 flex-1 flex items-center justify-center">
          {renderGame()}
        </main>

        {/* High Contrast Footer */}
        <footer className="max-w-4xl mx-auto w-full text-center py-3 text-sm font-bold text-gray-500">
          {dict.common.adaptiveFootnote}
        </footer>
      </div>
    </I18nProvider>
  );
}
