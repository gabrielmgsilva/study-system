import React from 'react';
import { BookOpen, Brain } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { Question, UserAnswer } from '@/lib/study/types';
import { GlassCard, outlineBtn, primaryBtn } from './shared';

export interface ScoreSummary {
  total: number;
  correct: number;
  incorrect: number;
  answered: number;
  unanswered: number;
  percentage: number;
}

export interface PracticeResultsScreenProps {
  moduleTitle: string;
  score: ScoreSummary;
  questions: Question[];
  userAnswers: UserAnswer[];
  onRestartCurrentMode: () => void;
  onGoHome: () => void;
  onPracticeOnlyIncorrect: () => void;
}

export function PracticeResultsScreen({
  moduleTitle,
  score,
  questions,
  userAnswers,
  onRestartCurrentMode,
  onGoHome,
  onPracticeOnlyIncorrect,
}: PracticeResultsScreenProps) {
  const { total, correct, incorrect, answered, unanswered, percentage } = score;

  const incorrectDetails = userAnswers
    .filter((a) => !a.isCorrect)
    .map((ans, idx) => {
      const q = questions.find((qq) => qq.id === ans.questionId);
      return q
        ? {
            idx,
            question: q,
            answer: ans,
          }
        : null;
    })
    .filter(Boolean) as {
    idx: number;
    question: Question;
    answer: UserAnswer;
  }[];

  return (
    <div className="space-y-6 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <GlassCard>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#c9d4f4] bg-[#eef3ff]">
              <Brain className="h-9 w-9 text-[#2d4bb3]" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-900">
                Practice Summary – {moduleTitle}
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Use this to attack your weak questions.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {percentage}%{' '}
                  <span className="text-sm font-normal text-slate-600">
                    correct in this practice
                  </span>
                </p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>
                    • Total questions in deck:{' '}
                    <span className="font-medium text-slate-900">{total}</span>
                  </li>
                  <li>
                    • Answered:{' '}
                    <span className="font-medium text-slate-900">{answered}</span>
                  </li>
                  <li>
                    • Unanswered:{' '}
                    <span className="font-medium text-slate-900">{unanswered}</span>
                  </li>
                  <li>
                    • Correct:{' '}
                    <span className="font-medium text-slate-900">{correct}</span>
                  </li>
                  <li>
                    • Incorrect:{' '}
                    <span className="font-medium text-slate-900">{incorrect}</span>
                  </li>
                </ul>
              </div>

              <div className="w-full md:w-64">
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 rounded-full border border-slate-200 bg-slate-100" />
                  <div
                    className="absolute inset-2 rounded-full border-[8px] border-[#d9e2fb]"
                    style={{
                      background: `conic-gradient(rgba(45,75,179,0.92) ${percentage}%, rgba(226,232,240,0.85) ${percentage}%)`,
                    }}
                  />
                  <div className="absolute inset-6 flex items-center justify-center rounded-full border border-slate-200 bg-white">
                    <span className="text-2xl font-bold text-slate-900">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Questions you missed
              </h3>
              {incorrectDetails.length === 0 ? (
                <p className="text-xs text-slate-600">
                  You didn&apos;t miss any question in this practice. Great
                  job!
                </p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-auto overscroll-contain pr-1">
                  {incorrectDetails.map(({ idx, question, answer }) => {
                    const ref =
                      question.references && question.references.length > 0
                        ? question.references[0]
                        : undefined;

                    return (
                      <div
                        key={`${question.id}-${idx}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs"
                      >
                        <p className="mb-1 font-semibold text-slate-900">
                          Q{idx + 1}. {question.stem}
                        </p>
                        <p className="mb-1 text-slate-700">
                          Your answer:{' '}
                          <span className="font-semibold text-slate-900">
                            {answer.selectedAnswer}.{' '}
                            {question.options[answer.selectedAnswer]}
                          </span>
                        </p>
                        <p className="mb-1 text-slate-700">
                          Correct answer:{' '}
                          <span className="font-semibold text-slate-900">
                            {question.correctAnswer}.{' '}
                            {question.options[question.correctAnswer]}
                          </span>
                        </p>
                        {ref?.locator && (
                          <p className="text-[11px] text-slate-500">
                            Reference: {ref.locator}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col md:flex-row md:justify-between gap-3">
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <Button
                className={primaryBtn + ' w-full md:w-auto'}
                size="lg"
                onClick={onRestartCurrentMode}
              >
                <Brain className="w-4 h-4 mr-2" />
                Repeat practice with same configuration
              </Button>

              <Button
                className={'w-full md:w-auto ' + outlineBtn}
                size="lg"
                variant="outline"
                disabled={userAnswers.filter((a) => !a.isCorrect).length === 0}
                onClick={onPracticeOnlyIncorrect}
              >
                Study only the questions I got wrong
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                onClick={onGoHome}
                variant="outline"
                className={'w-full sm:w-auto ' + outlineBtn}
                size="lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Back to module home
              </Button>
            </div>
          </CardFooter>
        </GlassCard>
      </div>
    </div>
  );
}
