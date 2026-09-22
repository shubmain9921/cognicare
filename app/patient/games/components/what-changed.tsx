'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { logGameSessionWithOfflineSupport } from '@/lib/offline/sync';
import GameResultView from './game-result-view';
import { useI18n } from '@/lib/i18n/context';

const SCENE_ITEM_DEFS = [
  { id: 'lamp', emoji: '💡' },
  { id: 'cup', emoji: '🍵' },
  { id: 'plant', emoji: '🪴' },
  { id: 'chair', emoji: '🪑' },
  { id: 'clock', emoji: '⏰' },
  { id: 'painting', emoji: '🖼️' },
  { id: 'cat', emoji: '🐈' },
  { id: 'book', emoji: '📚' },
  { id: 'telephone', emoji: '☎️' },
  { id: 'guitar', emoji: '🎸' },
  { id: 'flower', emoji: '💐' },
  { id: 'teapot', emoji: '🫖' },
];

export default function WhatChangedGame({ difficulty = 2 }: { difficulty?: number }) {
  const { t, dict } = useI18n();

  // Scaling according to difficulty (1-5)
  const totalItemsCount = Math.min(8, 2 + difficulty); // Diff 2 -> 4 items
  const previewDuration = Math.max(3, 7 - difficulty); // Diff 2 -> 5 seconds

  const [gameState, setGameState] = useState<'ready' | 'preview' | 'curtain' | 'identify' | 'finished'>('ready');
  const [initialScene, setInitialScene] = useState<typeof SCENE_ITEM_DEFS>([]);
  const [modifiedScene, setModifiedScene] = useState<typeof SCENE_ITEM_DEFS>([]);
  const [changedIndex, setChangedIndex] = useState<number>(-1);
  const [originalItem, setOriginalItem] = useState<(typeof SCENE_ITEM_DEFS)[0] | null>(null);
  const [newItem, setNewItem] = useState<(typeof SCENE_ITEM_DEFS)[0] | null>(null);
  const [timeLeft, setTimeLeft] = useState(previewDuration);

  // Metrics
  const [accuracy, setAccuracy] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [avgResponseTimeMs, setAvgResponseTimeMs] = useState(0);

  const identifyStartTimeRef = useRef<number>(0);
  const mistakeCountRef = useRef<number>(0);

  const getItemLabel = (id: string) => {
    return (dict.games.whatChanged.items as any)[id] || id;
  };

  const startNewGame = useCallback(() => {
    // Pick initial N items
    const shuffled = [...SCENE_ITEM_DEFS].sort(() => 0.5 - Math.random());
    const initial = shuffled.slice(0, totalItemsCount);
    const unused = shuffled.slice(totalItemsCount);

    // Pick 1 index to change
    const targetChangeIndex = Math.floor(Math.random() * totalItemsCount);
    const replacementItem = unused[0] || SCENE_ITEM_DEFS[Math.floor(Math.random() * SCENE_ITEM_DEFS.length)];

    const modified = [...initial];
    const oldItem = initial[targetChangeIndex];
    modified[targetChangeIndex] = replacementItem;

    setInitialScene(initial);
    setModifiedScene(modified);
    setChangedIndex(targetChangeIndex);
    setOriginalItem(oldItem);
    setNewItem(replacementItem);
    setTimeLeft(previewDuration);
    mistakeCountRef.current = 0;
    setGameState('preview');
  }, [totalItemsCount, previewDuration]);

  // Countdown timer for preview phase
  useEffect(() => {
    if (gameState !== 'preview') return;

    if (timeLeft <= 0) {
      setGameState('curtain');
      setTimeout(() => {
        setGameState('identify');
        identifyStartTimeRef.current = Date.now();
      }, 1000);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleItemClick = async (clickedIndex: number) => {
    if (gameState !== 'identify') return;

    if (clickedIndex === changedIndex) {
      // Correct item identified!
      const responseTime = Date.now() - identifyStartTimeRef.current;
      const totalMistakes = mistakeCountRef.current;
      const computedAccuracy = totalMistakes === 0 ? 1 : Math.max(0.2, 1 / (1 + totalMistakes));

      setAccuracy(computedAccuracy);
      setMistakes(totalMistakes);
      setAvgResponseTimeMs(responseTime);
      setGameState('finished');

      await logGameSessionWithOfflineSupport({
        gameName: 'What Changed?',
        difficulty_level: difficulty,
        accuracy: computedAccuracy,
        avg_response_time_ms: responseTime,
        mistakes: totalMistakes,
        completed: true,
      });
    } else {
      // Wrong item tapped
      mistakeCountRef.current += 1;
      setMistakes(mistakeCountRef.current);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {gameState === 'ready' && (
        <div className="bg-white border-4 border-black rounded-3xl p-8 text-center space-y-6 shadow-lg max-w-xl mx-auto">
          <div className="text-6xl">🔍</div>
          <h2 className="text-3xl font-extrabold text-black">
            {t('games.whatChanged.title')}
          </h2>
          <p className="text-xl text-gray-700 font-medium">
            {t('games.whatChanged.instruction', { count: totalItemsCount })}
          </p>
          <button
            onClick={startNewGame}
            className="w-full py-4 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl rounded-2xl border-2 border-emerald-800 shadow-md transition active:scale-95"
          >
            {t('common.play')}
          </button>
        </div>
      )}

      {gameState === 'preview' && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-lg">
          <div className="flex justify-between items-center bg-amber-100 border-2 border-amber-400 rounded-2xl p-4">
            <span className="text-xl md:text-2xl font-extrabold text-amber-900">
              {t('games.whatChanged.memorizeHeader')}
            </span>
            <span className="text-2xl md:text-3xl font-mono font-black text-black bg-white px-4 py-1 rounded-xl border-2 border-black">
              ⏳ {timeLeft}s
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 py-4">
            {initialScene.map((item, idx) => (
              <div
                key={idx}
                className="bg-amber-50 border-4 border-amber-400 rounded-2xl p-6 flex flex-col items-center justify-center space-y-2 shadow-sm"
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

      {gameState === 'curtain' && (
        <div className="bg-white border-4 border-black rounded-3xl p-16 text-center space-y-6 shadow-lg max-w-xl mx-auto animate-pulse">
          <div className="text-6xl animate-spin">🌀</div>
          <h2 className="text-3xl font-extrabold text-gray-800">
            {t('games.whatChanged.shufflingHeader')}
          </h2>
          <p className="text-lg text-gray-500 font-bold">
            {t('games.whatChanged.shufflingSub')}
          </p>
        </div>
      )}

      {gameState === 'identify' && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-lg">
          <div className="bg-blue-100 border-2 border-blue-400 rounded-2xl p-4">
            <span className="text-xl md:text-2xl font-extrabold text-blue-900">
              {t('games.whatChanged.identifyHeader')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 py-4">
            {modifiedScene.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleItemClick(idx)}
                className="bg-white border-4 border-black hover:border-blue-600 hover:bg-blue-50 rounded-2xl p-6 flex flex-col items-center justify-center space-y-2 shadow-md transition active:scale-95"
              >
                <span className="text-5xl md:text-6xl">{item.emoji}</span>
                <span className="text-lg md:text-xl font-extrabold text-gray-900">
                  {getItemLabel(item.id)}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {t('games.whatChanged.tapIfChanged')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="space-y-6">
          <div className="bg-green-100 border-4 border-green-500 rounded-3xl p-4 text-center">
            <span className="text-xl font-bold text-green-900">
              {t('games.whatChanged.successBanner', {
                oldEmoji: originalItem?.emoji || '',
                oldLabel: originalItem ? getItemLabel(originalItem.id) : '',
                newEmoji: newItem?.emoji || '',
                newLabel: newItem ? getItemLabel(newItem.id) : '',
              })}
            </span>
          </div>

          <GameResultView
            accuracy={accuracy}
            mistakes={mistakes}
            avgResponseTimeMs={avgResponseTimeMs}
            difficulty={difficulty}
            onPlayAgain={startNewGame}
            gameTitle={t('games.whatChanged.title')}
          />
        </div>
      )}
    </div>
  );
}
