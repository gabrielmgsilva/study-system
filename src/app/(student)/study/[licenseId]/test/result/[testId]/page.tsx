import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getCurrentUserServer } from '@/lib/currentUserServer';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  params: Promise<{ licenseId: string; testId: string }>;
}

export default async function TestResultPage({ params }: Props) {
  const user = await getCurrentUserServer();
  if (!user) redirect('/auth/login');

  const { licenseId, testId } = await params;

  const session = await prisma.studySession.findFirst({
    where: { id: Number(testId), userId: user.id, mode: 'test' },
    include: { answers: true },
  });

  if (!session) redirect('/study');

  const total = session.questionsAnswered || session.answers.length;
  const correct = session.questionsCorrect || session.answers.filter((a) => a.isCorrect).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = score >= 70;
  const timeMin = Math.round((session.timeSpentMs || 0) / 60000);

  // Topic breakdown
  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const a of session.answers) {
    const code = a.tcTopicCode || 'General';
    const t = topicMap.get(code) ?? { correct: 0, total: 0 };
    t.total++;
    if (a.isCorrect) t.correct++;
    topicMap.set(code, t);
  }
  const topics = Array.from(topicMap.entries())
    .map(([code, t]) => ({ code, ...t, pct: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0 }))
    .sort((a, b) => a.pct - b.pct);

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-32">
      {/* Score Hero */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
            <circle cx="50" cy="50" r="44" fill="none" stroke={passed ? '#22c55e' : '#f59e0b'} strokeWidth="8" strokeDasharray={`${(score / 100) * 276.46} 276.46`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{score}%</span>
        </div>
        <Badge variant={passed ? 'default' : 'secondary'} className="text-base px-4 py-1">
          {passed ? 'PASSED ✓' : 'Keep going! ↗'}
        </Badge>
        <p className="text-sm text-muted-foreground mt-2">You need 70% to pass</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-3 text-center">
          <p className="text-lg font-bold">{timeMin}m</p>
          <p className="text-xs text-muted-foreground">Time</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-lg font-bold">{correct}/{total}</p>
          <p className="text-xs text-muted-foreground">Correct</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-lg font-bold">{score}%</p>
          <p className="text-xs text-muted-foreground">Score</p>
        </Card>
      </div>

      {/* Topic Breakdown */}
      <h3 className="font-semibold mb-3">Topic Breakdown</h3>
      <div className="space-y-2 mb-8">
        {topics.map((t) => (
          <div key={t.code} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{t.code}</span>
              <span className="font-medium">{t.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${t.pct >= 70 ? 'bg-green-500' : t.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${t.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Questions */}
      <h3 className="font-semibold mb-3">Questions</h3>
      <div className="space-y-1 mb-8">
        {session.answers.map((a, i) => (
          <div key={a.id} className="flex items-center gap-2 py-2 border-b border-border">
            <span className="text-sm w-8">Q{i + 1}</span>
            <Badge variant={a.isCorrect ? 'default' : 'destructive'} className="text-xs">
              {a.isCorrect ? '✓' : '✗'}
            </Badge>
          </div>
        ))}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-2">
        <Button asChild className="w-full h-12">
          <Link href={`/study/${licenseId}/test?module=${session.moduleKey}`}>Retake Test</Link>
        </Button>
        <Button asChild variant="outline" className="w-full h-12">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
