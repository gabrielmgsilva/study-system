import React from 'react';
import { BookOpen, Brain, RefreshCw, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { TopicBreakdownRow } from '@/lib/study/types';
import { GlassCard, outlineBtn, primaryBtn } from './shared';

import type { ScoreSummary } from './PracticeResultsScreen';
export type { ScoreSummary };

export interface TestResultsScreenProps {
  moduleTitle: string;
  score: ScoreSummary;
  topicRows: TopicBreakdownRow[];
  onRestartCurrentMode: () => void;
  onGoHome: () => void;
  onPracticeOnlyIncorrect: () => void;
}

export function TestResultsScreen({
  moduleTitle,
  score,
  topicRows,
  onRestartCurrentMode,
  onGoHome,
  onPracticeOnlyIncorrect,
}: TestResultsScreenProps) {
  const { total, correct, incorrect, answered, unanswered, percentage } = score;

  const passMark = 70;
  const pass = percentage >= passMark;

  const hasTopicBreakdown = topicRows.length > 0;

  const focusTopics = topicRows
    .filter((r) => r.classification === 'Needs Study')
    .map((r) => r.topicCode);

  const focusText =
    focusTopics.length > 0
      ? `You should focus on: ${focusTopics.join(', ')}`
      : 'No weak topics detected in this test (keep practicing to confirm).';

  const handleCopyFocus = async () => {
    try {
      await navigator.clipboard.writeText(focusText);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <GlassCard>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#c9d4f4] bg-[#eef3ff]">
              <Trophy className="h-10 w-10 text-[#2d4bb3]" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-slate-900">
                Test Results – {moduleTitle}
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Unofficial TC-style feedback (for study only).
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-4xl font-bold tracking-tight text-slate-900">
                  {percentage}%{' '}
                  <span className="text-base font-normal text-slate-600">
                    score
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border',
                      pass
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-red-200 bg-red-50 text-red-800',
                    ].join(' ')}
                  >
                    {pass ? 'PASS' : 'FAIL'} (pass mark {passMark}%)
                  </span>
                  <span className="text-xs text-slate-500">
                    Unanswered count as incorrect
                  </span>
                </div>

                <p className="text-sm text-slate-600">
                  {correct} of {total} questions correct
                </p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>
                    • Answered:{' '}
                    <span className="font-medium text-slate-900">{answered}</span>
                  </li>
                  <li>
                    • Unanswered:{' '}
                    <span className="font-medium text-slate-900">
                      {unanswered}
                    </span>
                  </li>
                  <li>
                    • Incorrect:{' '}
                    <span className="font-medium text-slate-900">{incorrect}</span>
                  </li>
                </ul>
              </div>

              <div className="w-full md:w-64">
                <div className="relative w-40 h-40 mx-auto">
                  <div className="absolute inset-0 rounded-full border border-slate-200 bg-slate-100" />
                  <div
                    className="absolute inset-3 rounded-full border-[10px] border-[#d9e2fb]"
                    style={{
                      background: `conic-gradient(rgba(45,75,179,0.92) ${percentage}%, rgba(226,232,240,0.85) ${percentage}%)`,
                    }}
                  />
                  <div className="absolute inset-7 flex items-center justify-center rounded-full border border-slate-200 bg-white">
                    <span className="text-3xl font-bold text-slate-900">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {hasTopicBreakdown && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Study focus
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{focusText}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={outlineBtn}
                    onClick={handleCopyFocus}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {hasTopicBreakdown && (
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Topic breakdown (TC-style feedback)
                </h3>
                <p className="text-xs text-slate-600">
                  This helps you see which TC topics need more study.
                </p>

                <div className="space-y-2 max-h-80 overflow-auto pr-1">
                  {topicRows.map((r) => (
                    <div
                      key={r.topicCode}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {r.topicCode}
                            {r.topicTitle ? ` – ${r.topicTitle}` : ''}
                          </p>
                          {r.sectionCode && (
                            <p className="text-xs text-slate-500">
                              Section {r.sectionCode}
                              {r.sectionTitle ? ` – ${r.sectionTitle}` : ''}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {r.correct}/{r.total} · {r.percentage}%
                          </p>
                          <p className="text-xs text-slate-600">
                            {r.classification}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col md:flex-row md:justify-between gap-3">
            <Button
              onClick={onRestartCurrentMode}
              className={primaryBtn + ' w-full md:w-auto'}
              size="lg"
            >
              <Brain className="w-4 h-4 mr-2" />
              Take another test
            </Button>

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

              <Button
                onClick={onPracticeOnlyIncorrect}
                variant="outline"
                className={outlineBtn}
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Practice only incorrect questions
              </Button>
            </div>
          </CardFooter>
        </GlassCard>
      </div>
    </div>
  );
}
