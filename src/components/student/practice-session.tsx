'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudySessionShell } from '@/components/student/study-session-shell';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface Question {
  id: number;
  externalId: string;
  stem: string;
  topicCode: string;
  topicName: string;
  subjectCode: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string | null;
  references: { document: string | null; locator: string | null }[];
  difficulty: number | null;
}

interface PracticeSessionProps {
  sessionId: number;
  questions: Question[];
  licenseId: string;
  moduleKey: string;
}

type AnswerRecord = {
  questionIndex: number;
  selected: string;
  isCorrect: boolean;
};

type Phase = 'selecting' | 'checked' | 'transitioning';

export function PracticeSession({
  sessionId,
  questions,
  licenseId,
  moduleKey,
}: PracticeSessionProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('selecting');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showResult, setShowResult] = useState(false);

  const question = questions[currentIndex];

  const haptic = useCallback((ms: number | number[]) => {
    navigator.vibrate?.(ms);
  }, []);

  const saveAnswer = useCallback(
    async (selected: string, isCorrect: boolean) => {
      try {
        await fetch('/api/study/session/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionExternalId: question.externalId,
            selectedAnswer: selected,
            isCorrect,
            tcTopicCode: question.topicCode,
          }),
        });
      } catch {
        // Continue offline
      }
    },
    [sessionId, question],
  );

  const finishSession = useCallback(
    async (finalAnswers: AnswerRecord[]) => {
      const correct = finalAnswers.filter((a) => a.isCorrect).length;
      try {
        await fetch('/api/study/session/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionsTotal: questions.length,
            questionsAnswered: finalAnswers.length,
            questionsCorrect: correct,
            score: finalAnswers.length > 0 ? correct / finalAnswers.length : 0,
            timeSpentMs: 0,
          }),
        });
      } catch {
        // Continue offline
      }
    },
    [sessionId, questions.length],
  );

  const handleCheck = useCallback(async () => {
    if (!selectedKey || !question) return;
    const isCorrect = selectedKey === question.correctKey;
    haptic(isCorrect ? 10 : [10, 30, 10]);

    const record: AnswerRecord = {
      questionIndex: currentIndex,
      selected: selectedKey,
      isCorrect,
    };
    const newAnswers = [...answers, record];
    setAnswers(newAnswers);
    setPhase('checked');
    await saveAnswer(selectedKey, isCorrect);

    if (currentIndex >= questions.length - 1) {
      await finishSession(newAnswers);
    }
  }, [selectedKey, question, currentIndex, answers, haptic, saveAnswer, questions.length, finishSession]);

  const handleNext = useCallback(() => {
    if (currentIndex >= questions.length - 1) {
      setShowResult(true);
      return;
    }
    setPhase('transitioning');
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setSelectedKey(null);
      setPhase('selecting');
    }, 200);
  }, [currentIndex, questions.length]);

  const handleClose = useCallback(() => {
    router.push('/study');
  }, [router]);

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const scorePercent =
    answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  // Topic breakdown
  const topicMap = new Map<string, { name: string; correct: number; total: number }>();
  for (const a of answers) {
    const q = questions[a.questionIndex];
    const existing = topicMap.get(q.topicCode) ?? {
      name: q.topicName,
      correct: 0,
      total: 0,
    };
    existing.total++;
    if (a.isCorrect) existing.correct++;
    topicMap.set(q.topicCode, existing);
  }

  if (!question && !showResult) return null;

  return (
    <>
      <StudySessionShell
        totalQuestions={questions.length}
        currentIndex={currentIndex}
        onClose={handleClose}
        actions={
          !showResult ? (
            phase === 'selecting' ? (
              <Button
                className="h-14 w-full text-base"
                disabled={!selectedKey}
                onClick={handleCheck}
              >
                {selectedKey ? 'Check Answer' : 'Select an answer'}
              </Button>
            ) : phase === 'checked' ? (
              <Button className="h-14 w-full text-base" onClick={handleNext}>
                {currentIndex >= questions.length - 1
                  ? 'See Results'
                  : 'Next Question →'}
              </Button>
            ) : null
          ) : undefined
        }
      >
        {!showResult && question && (
          <div
            className={cn(
              'space-y-4 py-4 transition-opacity duration-200',
              phase === 'transitioning' && 'opacity-0',
            )}
          >
            <div className="text-xs text-muted-foreground">
              {question.topicName}
            </div>
            <p className="text-lg leading-relaxed">{question.stem}</p>

            <div className="space-y-2 pt-2">
              {question.options.map((opt) => {
                const isSelected = selectedKey === opt.key;
                const isCorrectOption = opt.key === question.correctKey;
                const showFeedback = phase === 'checked';

                return (
                  <button
                    key={opt.key}
                    disabled={phase !== 'selecting'}
                    onClick={() => setSelectedKey(opt.key)}
                    className={cn(
                      'flex w-full min-h-[52px] items-start gap-3 rounded-xl border p-3 text-left text-sm transition-all',
                      'active:scale-[0.98]',
                      !showFeedback && isSelected && 'border-primary ring-2 ring-primary/20',
                      !showFeedback && !isSelected && 'border-border',
                      showFeedback && isCorrectOption && 'border-green-500 bg-green-50 dark:bg-green-950/20',
                      showFeedback && isSelected && !isCorrectOption && 'border-red-500 bg-red-50 dark:bg-red-950/20',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                        !showFeedback && isSelected && 'border-primary bg-primary text-primary-foreground',
                        showFeedback && isCorrectOption && 'border-green-500 bg-green-500 text-white',
                        showFeedback && isSelected && !isCorrectOption && 'border-red-500 bg-red-500 text-white',
                      )}
                    >
                      {opt.key}
                    </span>
                    <span className="pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {phase === 'checked' && (
              <div
                className={cn(
                  'rounded-xl p-4',
                  selectedKey === question.correctKey
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : 'bg-red-50 dark:bg-red-950/20',
                )}
              >
                {selectedKey === question.correctKey ? (
                  <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
                    <CheckCircle2 className="size-5" /> Correct!
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
                    <XCircle className="size-5" /> Answer is {question.correctKey}
                  </div>
                )}
                {question.explanation && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {question.explanation}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </StudySessionShell>

      {/* Result Sheet */}
      <Sheet open={showResult} onOpenChange={setShowResult}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Practice Complete!</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center">
              <div className="relative flex size-28 items-center justify-center">
                <svg className="size-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="currentColor" className="text-muted" strokeWidth="8"
                  />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="currentColor" className="text-primary" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${scorePercent * 2.64} ${264 - scorePercent * 2.64}`}
                  />
                </svg>
                <span className="absolute text-2xl font-bold">{scorePercent}%</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {correctCount} of {answers.length} correct
              </p>
            </div>

            {/* Topic breakdown */}
            {topicMap.size > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Topic Breakdown</h3>
                {Array.from(topicMap.entries()).map(([code, data]) => {
                  const pct = Math.round((data.correct / data.total) * 100);
                  return (
                    <div key={code} className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm">{data.name}</span>
                      <Badge variant={pct >= 80 ? 'default' : pct >= 50 ? 'secondary' : 'destructive'}>
                        {pct}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-12 flex-1"
                onClick={() => router.push('/study')}
              >
                Back to Study
              </Button>
              <Button
                className="h-12 flex-1"
                onClick={() =>
                  router.push(
                    `/study/${licenseId}/practice?module=${moduleKey}`,
                  )
                }
              >
                Practice Again
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
