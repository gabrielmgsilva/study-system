'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

interface FlashcardSessionProps {
  sessionId: number;
  questions: Question[];
  licenseId: string;
  moduleKey: string;
}

type AnswerResult = { knew: boolean; questionIndex: number };

export function FlashcardSession({
  sessionId,
  questions,
  licenseId,
}: FlashcardSessionProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<AnswerResult[]>([]);
  const [slideDir, setSlideDir] = useState<'in' | 'out-left' | 'out-right'>('in');
  const [showResult, setShowResult] = useState(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const question = questions[currentIndex];
  const correctOption = question?.options.find(
    (o) => o.key === question.correctKey,
  );

  const haptic = useCallback((ms: number | number[]) => {
    navigator.vibrate?.(ms);
  }, []);

  const saveAnswer = useCallback(
    async (knew: boolean) => {
      try {
        await fetch('/api/study/session/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionExternalId: question.externalId,
            selectedAnswer: knew ? question.correctKey : '',
            isCorrect: knew,
            tcTopicCode: question.topicCode,
          }),
        });
      } catch {
        // Continue even if save fails
      }
    },
    [sessionId, question],
  );

  const finishSession = useCallback(async () => {
    const correct = answers.filter((a) => a.knew).length;
    try {
      await fetch('/api/study/session/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionsTotal: questions.length,
          questionsAnswered: answers.length,
          questionsCorrect: correct,
          score: answers.length > 0 ? correct / answers.length : 0,
          timeSpentMs: 0,
        }),
      });
    } catch {
      // Continue even if save fails
    }
  }, [sessionId, questions.length, answers]);

  const goNext = useCallback(
    async (knew: boolean) => {
      haptic(knew ? 10 : [10, 30, 10]);
      const newAnswers = [...answers, { knew, questionIndex: currentIndex }];
      setAnswers(newAnswers);
      await saveAnswer(knew);

      if (currentIndex >= questions.length - 1) {
        setShowResult(true);
        await finishSession();
        return;
      }

      setSlideDir(knew ? 'out-left' : 'out-right');
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setFlipped(false);
        setSlideDir('in');
      }, 250);
    },
    [currentIndex, questions.length, answers, haptic, saveAnswer, finishSession],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchRef.current || !flipped) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchRef.current.x;
      const dy = touch.clientY - touchRef.current.y;
      touchRef.current = null;

      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        // Swipe LEFT → "Knew it", RIGHT → "Didn't know"
        goNext(dx < 0);
      }
    },
    [flipped, goNext],
  );

  const handleClose = useCallback(() => {
    router.push(`/study`);
  }, [router]);

  const knewCount = answers.filter((a) => a.knew).length;
  const scorePercent =
    answers.length > 0 ? Math.round((knewCount / answers.length) * 100) : 0;

  if (!question && !showResult) return null;

  return (
    <>
      <StudySessionShell
        totalQuestions={questions.length}
        currentIndex={currentIndex}
        onClose={handleClose}
        actions={
          !showResult && flipped ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => goNext(false)}
                className="h-16 flex-1 border-red-300 text-red-600 text-base active:bg-red-50"
              >
                <X className="mr-2 size-5" /> Didn&apos;t know
              </Button>
              <Button
                onClick={() => goNext(true)}
                className="h-16 flex-1 bg-green-600 text-base text-white hover:bg-green-700 active:bg-green-800"
              >
                ✓ Knew it
              </Button>
            </div>
          ) : !showResult ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Tap the card to flip
            </p>
          ) : undefined
        }
      >
        {!showResult && question && (
          <div
            className="flex h-full items-center justify-center py-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={cn(
                'w-full max-w-sm transition-all duration-250',
                slideDir === 'out-left' && '-translate-x-full opacity-0',
                slideDir === 'out-right' && 'translate-x-full opacity-0',
                slideDir === 'in' && 'translate-x-0 opacity-100',
              )}
              style={{ perspective: '1000px' }}
            >
              <div
                onClick={() => !flipped && setFlipped(true)}
                className={cn(
                  'relative cursor-pointer transition-transform duration-300',
                  'will-change-transform',
                )}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div
                  className="rounded-2xl border bg-card p-6 shadow-sm"
                  style={{ backfaceVisibility: 'hidden', minHeight: '60vw', maxHeight: '70vh' }}
                >
                  <div className="mb-2 text-xs text-muted-foreground">
                    {question.topicName}
                  </div>
                  <p className="text-lg leading-relaxed">{question.stem}</p>
                  <p className="mt-8 text-center text-sm text-muted-foreground">
                    <RotateCcw className="mx-auto mb-1 size-4" />
                    Tap to flip
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 overflow-y-auto rounded-2xl border bg-card p-6 shadow-sm"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    minHeight: '60vw',
                    maxHeight: '70vh',
                  }}
                >
                  <div className="mb-3 text-xs text-muted-foreground">
                    Answer
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {correctOption?.key}. {correctOption?.text}
                  </p>
                  {question.explanation && (
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {question.explanation}
                    </p>
                  )}
                  {question.references.length > 0 && (
                    <div className="mt-4 space-y-1">
                      {question.references.map((ref, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          📖 {ref.document}
                          {ref.locator && ` — ${ref.locator}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </StudySessionShell>

      {/* Result Sheet */}
      <Sheet open={showResult} onOpenChange={setShowResult}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Session Complete!</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-4">
            {/* Score ring */}
            <div className="flex flex-col items-center">
              <div className="relative flex size-28 items-center justify-center">
                <svg className="size-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    className="text-muted"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    className="text-primary"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${scorePercent * 2.64} ${264 - scorePercent * 2.64}`}
                  />
                </svg>
                <span className="absolute text-2xl font-bold">{scorePercent}%</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {knewCount} of {answers.length} cards known
              </p>
            </div>

            {/* Errors list */}
            {answers.some((a) => !a.knew) && (
              <div>
                <h3 className="mb-2 text-sm font-medium">Review these:</h3>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {answers
                    .filter((a) => !a.knew)
                    .map((a) => {
                      const q = questions[a.questionIndex];
                      return (
                        <div
                          key={a.questionIndex}
                          className="rounded-lg border p-3 text-sm"
                        >
                          <p className="line-clamp-2">{q.stem}</p>
                          <p className="mt-1 font-medium text-green-600">
                            {q.correctKey}.{' '}
                            {q.options.find((o) => o.key === q.correctKey)?.text}
                          </p>
                        </div>
                      );
                    })}
                </div>
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
                onClick={() => router.push(`/study/${licenseId}/flashcard?module=${questions[0]?.topicCode ?? ''}`)}
              >
                Try Again
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
