'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { logGameSessionWithOfflineSupport } from '@/lib/offline/sync';
import GameResultView from './game-result-view';
import { useI18n } from '@/lib/i18n/context';

const TILE_DEFS = [
  { id: 0, key: 'red', color: 'bg-red-500', activeColor: 'bg-red-300 ring-8 ring-red-400', emoji: '🍎', border: 'border-red-700' },
  { id: 1, key: 'blue', color: 'bg-blue-500', activeColor: 'bg-blue-300 ring-8 ring-blue-400', emoji: '💧', border: 'border-blue-700' },
  { id: 2, key: 'green', color: 'bg-emerald-500', activeColor: 'bg-emerald-300 ring-8 ring-emerald-400', emoji: '🍃', border: 'border-emerald-700' },
  { id: 3, key: 'yellow', color: 'bg-amber-400', activeColor: 'bg-amber-200 ring-8 ring-amber-300', emoji: '☀️', border: 'border-amber-600' },
];

export default function SequenceRecallGame({ difficulty = 2 }: { difficulty?: number }) {
  const { t, dict } = useI18n();
  const sequenceLength = Math.min(8, 2 + difficulty); // Diff 2 -> 4 steps
  const flashSpeedMs = Math.max(350, 700 - difficulty * 50);

  const [gameState, setGameState] = useState<'ready' | 'flashing' | 'player_turn' | 'finished'>('ready');
  const [sequence, setSequence] = useState<number[]>([]);
  const [activeTileId, setActiveTileId] = useState<number | null>(null);
  const [playerInputIndex, setPlayerInputIndex] = useState(0);
  const [playerSteps, setPlayerSteps] = useState<number[]>([]);

  // Metrics
  const [accuracy, setAccuracy] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [avgResponseTimeMs, setAvgResponseTimeMs] = useState(0);

  const playerTurnStartRef = useRef<number>(0);
  const mistakeCountRef = useRef<number>(0);

  const startNewGame = useCallback(() => {
    // Generate random sequence
    const newSeq: number[] = [];
    for (let i = 0; i < sequenceLength; i++) {
      newSeq.push(Math.floor(Math.random() * 4));
    }
    setSequence(newSeq);
    setPlayerSteps([]);
    setPlayerInputIndex(0);
    mistakeCountRef.current = 0;
    setGameState('flashing');
  }, [sequenceLength]);

  // Flash sequence animation
  useEffect(() => {
    if (gameState !== 'flashing' || sequence.length === 0) return;

    let step = 0;
    const interval = setInterval(() => {
      if (step < sequence.length) {
        const tileId = sequence[step];
        setActiveTileId(tileId);

        setTimeout(() => {
          setActiveTileId(null);
        }, flashSpeedMs * 0.7);

        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setActiveTileId(null);
          setGameState('player_turn');
          playerTurnStartRef.current = Date.now();
        }, 400);
      }
    }, flashSpeedMs);

    return () => clearInterval(interval);
  }, [gameState, sequence, flashSpeedMs]);

  const handleTileClick = async (tileId: number) => {
    if (gameState !== 'player_turn') return;

    // Flash clicked tile briefly
    setActiveTileId(tileId);
    setTimeout(() => setActiveTileId(null), 200);

    const expectedId = sequence[playerInputIndex];
    const isCorrect = tileId === expectedId;

    if (!isCorrect) {
      mistakeCountRef.current += 1;
    }

    const nextIndex = playerInputIndex + 1;
    setPlayerSteps((prev) => [...prev, tileId]);
    setPlayerInputIndex(nextIndex);

    // If player completed all steps in sequence
    if (nextIndex >= sequence.length) {
      const responseTime = Date.now() - playerTurnStartRef.current;
      const totalMistakes = mistakeCountRef.current;
      const computedAccuracy = Math.max(0, (sequence.length - totalMistakes) / sequence.length);

      setAccuracy(computedAccuracy);
      setMistakes(totalMistakes);
      setAvgResponseTimeMs(responseTime / sequence.length);
      setGameState('finished');

      await logGameSessionWithOfflineSupport({
        gameName: 'Sequence Recall',
        difficulty_level: difficulty,
        accuracy: computedAccuracy,
        avg_response_time_ms: responseTime / sequence.length,
        mistakes: totalMistakes,
        completed: true,
      });
    }
  };

  const getTileLabel = (key: string) => {
    return (dict.games.sequenceRecall.tiles as any)[key] || key;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {gameState === 'ready' && (
        <div className="bg-white border-4 border-black rounded-3xl p-8 text-center space-y-6 shadow-lg max-w-xl mx-auto">
          <div className="text-6xl">✨</div>
          <h2 className="text-3xl font-extrabold text-black">
            {t('games.sequenceRecall.title')}
          </h2>
          <p className="text-xl text-gray-700 font-medium">
            {t('games.sequenceRecall.instruction', { length: sequenceLength })}
          </p>
          <button
            onClick={startNewGame}
            className="w-full py-4 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl rounded-2xl border-2 border-emerald-800 shadow-md transition active:scale-95"
          >
            {t('common.play')}
          </button>
        </div>
      )}

      {(gameState === 'flashing' || gameState === 'player_turn') && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-lg max-w-2xl mx-auto">
          {/* Status Indicator */}
          <div
            className={`p-4 rounded-2xl border-2 text-xl md:text-2xl font-extrabold transition ${
              gameState === 'flashing'
                ? 'bg-amber-100 border-amber-400 text-amber-900 animate-pulse'
                : 'bg-emerald-100 border-emerald-400 text-emerald-900'
            }`}
          >
            {gameState === 'flashing'
              ? t('games.sequenceRecall.watchPrompt')
              : t('games.sequenceRecall.playerPrompt', {
                  current: playerInputIndex + 1,
                  total: sequenceLength,
                })}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center items-center gap-2">
            {sequence.map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 border-black transition-all ${
                  i < playerSteps.length
                    ? 'bg-emerald-500 scale-110'
                    : i === playerInputIndex && gameState === 'player_turn'
                    ? 'bg-amber-300 ring-2 ring-black animate-ping'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* 4 Simon-style Colored Pads */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-md mx-auto py-4">
            {TILE_DEFS.map((tile) => {
              const isGlowing = activeTileId === tile.id;
              return (
                <button
                  key={tile.id}
                  type="button"
                  disabled={gameState === 'flashing'}
                  onClick={() => handleTileClick(tile.id)}
                  className={`h-36 sm:h-44 rounded-3xl border-4 ${tile.border} flex flex-col items-center justify-center space-y-2 text-white font-extrabold text-xl md:text-2xl shadow-md transition-all active:scale-90 ${
                    isGlowing ? tile.activeColor : tile.color
                  } ${gameState === 'flashing' ? 'cursor-not-allowed opacity-90' : 'hover:scale-105'}`}
                >
                  <span className="text-5xl md:text-6xl drop-shadow">{tile.emoji}</span>
                  <span className="drop-shadow-md text-white font-black">
                    {getTileLabel(tile.key)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <GameResultView
          accuracy={accuracy}
          mistakes={mistakes}
          avgResponseTimeMs={avgResponseTimeMs}
          difficulty={difficulty}
          onPlayAgain={startNewGame}
          gameTitle={t('games.sequenceRecall.title')}
        />
      )}
    </div>
  );
}
