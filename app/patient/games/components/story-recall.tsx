'use client';

import { useState, useEffect, useRef } from 'react';
import { getPersonalizedStory, QuizQuestion } from '@/app/actions/personalized-games';
import { logGameSessionWithOfflineSupport } from '@/lib/offline/sync';
import GameResultView from './game-result-view';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

export default function StoryRecallGame({ difficulty = 2 }: { difficulty?: number }) {
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [notEnoughData, setNotEnoughData] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);

  const [story, setStory] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [gameState, setGameState] = useState<'reading' | 'quiz' | 'finished'>('reading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Metrics
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const quizStartTimeRef = useRef<number>(0);

  const loadStory = async () => {
    setLoading(true);
    let data;
    try {
      data = await getPersonalizedStory();
    } catch {
      // Offline fallback: fetch memories from IndexedDB
      const { getCachedPatientMemories } = await import('@/lib/offline/db');
      const offlineMemories = await getCachedPatientMemories();
      if (!offlineMemories || offlineMemories.length < 3) {
        data = { notEnoughData: true, memoryCount: offlineMemories?.length || 0 };
      } else {
        const m1 = offlineMemories[0];
        const m2 = offlineMemories[1];
        const m3 = offlineMemories[2];
        data = {
          story: `One pleasant day, you visited ${m2.key_term} and fondly thought of ${m1.key_term}. Then you completed ${m3.key_term}.`,
          questions: [
            {
              question: `Where was the visit in the story?`,
              options: [m2.key_term, 'The Library', 'The Train Station'],
              correctIndex: 0,
            },
            {
              question: `Who was warmly remembered?`,
              options: ['A traveler', m1.key_term, 'A neighbor'],
              correctIndex: 1,
            },
          ],
        };
      }
    }
    setLoading(false);

    if (data.notEnoughData) {
      setNotEnoughData(true);
      setMemoryCount(data.memoryCount || 0);
      return;
    }

    if (data.story && data.questions) {
      setStory(data.story);
      setQuestions(data.questions);
      setGameState('reading');
      setCurrentQuestionIndex(0);
      setMistakes(0);
      setCorrectAnswers(0);
      setSelectedOption(null);
      setFeedback(null);
    }
  };

  useEffect(() => {
    loadStory();
  }, []);

  const handleStartQuiz = () => {
    setGameState('quiz');
    quizStartTimeRef.current = Date.now();
  };

  const handleOptionClick = async (optionIndex: number) => {
    if (selectedOption !== null) return; // Prevent double clicking

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
        // Finished all questions
        const totalDuration = Date.now() - quizStartTimeRef.current;
        const totalQuestions = questions.length;
        const finalCorrect = isCorrect ? correctAnswers + 1 : correctAnswers;
        const finalMistakes = isCorrect ? mistakes : mistakes + 1;
        const finalAccuracy = Math.max(0, finalCorrect / totalQuestions);

        setGameState('finished');

        await logGameSessionWithOfflineSupport({
          gameName: 'Story Recall',
          difficulty_level: difficulty,
          accuracy: finalAccuracy,
          avg_response_time_ms: totalDuration / totalQuestions,
          mistakes: finalMistakes,
          completed: true,
        });
      }
    }, 1200);
  };

  if (loading) {
    return (
      <div className="bg-white border-4 border-black rounded-3xl p-12 text-center space-y-4 shadow-lg max-w-xl mx-auto">
        <div className="text-6xl animate-spin">📖</div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-black">
          {t('games.storyRecall.loadingTitle')}
        </h2>
        <p className="text-lg font-bold text-gray-600">
          {t('games.storyRecall.loadingDesc')}
        </p>
      </div>
    );
  }

  if (notEnoughData) {
    return (
      <div className="bg-white border-4 border-black rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-lg max-w-xl mx-auto">
        <div className="text-6xl">🌱</div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-black">
          {t('games.storyRecall.needMoreTitle')}
        </h2>
        <p className="text-lg font-bold text-gray-700 leading-relaxed">
          {t('games.storyRecall.needMoreDesc', { count: memoryCount })}
        </p>
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-base text-amber-900 font-semibold">
          {t('games.storyRecall.needMoreTip')}
        </div>
        <Link
          href="/patient/games"
          className="inline-block py-4 px-8 bg-gray-900 hover:bg-black text-white font-extrabold text-xl rounded-2xl shadow-md transition"
        >
          {t('games.storyRecall.backToGames')}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      {gameState === 'reading' && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-10 space-y-8 shadow-xl text-center">
          <div className="space-y-2">
            <span className="text-5xl md:text-6xl">📖</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-black">
              {t('games.storyRecall.readTitle')}
            </h2>
            <p className="text-base md:text-lg font-bold text-gray-600">
              {t('games.storyRecall.readSubtitle')}
            </p>
          </div>

          <div className="bg-amber-50/70 border-4 border-amber-300 rounded-3xl p-6 md:p-8 text-left shadow-inner">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed">
              &ldquo;{story}&rdquo;
            </p>
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full py-5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl md:text-3xl rounded-2xl border-2 border-black shadow-lg transition active:scale-95 flex items-center justify-center gap-3"
          >
            {t('games.storyRecall.readyButton')}
          </button>
        </div>
      )}

      {gameState === 'quiz' && questions.length > 0 && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-10 space-y-6 shadow-xl">
          <div className="flex justify-between items-center bg-blue-50 border-2 border-blue-400 rounded-2xl p-4">
            <span className="text-lg md:text-xl font-extrabold text-blue-900">
              {t('games.storyRecall.questionHeader', {
                current: currentQuestionIndex + 1,
                total: questions.length,
              })}
            </span>
            <span className="text-sm md:text-base font-bold text-gray-700 bg-white px-3 py-1 rounded-xl border border-blue-200">
              {t('games.storyRecall.title')}
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-black text-center py-2">
            {questions[currentQuestionIndex].question}
          </h3>

          <div className="space-y-4 pt-2">
            {questions[currentQuestionIndex].options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectTarget = idx === questions[currentQuestionIndex].correctIndex;

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
          avgResponseTimeMs={2000}
          difficulty={difficulty}
          onPlayAgain={loadStory}
          gameTitle={t('games.storyRecall.title')}
        />
      )}
    </div>
  );
}
