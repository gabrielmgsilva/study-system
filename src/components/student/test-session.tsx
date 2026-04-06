'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Grid3X3,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StudySessionShell } from '@/components/student/study-session-shell';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface TestSessionProps {
  sessionId: number;
  testAttemptId: number;
  questions: Question[];
  licenseId: string;
  moduleKey: string;
  timeLimitMinutes: number;
}

type TestPhase = 'pretest' | 'active' | 'finishing';

export function TestSession({
  sessionId,
  testAttemptId,
  questions,
  licenseId,
  moduleKey,
  timeLimitMinutes,
}: TestSessionProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<TestPhase>('pretest');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [showGrid, setShowGrid] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const question = questions[currentIndex];

  // Timer
  useEffect(() => {
    if (phase !== 'active') return;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timeWarning = timeLeft < 300 ? 'text-red-600' : timeLeft < 600 ? 'text-amber-600' : '';

  const saveAnswer = useCallback(
    async (key: string) => {
      try {
        await fetch('/api/study/session/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionExternalId: question.externalId,
            selectedAnswer: key,
            isCorrect: key === question.correctKey,
            tcTopicCode: question.topicCode,
          }),
        });
      } catch {
        // Continue offline
      }
    },
    [sessionId, question],
  );

  const handleSelect = useCallback(
    (key: string) => {
      setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: key }));
      saveAnswer(key);
    },
    [currentIndex, saveAnswer],
  );

  const handleFinish = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('finishing');

    const timeSpentMs = Date.now() - startTimeRef.current;
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (selectedAnswers[i] === questions[i].correctKey) correct++;
    }
    const answered = Object.keys(selectedAnswers).length;
    const score = questions.length > 0 ? correct / questions.length : 0;

    try {
      await fetch('/api/study/session/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionsTotal: questions.length,
          questionsAnswered: answered,
          questionsCorrect: correct,
          score,
          timeSpentMs,
        }),
      });

      await fetch(`/api/study/test-attempt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testAttemptId,
          status: 'completed',
          score,
          questionsCorrect: correct,
          questionsTotal: questions.length,
          timeSpentMs,
          answers: JSON.stringify(selectedAnswers),
        }),
      }).catch(() => {});
    } catch {
      // Continue
    }

    router.push(`/study/${licenseId}/test/result/${testAttemptId}`);
  }, [questions, selectedAnswers, sessionId, testAttemptId, licenseId, router]);

  const handleClose = useCallback(() => {
    if (phase === 'active') {
      setShowConfirmFinish(true);
    } else {
      router.push('/study');
    }
  }, [phase, router]);

  // Pre-test screen
  if (phase === 'pretest') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6"
        style={{ height: '100dvh' }}
      >
        <div className="w-full max-w-sm space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
              <AlertTriangle className="size-5" />
              Test Mode
            </div>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
              You will not see correct answers during the test. Timer starts
              immediately.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Questions</span>
              <span className="font-medium">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time limit</span>
              <span className="font-medium">{timeLimitMinutes} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Navigation</span>
              <span className="font-medium">Free (back & forth)</span>
            </div>
          </div>

          <Button
            className="h-14 w-full text-base"
            onClick={() => setPhase('active')}
          >
            Start Test
          </Button>
          <Button
            variant="ghost"
            className="h-12 w-full"
            onClick={() => router.push('/study')}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'finishing') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        style={{ height: '100dvh' }}
      >
        <p className="text-muted-foreground">Submitting your test…</p>
      </div>
    );
  }

  return (
    <>
      <StudySessionShell
        totalQuestions={questions.length}
        currentIndex={currentIndex}
        onClose={handleClose}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-12 flex-1"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="mr-1 size-4" /> Prev
            </Button>
            <Button
              variant={flagged.has(currentIndex) ? 'secondary' : 'outline'}
              className="h-12 px-4"
              onClick={() =>
                setFlagged((prev) => {
                  const next = new Set(prev);
                  if (next.has(currentIndex)) next.delete(currentIndex);
                  else next.add(currentIndex);
                  return next;
                })
              }
            >
              <Flag
                className={cn(
                  'size-4',
                  flagged.has(currentIndex) && 'fill-amber-500 text-amber-500',
                )}
              />
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button
                className="h-12 flex-1"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              >
                Next <ChevronRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button
                className="h-12 flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => setShowConfirmFinish(true)}
              >
                Finish Test
              </Button>
            )}
          </div>
        }
      >
        {/* Timer header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setShowGrid(true)}
            className="flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-medium active:bg-muted"
          >
            <Grid3X3 className="size-4" />
            Q{currentIndex + 1}/{questions.length}
          </button>
          <span className={cn('flex items-center gap-1 text-sm font-mono font-medium', timeWarning)}>
            <Clock className="size-4" />
            {formatTime(timeLeft)}
          </span>
        </div>

        {question && (
          <div className="space-y-4 pb-4">
            <p className="text-lg leading-relaxed">{question.stem}</p>
            <div className="space-y-2">
              {question.options.map((opt) => {
                const isSelected = selectedAnswers[currentIndex] === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelect(opt.key)}
                    className={cn(
                      'flex w-full min-h-[52px] items-start gap-3 rounded-xl border p-3 text-left text-sm transition-all',
                      'active:scale-[0.98]',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                        isSelected &&
                          'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      {opt.key}
                    </span>
                    <span className="pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </StudySessionShell>

      {/* Question Grid Sheet */}
      <Sheet open={showGrid} onOpenChange={setShowGrid}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Questions</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-8 gap-2 py-4">
            {questions.map((_, i) => {
              const answered = i in selectedAnswers;
              const isFlagged = flagged.has(i);
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentIndex(i);
                    setShowGrid(false);
                  }}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                    isCurrent && 'ring-2 ring-primary',
                    answered && !isFlagged && 'bg-primary/20 text-primary',
                    isFlagged && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
                    !answered && !isFlagged && !isCurrent && 'bg-muted',
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {Object.keys(selectedAnswers).length}/{questions.length} answered
            {flagged.size > 0 && ` · ${flagged.size} flagged`}
          </p>
        </SheetContent>
      </Sheet>

      {/* Confirm Finish Dialog */}
      <Dialog open={showConfirmFinish} onOpenChange={setShowConfirmFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Test?</DialogTitle>
            <DialogDescription>
              {Object.keys(selectedAnswers).length < questions.length
                ? `You have ${questions.length - Object.keys(selectedAnswers).length} unanswered questions.`
                : 'All questions answered.'}{' '}
              Are you sure you want to submit?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="h-12 flex-1"
              onClick={() => setShowConfirmFinish(false)}
            >
              Continue Test
            </Button>
            <Button
              className="h-12 flex-1"
              onClick={handleFinish}
            >
              Submit Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
