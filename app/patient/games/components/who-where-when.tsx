'use client';

import { useState, useEffect, useRef } from 'react';
import { getWhoWhereWhenQuiz, QuizQuestion } from '@/app/actions/personalized-games';
import { logGameSessionWithOfflineSupport } from '@/lib/offline/sync';
import GameResultView from './game-result-view';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

export default function WhoWhereWhenGame({ difficulty = 2 }: { difficulty?: number }) {
  const { t, dict } = useI18n();

  const [loading, setLoading] = useState(true);
  const [notEnoughData, setNotEnoughData] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameState, setGameState] = useState<'quiz' | 'finished'>('quiz');

  // Metrics
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const quizStartTimeRef = useRef<number>(0);

  const loadQuestions = async () => {
    setLoading(true);
    let data;
    try {
      data = await getWhoWhereWhenQuiz();
    } catch {
      // Offline fallback: fetch memories from IndexedDB
      const { getCachedPatientMemories } = await import('@/lib/offline/db');
      const offlineMemories = await getCachedPatientMemories();
      if (!offlineMemories || offlineMemories.length < 3) {
        data = { notEnoughData: true, memoryCount: offlineMemories?.length || 0 };
      } else {
        const qList: QuizQuestion[] = offlineMemories.slice(0, 4).map((m) => {
          const wrong1 = 'A peaceful garden with flowers';
          const wrong2 = 'An old friend from school';
          const options = [m.description, wrong1, wrong2].sort(() => 0.5 - Math.random());
          return {
            question: m.category === 'person' ? `Who is "${m.key_term}"?` : `What is "${m.key_term}"?`,
            category: m.category,
            keyTerm: m.key_term,
            options,
            correctIndex: options.indexOf(m.description),
          };
        });
        data = { questions: qList };
      }
    }
    setLoading(false);

    if (data.notEnoughData) {
      setNotEnoughData(true);
      setMemoryCount(data.memoryCount || 0);
      return;
    }

    if (data.questions && data.questions.length > 0) {
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setMistakes(0);
      setCorrectAnswers(0);
      setSelectedOption(null);
      setFeedback(null);
      setGameState('quiz');
      quizStartTimeRef.current = Date.now();
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleOptionClick = async (optionIndex: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(optionIndex);
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;

    if (isCorrect) {
      setFeedback('correct');
      setCorrectAnswers((prev) => prev + 1);
    } else {
      setFeedback('wrong');
      setMistakes((prev) => prev + 1);
    }

    setTimeout(async () => {
      setSelectedOption(null);
      setFeedback(null);

      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
      } else {
        const totalDuration = Date.now() - quizStartTimeRef.current;
        const totalQuestions = questions.length;
        const finalCorrect = isCorrect ? correctAnswers + 1 : correctAnswers;
        const finalMistakes = isCorrect ? mistakes : mistakes + 1;
        const finalAccuracy = Math.max(0, finalCorrect / totalQuestions);

        setGameState('finished');

        await logGameSessionWithOfflineSupport({
          gameName: 'Who/Where/When?',
          difficulty_level: difficulty,
          accuracy: finalAccuracy,
          avg_response_time_ms: totalDuration / totalQuestions,
          mistakes: finalMistakes,
          completed: true,
        });
      }
    }, 1200);
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'person':
        return {
          label: dict.games.whoWhereWhen.badges.person,
          bg: 'bg-purple-100 text-purple-900 border-purple-300',
        };
      case 'place':
        return {
          label: dict.games.whoWhereWhen.badges.place,
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
        };
      case 'routine':
        return {
          label: dict.games.whoWhereWhen.badges.routine,
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
        };
      default:
        return {
          label: dict.games.whoWhereWhen.badges.memory,
          bg: 'bg-gray-100 text-gray-900 border-gray-300',
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-4 border-black rounded-3xl p-12 text-center space-y-4 shadow-lg max-w-xl mx-auto">
        <div className="text-6xl animate-spin">👥</div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-black">
          {t('games.whoWhereWhen.loadingTitle')}
        </h2>
        <p className="text-lg font-bold text-gray-600">
          {t('games.whoWhereWhen.loadingDesc')}
        </p>
      </div>
    );
  }

  if (notEnoughData) {
    return (
      <div className="bg-white border-4 border-black rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-lg max-w-xl mx-auto">
        <div className="text-6xl">🏡</div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-black">
          {t('games.whoWhereWhen.needMoreTitle')}
        </h2>
        <p className="text-lg font-bold text-gray-700 leading-relaxed">
          {t('games.whoWhereWhen.needMoreDesc', { count: memoryCount })}
        </p>
        <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-2xl text-base text-purple-900 font-semibold">
          {t('games.whoWhereWhen.needMoreTip')}
        </div>
        <Link
          href="/patient/games"
          className="inline-block py-4 px-8 bg-gray-900 hover:bg-black text-white font-extrabold text-xl rounded-2xl shadow-md transition"
        >
          {t('games.whoWhereWhen.backToGames')}
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const badge = getCategoryBadge(currentQ?.category);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      {gameState === 'quiz' && questions.length > 0 && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-10 space-y-6 shadow-xl">
          <div className="flex justify-between items-center bg-purple-50 border-2 border-purple-400 rounded-2xl p-4">
            <span className="text-lg md:text-xl font-extrabold text-purple-900">
              {t('games.whoWhereWhen.questionHeader', {
                current: currentQuestionIndex + 1,
                total: questions.length,
              })}
            </span>
            <span className={`text-xs md:text-sm font-extrabold px-3 py-1 rounded-xl border ${badge.bg}`}>
              {badge.label}
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-black text-center py-2">
            {currentQ.question}
          </h3>

          <div className="space-y-4 pt-2">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectTarget = idx === currentQ.correctIndex;

              let buttonStyle = 'bg-white border-black text-black hover:bg-gray-100';
              if (selectedOption !== null) {
                if (isSelected && feedback === 'correct') {
                  buttonStyle = 'bg-emerald-500 border-emerald-700 text-white animate-bounce';
                } else if (isSelected && feedback === 'wrong') {
                  buttonStyle = 'bg-red-500 border-red-700 text-white animate-shake';
                } else if (isCorrectTarget && feedback === 'wrong') {
                  buttonStyle = 'bg-emerald-100 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleOptionClick(idx)}
                  disabled={selectedOption !== null}
                  className={`w-full p-5 md:p-6 text-left rounded-2xl border-4 text-xl md:text-2xl font-extrabold transition active:scale-95 shadow-md flex items-center justify-between gap-4 ${buttonStyle}`}
                >
                  <span>{option}</span>
                  {isSelected && feedback === 'correct' && <span className="text-3xl">✓</span>}
                  {isSelected && feedback === 'wrong' && <span className="text-3xl">✗</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <GameResultView
          accuracy={questions.length > 0 ? (questions.length - mistakes) / questions.length : 1}
          mistakes={mistakes}
          avgResponseTimeMs={2100}
          difficulty={difficulty}
          onPlayAgain={loadQuestions}
          gameTitle={t('games.whoWhereWhen.title')}
        />
      )}
    </div>
  );
}
