'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

import type { SelectedQuestion } from '@/lib/services/study-engine';
import StudySessionShell from './study-session-shell';

interface Props {
  questions: SelectedQuestion[];
  sessionId: number;
  showUpgradeCta?: boolean;
}

export default function QuickReviewSession({ questions, sessionId, showUpgradeCta }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const isCorrect = selected === q?.correctKey;

  const handleCheck = useCallback(() => {
    if (!selected || !q) return;
    setChecked(true);
    const correct = selected === q.correctKey;
    setResults((r) => [...r, correct]);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(correct ? [30] : [30, 50, 30]);
    }

    fetch('/api/study/session/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        questionExternalId: q.externalId,
        selectedAnswer: selected,
        isCorrect: correct,
        tcTopicCode: q.topicCode,
      }),
    }).catch(() => {});
  }, [selected, q, sessionId]);

  const handleNext = useCallback(() => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setChecked(false);
    } else {
      fetch(`/api/study/session`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, timeSpentMs: 0 }),
      }).catch(() => {});
      setDone(true);
    }
  }, [index, questions.length, sessionId]);

  if (done) {
    const correctCount = results.filter(Boolean).length;
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 text-center">
        <Zap className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Quick Review Done!</h2>
        <p className="text-4xl font-bold mb-1">{correctCount}/{questions.length}</p>
        <p className="text-sm text-muted-foreground mb-6">+10 XP</p>
        {showUpgradeCta && (
          <div className="bg-muted rounded-xl p-4 mb-6 w-full max-w-sm">
            <p className="text-sm mb-2">Want more study sessions?</p>
            <a href="/plans" className="text-sm text-primary font-medium">Reactivate your plan →</a>
          </div>
        )}
        <button onClick={() => router.push('/dashboard')} className="w-full max-w-sm h-12 rounded-xl bg-primary text-primary-foreground font-medium">
          Done
        </button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <StudySessionShell
      totalQuestions={questions.length}
      currentIndex={index}
      onClose={() => router.push('/dashboard')}
      actions={
        !checked ? (
          <button onClick={handleCheck} disabled={!selected} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50">
            Check Answer
          </button>
        ) : (
          <button onClick={handleNext} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium">
            {index + 1 < questions.length ? 'Next →' : 'See Results'}
          </button>
        )
      }
    >
      <div className="px-4 mb-4">
        <p className="text-lg leading-relaxed">{q.stem}</p>
      </div>
      <div className="px-4 space-y-2">
        {q.options.map((opt) => {
          let cls = 'w-full min-h-[52px] p-3 rounded-xl border-2 text-left text-base transition-all ';
          if (!checked) {
            cls += selected === opt.key ? 'border-primary bg-primary/10' : 'border-border bg-card';
          } else if (opt.key === q.correctKey) {
            cls += 'border-green-500 bg-green-50 dark:bg-green-950/30';
          } else if (opt.key === selected && !isCorrect) {
            cls += 'border-red-500 bg-red-50 dark:bg-red-950/30';
          } else {
            cls += 'border-border bg-card opacity-60';
          }
          return (
            <button key={opt.key} onClick={() => !checked && setSelected(opt.key)} disabled={checked} className={cls}>
              <span className="font-medium mr-2">{opt.key}.</span>{opt.text}
            </button>
          );
        })}
      </div>
      {checked && (
        <div className={`mx-4 mt-4 p-3 rounded-xl border ${isCorrect ? 'bg-green-50 dark:bg-green-950/30 border-green-200' : 'bg-red-50 dark:bg-red-950/30 border-red-200'}`}>
          <p className={`font-semibold text-sm ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {isCorrect ? '✓ Correct!' : `✗ Answer: ${q.correctKey}`}
          </p>
          {q.explanation && <p className="text-sm text-muted-foreground mt-1">{q.explanation}</p>}
        </div>
      )}
    </StudySessionShell>
  );
}
