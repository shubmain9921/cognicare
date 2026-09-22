'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

interface GameResultProps {
  accuracy: number; // 0 - 100
  mistakes: number;
  avgResponseTimeMs: number;
  difficulty: number;
  onPlayAgain: () => void;
  gameTitle: string;
}

export default function GameResultView({
  accuracy,
  mistakes,
  avgResponseTimeMs,
  difficulty,
  onPlayAgain,
  gameTitle,
}: GameResultProps) {
  const { t } = useI18n();
  const accuracyPct = Math.round(accuracy <= 1 ? accuracy * 100 : accuracy);
  const responseTimeSec = (avgResponseTimeMs / 1000).toFixed(1);

  return (
    <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-10 text-center space-y-6 shadow-xl max-w-xl mx-auto animate-fadeIn">
      <div className="text-6xl md:text-7xl animate-bounce">🏆</div>

      <div className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">
          {t('common.sessionCompleted')}
        </h2>
        <p className="text-lg md:text-xl font-bold text-gray-700">
          {t('common.greatWork')} <span className="text-emerald-700">{gameTitle}</span>.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 py-2">
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4">
          <div className="text-xs md:text-sm font-bold text-emerald-800 uppercase tracking-wide">
            {t('common.accuracy')}
          </div>
          <div className="text-2xl md:text-4xl font-black text-emerald-700 font-mono mt-1">
            {accuracyPct}%
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-500 rounded-2xl p-4">
          <div className="text-xs md:text-sm font-bold text-blue-800 uppercase tracking-wide">
            {t('common.avgSpeed')}
          </div>
          <div className="text-2xl md:text-4xl font-black text-blue-700 font-mono mt-1">
            {responseTimeSec}s
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-4">
          <div className="text-xs md:text-sm font-bold text-amber-800 uppercase tracking-wide">
            {t('common.mistakes')}
          </div>
          <div className="text-2xl md:text-4xl font-black text-amber-700 font-mono mt-1">
            {mistakes}
          </div>
        </div>
      </div>

      <div className="text-sm font-semibold text-gray-500">
        {t('common.difficultyLevel')}: <span className="font-bold text-black">{difficulty} / 5</span> • {t('common.statsRecorded')}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xl rounded-2xl border-2 border-emerald-800 shadow-md transition active:scale-95"
        >
          🔄 {t('common.playAgain')}
        </button>

        <Link
          href="/patient/games"
          className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-black font-extrabold text-xl rounded-2xl border-2 border-black shadow-md transition active:scale-95 flex items-center justify-center"
        >
          🎮 {t('common.otherGames')}
        </Link>
      </div>
    </div>
  );
}
