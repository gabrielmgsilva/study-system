import React from 'react';
import { BookOpen, Brain, Check, Trophy, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import type { Question, OptionKey } from '@/lib/study/types';
import type { getAppDictionary } from '@/lib/i18n/app';
import { formatTime } from '@/lib/study/timer';
import { GlassCard, outlineBtn, primaryBtn, QuestionScoreIndicator } from './shared';

type Dictionary = ReturnType<typeof getAppDictionary>;

export interface QuizScreenProps {
  moduleId: string;
  moduleTitle: string;
  deckLabel: string;
  studyMode: 'flashcard' | 'practice' | 'test';
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question;
  currentScore: number;
  selectedAnswer: string;
  showFeedback: boolean;
  isCorrect: boolean;
  progress: number;
  timeLeft: number | null;
  isTimerRunning: boolean;
  showFlashcardAnswer: boolean;
  dictionary: Dictionary;
  onAnswerSelect: (value: string) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  onGoHome: () => void;
  onRevealFlashcardAnswer: () => void;
}

export function QuizScreen({
  moduleId,
  moduleTitle,
  deckLabel,
  studyMode,
  questions,
  currentQuestionIndex,
  currentQuestion,
  currentScore,
  selectedAnswer,
  showFeedback,
  isCorrect,
  progress,
  timeLeft,
  showFlashcardAnswer,
  dictionary,
  onAnswerSelect,
  onNextQuestion,
  onPreviousQuestion,
  onGoHome,
  onRevealFlashcardAnswer,
}: QuizScreenProps) {
  const isFlashcard = studyMode === 'flashcard';
  const isTest = studyMode === 'test';

  const primaryRef =
    currentQuestion.references && currentQuestion.references.length > 0
      ? currentQuestion.references[0]
      : undefined;

  const topicBadge =
    currentQuestion.tcTopicCode && currentQuestion.tcTopicTitle
      ? `${currentQuestion.tcTopicCode} – ${currentQuestion.tcTopicTitle}`
      : currentQuestion.tcTopicCode
      ? currentQuestion.tcTopicCode
      : null;

  return (
    <div className="space-y-6 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[#c9d4f4] bg-[#eef3ff] px-3 py-1 text-xs font-medium text-[#2d4bb3]">
              {isFlashcard ? (
                <>
                  <BookOpen className="w-3 h-3" />
                  <span>{dictionary.study.flashcardModeTitle}</span>
                </>
              ) : studyMode === 'practice' ? (
                <>
                  <Brain className="w-3 h-3" />
                  <span>{dictionary.study.practiceModeTitle}</span>
                </>
              ) : (
                <>
                  <Trophy className="w-3 h-3" />
                  <span>{dictionary.study.testModeTitle}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {moduleTitle}
            </h1>
            <p className="text-sm text-slate-600">{deckLabel}</p>
            {topicBadge && (
              <p className="text-xs text-slate-500">Topic: {topicBadge}</p>
            )}
          </div>

          <div className="flex flex-col items-end space-y-2">
            {isTest && timeLeft !== null && (
              <span className="rounded border border-[#c9d4f4] bg-[#eef3ff] px-2 py-1 font-mono text-sm text-[#2d4bb3]">
                Time left: {formatTime(timeLeft)}
              </span>
            )}

            <Button
              variant="outline"
              onClick={onGoHome}
              className={outlineBtn + ' min-h-[44px]'}
            >
              <X className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}% completed</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <div
              className="h-2 rounded-full bg-[#2d4bb3] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <GlassCard>
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg md:text-xl text-slate-900">
                {currentQuestion.stem}
              </CardTitle>
              {!isFlashcard && <QuestionScoreIndicator score={currentScore} />}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isFlashcard ? (
              <>
                {!showFlashcardAnswer ? (
                  <div className="flex justify-center py-4">
                    <Button onClick={onRevealFlashcardAnswer} className={primaryBtn}>
                      Show Answer
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="mb-1 font-semibold text-slate-900">
                        Correct answer
                      </p>
                      <p className="text-slate-700">
                        {currentQuestion.correctAnswer}.{' '}
                        {currentQuestion.options[currentQuestion.correctAnswer]}
                      </p>
                    </div>

                    {currentQuestion.explanation?.correct && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
                        <p className="mb-1 font-semibold text-slate-900">
                          Explanation
                        </p>
                        <p className="whitespace-pre-wrap text-slate-700">
                          {currentQuestion.explanation.correct}
                        </p>
                      </div>
                    )}

                    <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                      {primaryRef?.locator && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Reference:{' '}
                          </span>
                          {primaryRef.locator}
                        </p>
                      )}
                      {currentQuestion.tcTopicCode && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            TC Topic:{' '}
                          </span>
                          {currentQuestion.tcTopicCode}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <RadioGroup
                  value={selectedAnswer}
                  onValueChange={onAnswerSelect}
                  className="grid gap-3"
                >
                  {(['A', 'B', 'C', 'D'] as const).map((optionKey) => (
                    <Label
                      key={optionKey}
                      className={[
                        'flex items-center space-x-3 p-3 border rounded-2xl cursor-pointer transition-all',
                        selectedAnswer === optionKey
                          ? 'border-[#c9d4f4] bg-[#eef3ff]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <RadioGroupItem
                        value={optionKey}
                        id={`${moduleId}-${currentQuestion.id}-${optionKey}`}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">
                          {optionKey}. {currentQuestion.options[optionKey]}
                        </span>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>

                {studyMode === 'practice' && showFeedback && (
                  <div
                    className={[
                      'mt-4 p-3 rounded-2xl text-sm flex items-start space-x-2 border',
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-red-200 bg-red-50 text-red-800',
                    ].join(' ')}
                  >
                    <div className="mt-0.5">
                      {isCorrect ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold">
                        {isCorrect ? 'Correct!' : 'Incorrect.'}
                      </p>

                      {!isCorrect && (
                        <>
                          <p className="mt-1">
                            Correct answer:{' '}
                            <span className="font-semibold">
                              {currentQuestion.correctAnswer}.{' '}
                              {
                                currentQuestion.options[
                                  currentQuestion.correctAnswer
                                ]
                              }
                            </span>
                          </p>

                          {currentQuestion.explanation?.correct && (
                            <p className="mt-2 text-xs text-slate-700">
                              {currentQuestion.explanation.correct}
                            </p>
                          )}

                          {primaryRef?.locator && (
                            <p className="mt-2 text-xs text-slate-700">
                              <span className="font-semibold">
                                Reference:{' '}
                              </span>
                              {primaryRef.locator}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-wrap justify-between gap-2">
            <Button
              variant="outline"
              disabled={currentQuestionIndex === 0}
              onClick={onPreviousQuestion}
              className={outlineBtn}
            >
              Previous
            </Button>

            <Button onClick={onNextQuestion} className={primaryBtn}>
              {currentQuestionIndex === questions.length - 1
                ? isTest
                  ? 'Finish test'
                  : 'Finish'
                : 'Next'}
            </Button>
          </CardFooter>
        </GlassCard>
      </div>
    </div>
  );
}
