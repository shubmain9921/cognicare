'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logGameSessionWithOfflineSupport } from '@/lib/offline/sync';
import GameResultView from './game-result-view';
import { useI18n } from '@/lib/i18n/context';

const OBJECT_KEYS = [
  { id: 'apple', emoji: '🍎' },
  { id: 'bicycle', emoji: '🚲' },
  { id: 'dog', emoji: '🐶' },
  { id: 'soccer', emoji: '⚽' },
  { id: 'guitar', emoji: '🎸' },
  { id: 'flower', emoji: '🌻' },
  { id: 'car', emoji: '🚗' },
  { id: 'hat', emoji: '🎩' },
  { id: 'coffee', emoji: '☕' },
  { id: 'clock', emoji: '⏰' },
  { id: 'book', emoji: '📖' },
  { id: 'tree', emoji: '🌳' },
  { id: 'cat', emoji: '🐱' },
  { id: 'house', emoji: '🏠' },
  { id: 'phone', emoji: '📱' },
  { id: 'star', emoji: '⭐' },
];

export default function RememberObjectsGame({ difficulty = 2 }: { difficulty?: number }) {
  const { t, dict } = useI18n();

  // Scaling according to difficulty (1-5)
  const targetCount = Math.min(7, 2 + difficulty); // Diff 2 -> 4 targets
  const totalOptionsCount = Math.min(OBJECT_KEYS.length, targetCount * 2); // Diff 2 -> 8 options
  const memorizeDuration = Math.max(3, 7 - difficulty); // Diff 2 -> 5 seconds

  const [gameState, setGameState] = useState<'ready' | 'memorize' | 'recall' | 'finished'>('ready');
  const [targetItems, setTargetItems] = useState<typeof OBJECT_KEYS>([]);
  const [candidateItems, setCandidateItems] = useState<typeof OBJECT_KEYS>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(memorizeDuration);

  // Metrics
  const [accuracy, setAccuracy] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [avgResponseTimeMs, setAvgResponseTimeMs] = useState(0);

  const recallStartTimeRef = useRef<number>(0);

  const getItemLabel = (id: string) => {
    return (dict.games.rememberObjects.items as any)[id] || id;
  };

  const startNewGame = useCallback(() => {
    // Shuffle and pick target items
    const shuffled = [...OBJECT_KEYS].sort(() => 0.5 - Math.random());
    const targets = shuffled.slice(0, targetCount);
    const distractorCandidates = shuffled.slice(targetCount, totalOptionsCount);
    const options = [...targets, ...distractorCandidates].sort(() => 0.5 - Math.random());

    setTargetItems(targets);
    setCandidateItems(options);
    setSelectedIds([]);
    setTimeLeft(memorizeDuration);
    setGameState('memorize');
  }, [targetCount, totalOptionsCount, memorizeDuration]);

  // Countdown during memorize phase
  useEffect(() => {
    if (gameState !== 'memorize') return;

    if (timeLeft <= 0) {
      setGameState('recall');
      recallStartTimeRef.current = Date.now();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleToggleSelect = (id: string) => {
    if (gameState !== 'recall') return;

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= targetCount) {
          // If already selected targetCount, replace last or toggle
          return [...prev.slice(1), id];
        }
        return [...prev, id];
      }
    });
  };

  const handleSubmit = async () => {
    const responseTime = Date.now() - recallStartTimeRef.current;
    const targetIdSet = new Set(targetItems.map((t) => t.id));

    let correctCount = 0;
    let mistakeCount = 0;

    selectedIds.forEach((id) => {
      if (targetIdSet.has(id)) {
        correctCount++;
      } else {
        mistakeCount++;
      }
    });

    const unpickedCount = targetCount - correctCount;
    const totalMistakes = mistakeCount + unpickedCount;
    const computedAccuracy = Math.max(0, correctCount / targetCount);

    setAccuracy(computedAccuracy);
    setMistakes(totalMistakes);
    setAvgResponseTimeMs(responseTime);
    setGameState('finished');

    // Log session to Supabase or IndexedDB if offline
    await logGameSessionWithOfflineSupport({
      gameName: 'Remember the Objects',
      difficulty_level: difficulty,
      accuracy: computedAccuracy,
      avg_response_time_ms: responseTime,
      mistakes: totalMistakes,
      completed: true,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {gameState === 'ready' && (
        <div className="bg-white border-4 border-black rounded-3xl p-8 text-center space-y-6 shadow-lg max-w-xl mx-auto">
          <div className="text-6xl">👀</div>
          <h2 className="text-3xl font-extrabold text-black">
            {t('games.rememberObjects.title')}
          </h2>
          <p className="text-xl text-gray-700 font-medium">
            {t('games.rememberObjects.instruction', {
              targetCount,
              seconds: memorizeDuration,
            })}
          </p>
          <button
            onClick={startNewGame}
            className="w-full py-4 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl rounded-2xl border-2 border-emerald-800 shadow-md transition active:scale-95"
          >
            {t('common.play')}
          </button>
        </div>
      )}

      {gameState === 'memorize' && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-lg">
          <div className="flex justify-between items-center bg-amber-100 border-2 border-amber-400 rounded-2xl p-4">
            <span className="text-xl md:text-2xl font-extrabold text-amber-900">
              {t('games.rememberObjects.memorizeHeader', { count: targetCount })}
            </span>
            <span className="text-2xl md:text-3xl font-mono font-black text-black bg-white px-4 py-1 rounded-xl border-2 border-black">
              ⏳ {timeLeft}s
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 py-4">
            {targetItems.map((item) => (
              <div
                key={item.id}
                className="bg-emerald-50 border-4 border-emerald-600 rounded-2xl p-6 flex flex-col items-center justify-center space-y-2 shadow-sm animate-pulse"
              >
                <span className="text-5xl md:text-6xl">{item.emoji}</span>
                <span className="text-lg md:text-xl font-extrabold text-gray-900">
                  {getItemLabel(item.id)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gameState === 'recall' && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-blue-50 border-2 border-blue-400 rounded-2xl p-4">
            <span className="text-xl md:text-2xl font-extrabold text-blue-900">
              {t('games.rememberObjects.recallHeader')}
            </span>
            <span className="text-lg font-bold text-black bg-white px-4 py-1 rounded-xl border border-blue-300">
              {t('games.rememberObjects.selectedCount', {
                selected: selectedIds.length,
                total: targetCount,
              })}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 py-4">
            {candidateItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleSelect(item.id)}
                  className={`p-6 rounded-2xl border-4 flex flex-col items-center justify-center space-y-2 transition active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-100 border-emerald-600 shadow-md ring-4 ring-emerald-300'
                      : 'bg-gray-50 border-gray-300 hover:border-black'
                  }`}
                >
                  <span className="text-5xl md:text-6xl">{item.emoji}</span>
                  <span className="text-lg md:text-xl font-extrabold text-gray-900">
                    {getItemLabel(item.id)}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isSelected
                      ? t('games.rememberObjects.selectedBadge')
                      : t('games.rememberObjects.tapToSelect')}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0}
            className="w-full max-w-md py-4 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-2xl rounded-2xl border-2 border-emerald-800 shadow-md transition active:scale-95"
          >
            {t('games.rememberObjects.submit', { count: selectedIds.length })}
          </button>
        </div>
      )}

      {gameState === 'finished' && (
        <GameResultView
          accuracy={accuracy}
          mistakes={mistakes}
          avgResponseTimeMs={avgResponseTimeMs}
          difficulty={difficulty}
          onPlayAgain={startNewGame}
          gameTitle={t('games.rememberObjects.title')}
        />
      )}
    </div>
  );
}
