'use client';

import { useState, useCallback, useRef } from 'react';
import { logGameSessionWithOfflineSupport } from '@/lib/offline/sync';
import GameResultView from './game-result-view';
import { useI18n } from '@/lib/i18n/context';

const SYMBOL_KEYS = [
  { id: 'sun', emoji: '☀️' },
  { id: 'heart', emoji: '❤️' },
  { id: 'flower', emoji: '🌸' },
  { id: 'tree', emoji: '🌲' },
  { id: 'star', emoji: '⭐' },
  { id: 'bell', emoji: '🔔' },
  { id: 'apple', emoji: '🍎' },
  { id: 'bird', emoji: '🐦' },
];

interface CardItem {
  uid: string;
  symbolId: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function FindPairGame({ difficulty = 2 }: { difficulty?: number }) {
  const { t, dict } = useI18n();

  // Scaling pairs by difficulty (1-5)
  // Diff 1: 2 pairs (4 cards), Diff 2: 3 pairs (6 cards), Diff 3: 4 pairs (8 cards), Diff 4: 6 pairs (12 cards), Diff 5: 8 pairs (16 cards)
  const pairCounts = [2, 3, 4, 6, 8];
  const totalPairs = pairCounts[Math.min(4, Math.max(0, difficulty - 1))];

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardItem[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Metrics
  const [accuracy, setAccuracy] = useState(1);
  const [avgResponseTimeMs, setAvgResponseTimeMs] = useState(0);

  const gameStartTimeRef = useRef<number>(0);
  const turnsCountRef = useRef<number>(0);

  const getSymbolLabel = (id: string) => {
    return (dict.games.findPair.symbols as any)[id] || id;
  };

  const startNewGame = useCallback(() => {
    const selectedSymbols = SYMBOL_KEYS.slice(0, totalPairs);
    const cardDeck: CardItem[] = [];

    selectedSymbols.forEach((s) => {
      cardDeck.push({
        uid: `${s.id}-1`,
        symbolId: s.id,
        emoji: s.emoji,
        isFlipped: false,
        isMatched: false,
      });
      cardDeck.push({
        uid: `${s.id}-2`,
        symbolId: s.id,
        emoji: s.emoji,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck
    const shuffledDeck = cardDeck.sort(() => 0.5 - Math.random());
    setCards(shuffledDeck);
    setSelectedCards([]);
    setMatchedCount(0);
    setMistakes(0);
    turnsCountRef.current = 0;
    setGameState('playing');
    gameStartTimeRef.current = Date.now();
  }, [totalPairs]);

  const handleCardClick = async (clickedCard: CardItem) => {
    if (
      isProcessing ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      selectedCards.length >= 2
    ) {
      return;
    }

    // Flip the clicked card
    const updatedCards = cards.map((c) =>
      c.uid === clickedCard.uid ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    const newSelected = [...selectedCards, clickedCard];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsProcessing(true);
      turnsCountRef.current += 1;
      const [first, second] = newSelected;

      if (first.symbolId === second.symbolId) {
        // MATCH!
        setTimeout(async () => {
          const nextMatchedCount = matchedCount + 1;
          setCards((prev) =>
            prev.map((c) =>
              c.symbolId === first.symbolId
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            )
          );
          setSelectedCards([]);
          setMatchedCount(nextMatchedCount);
          setIsProcessing(false);

          // Check if all pairs are matched
          if (nextMatchedCount === totalPairs) {
            const totalDuration = Date.now() - gameStartTimeRef.current;
            const totalTurns = turnsCountRef.current;
            const computedAccuracy = Math.max(0, totalPairs / totalTurns);

            setAccuracy(computedAccuracy);
            setAvgResponseTimeMs(totalDuration / totalTurns);
            setGameState('finished');

            await logGameSessionWithOfflineSupport({
              gameName: 'Find the Pair',
              difficulty_level: difficulty,
              accuracy: computedAccuracy,
              avg_response_time_ms: totalDuration / totalTurns,
              mistakes: mistakes,
              completed: true,
            });
          }
        }, 500);
      } else {
        // MISMATCH!
        setMistakes((prev) => prev + 1);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.uid === first.uid || c.uid === second.uid
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setSelectedCards([]);
          setIsProcessing(false);
        }, 900);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {gameState === 'ready' && (
        <div className="bg-white border-4 border-black rounded-3xl p-8 text-center space-y-6 shadow-lg max-w-xl mx-auto">
          <div className="text-6xl">🃏</div>
          <h2 className="text-3xl font-extrabold text-black">
            {t('games.findPair.title')}
          </h2>
          <p className="text-xl text-gray-700 font-medium">
            {t('games.findPair.instruction', { pairs: totalPairs })}
          </p>
          <button
            onClick={startNewGame}
            className="w-full py-4 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl rounded-2xl border-2 border-emerald-800 shadow-md transition active:scale-95"
          >
            {t('common.play')}
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-lg">
          <div className="flex justify-between items-center bg-purple-50 border-2 border-purple-300 rounded-2xl p-4">
            <span className="text-xl md:text-2xl font-extrabold text-purple-900">
              {t('games.findPair.matchedHeader', {
                matched: matchedCount,
                total: totalPairs,
              })}
            </span>
            <span className="text-lg font-bold text-gray-700 bg-white px-4 py-1 rounded-xl border border-purple-200">
              {t('games.findPair.mistakesHeader', { count: mistakes })}
            </span>
          </div>

          {/* Cards Grid */}
          <div
            className={`grid gap-4 max-w-2xl mx-auto py-4 ${
              totalPairs <= 3
                ? 'grid-cols-2 sm:grid-cols-3'
                : totalPairs <= 4
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-3 sm:grid-cols-4'
            }`}
          >
            {cards.map((card) => {
              const isOpen = card.isFlipped || card.isMatched;
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  disabled={isOpen || isProcessing}
                  className={`h-28 sm:h-36 rounded-2xl border-4 flex flex-col items-center justify-center space-y-1 transition-all active:scale-95 shadow-md ${
                    card.isMatched
                      ? 'bg-emerald-100 border-emerald-500 opacity-90'
                      : card.isFlipped
                      ? 'bg-blue-100 border-blue-500 scale-105'
                      : 'bg-emerald-700 border-emerald-900 hover:bg-emerald-800'
                  }`}
                >
                  {isOpen ? (
                    <>
                      <span className="text-4xl sm:text-5xl">{card.emoji}</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-900">
                        {getSymbolLabel(card.symbolId)}
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-black text-white drop-shadow">
                      ❓
                    </span>
                  )}
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
          gameTitle={t('games.findPair.title')}
        />
      )}
    </div>
  );
}
