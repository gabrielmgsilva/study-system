'use client';

import Link from 'next/link';
import {
  Zap,
  Play,
  ClipboardList,
  Trophy,
  BookOpen,
  Clock,
  Target,
  Flame,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DashboardData } from '@/lib/services/dashboard';

interface DashboardContentProps {
  data: DashboardData;
}

function formatTime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getFirstName(name: string | null): string {
  if (!name) return 'there';
  return name.trim().split(/\s+/)[0];
}

export function DashboardContent({ data }: DashboardContentProps) {
  const { user, streak, studyProgress, weakTopics, activeGoals, modules } = data;

  const isTrial = user.subscriptionStatus === 'trialing';
  const totalQuestions = studyProgress.reduce((s, p) => s + p.questionsTotal, 0);
  const totalCorrect = studyProgress.reduce((s, p) => s + p.questionsCorrect, 0);
  const totalTimeMs = studyProgress.reduce((s, p) => s + p.totalTimeSpentMs, 0);
  const avgScore =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Find the last-studied module for "Continue Learning"
  const lastStudiedProgress = studyProgress
    .filter((p) => p.lastStudiedAt)
    .sort(
      (a, b) =>
        new Date(b.lastStudiedAt!).getTime() -
        new Date(a.lastStudiedAt!).getTime(),
    )[0];

  const lastStudiedModule = lastStudiedProgress
    ? modules.find((m) => m.moduleKey === lastStudiedProgress.moduleKey)
    : modules[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* Section 1 — Greeting */}
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Hey {getFirstName(user.name)}!
          </h1>
          {isTrial && (
            <Badge variant="secondary" className="text-xs">
              Trial
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
          {streak && streak.currentStreak > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="size-4 text-orange-500" />
              {streak.currentStreak} day streak
            </span>
          )}
          {streak && streak.totalXp > 0 && (
            <span className="flex items-center gap-1">
              <Sparkles className="size-4 text-yellow-500" />
              {streak.totalXp.toLocaleString()} XP
            </span>
          )}
        </div>
      </section>

      {/* Section 2 — Upgrade Banner (trial only) */}
      {isTrial && (
        <section>
          <Card className="border-primary/20 bg-primary/5 py-4">
            <CardContent className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Upgrade to unlock all features
                </p>
                <p className="text-xs text-muted-foreground">
                  Get unlimited practice, tests & more
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/plans">Upgrade</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Section 3 — Quick Actions */}
      <section>
        <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4">
          {[
            {
              href: '/quick-review',
              label: 'Quick Review',
              icon: Zap,
              color: 'bg-yellow-500/10 text-yellow-600',
            },
            {
              href: '/study',
              label: 'Continue',
              icon: Play,
              color: 'bg-green-500/10 text-green-600',
            },
            {
              href: '/study?mode=test',
              label: 'Test',
              icon: ClipboardList,
              color: 'bg-blue-500/10 text-blue-600',
            },
            {
              href: '/stats',
              label: 'Scores',
              icon: Trophy,
              color: 'bg-purple-500/10 text-purple-600',
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent',
              )}
            >
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full',
                  action.color,
                )}
              >
                <action.icon className="size-3.5" />
              </span>
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Section 4 — Continue Learning */}
      {lastStudiedModule && (
        <section>
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent py-0">
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Continue Learning
              </p>
              <h2 className="mt-1 text-lg font-bold">
                {lastStudiedModule.name}
              </h2>
              {lastStudiedProgress && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {lastStudiedProgress.questionsTotal > 0
                        ? Math.round(
                            (lastStudiedProgress.questionsCorrect /
                              lastStudiedProgress.questionsTotal) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      lastStudiedProgress.questionsTotal > 0
                        ? (lastStudiedProgress.questionsCorrect /
                            lastStudiedProgress.questionsTotal) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              )}
              <Button size="sm" className="mt-4" asChild>
                <Link href="/study">
                  Resume
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Section 5 — Progress Grid */}
      <section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: 'Modules',
              value: modules.length.toString(),
              icon: BookOpen,
              color: 'text-blue-500',
            },
            {
              label: 'Study Time',
              value: formatTime(totalTimeMs),
              icon: Clock,
              color: 'text-green-500',
            },
            {
              label: 'Avg Score',
              value: `${avgScore}%`,
              icon: Target,
              color: 'text-purple-500',
            },
            {
              label: 'Streak',
              value: `${streak?.currentStreak ?? 0}d`,
              icon: Flame,
              color: 'text-orange-500',
            },
          ].map((stat) => (
            <Card key={stat.label} className="py-4">
              <CardContent className="flex items-center gap-3">
                <stat.icon className={cn('size-5 shrink-0', stat.color)} />
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight">
                    {stat.value}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 6 — Course Progress */}
      {modules.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Course Progress</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {modules.map((mod) => {
              const progress = studyProgress.find(
                (p) => p.moduleKey === mod.moduleKey,
              );
              const pct =
                progress && progress.questionsTotal > 0
                  ? Math.round(
                      (progress.questionsCorrect / progress.questionsTotal) *
                        100,
                    )
                  : 0;

              return (
                <Card key={mod.moduleKey} className="py-4">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{mod.name}</h3>
                      <span className="text-xs font-medium text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2 h-1.5" />
                    {progress && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {progress.questionsCorrect}/{progress.questionsTotal}{' '}
                        correct · {formatTime(progress.totalTimeSpentMs)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 7 — Topics to Review */}
      {weakTopics.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Topics to Review</h2>
          <div className="space-y-3">
            {weakTopics.map((topic, i) => {
              const colors = [
                'border-l-red-500',
                'border-l-orange-500',
                'border-l-yellow-500',
              ];
              const mod = modules.find(
                (m) => m.moduleKey === topic.moduleKey,
              );

              return (
                <Card
                  key={topic.id}
                  className={cn('border-l-4 py-4', colors[i] ?? 'border-l-red-500')}
                >
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {topic.topicCode}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {mod?.name ?? topic.moduleKey} ·{' '}
                        {Math.round(topic.errorRate * 100)}% error rate
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      asChild
                    >
                      <Link href={`/study?topic=${topic.topicCode}`}>
                        Practice
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Section — Active Goals */}
      {activeGoals.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Your Goals</h2>
          <div className="space-y-3">
            {activeGoals.slice(0, 3).map((goal) => {
              const pct =
                goal.targetValue > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (goal.currentValue / goal.targetValue) * 100,
                      ),
                    )
                  : 0;

              return (
                <Card key={goal.id} className="py-4">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{goal.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {pct}%
                      </Badge>
                    </div>
                    <Progress value={pct} className="mt-2 h-1.5" />
                    {goal.targetDate && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Due{' '}
                        {new Date(goal.targetDate).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric' },
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
