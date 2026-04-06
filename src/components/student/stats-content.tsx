'use client';

import { useState } from 'react';
import {
  BookOpen,
  Clock,
  BarChart3,
  Flame,
  Zap,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { StatsOverview, SessionHistoryItem, TopicStat } from '@/lib/services/stats';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

type Tab = 'overview' | 'history' | 'topics';

interface Props {
  overview: StatsOverview;
  initialHistory: { sessions: SessionHistoryItem[]; nextCursor: number | null };
  topics: TopicStat[];
}

export function StatsContent({ overview, initialHistory, topics }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sessions, setSessions] = useState(initialHistory.sessions);
  const [cursor, setCursor] = useState(initialHistory.nextCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/history?cursor=${cursor}`);
      if (res.ok) {
        const data = await res.json();
        setSessions((prev) => [...prev, ...data.sessions]);
        setCursor(data.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  };

  const tabItems: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'history', label: 'History' },
    { key: 'topics', label: 'Topics' },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Tab Pills */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {tabItems.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px]',
                activeTab === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {activeTab === 'overview' && <OverviewTab overview={overview} />}
        {activeTab === 'history' && (
          <HistoryTab
            sessions={sessions}
            hasMore={cursor !== null}
            loading={loading}
            onLoadMore={loadMore}
          />
        )}
        {activeTab === 'topics' && <TopicsTab topics={topics} />}
      </div>
    </div>
  );
}

// ── Overview Tab ────────────────────────────────────────────────────

function OverviewTab({ overview }: { overview: StatsOverview }) {
  const studyHours = Math.round(overview.weeklyStudyMs / 3_600_000 * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Metrics Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<BookOpen className="size-5 text-blue-500" />}
          label="Modules"
          value={`${overview.modulesStarted}/${overview.totalModules}`}
        />
        <MetricCard
          icon={<Clock className="size-5 text-purple-500" />}
          label="Study Time"
          value={`${studyHours}h`}
          subtitle="this week"
        />
        <MetricCard
          icon={<BarChart3 className="size-5 text-green-500" />}
          label="Avg Score"
          value={
            overview.avgTestScore !== null
              ? `${Math.round(overview.avgTestScore)}%`
              : '—'
          }
        />
        <MetricCard
          icon={<Flame className="size-5 text-orange-500" />}
          label="Streak"
          value={`${overview.currentStreak} days`}
        />
      </div>

      {/* XP + Sessions */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Zap className="size-5 text-amber-500" />}
          label="Total XP"
          value={String(overview.totalXp)}
        />
        <MetricCard
          icon={<BookOpen className="size-5 text-indigo-500" />}
          label="Sessions"
          value={String(overview.totalSessions)}
        />
      </div>

      {/* Score Evolution (simple bar chart) */}
      {overview.scoreHistory.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">Score Evolution</h3>
          <div className="flex items-end gap-1 h-32 overflow-x-auto scrollbar-none">
            {overview.scoreHistory.map((s, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0 w-8">
                <span className="text-[10px] text-muted-foreground mb-1">
                  {s.score}
                </span>
                <div
                  className={cn(
                    'w-5 rounded-t-sm',
                    s.score >= 70
                      ? 'bg-green-500'
                      : s.score >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500',
                  )}
                  style={{ height: `${Math.max(s.score, 5)}%` }}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weekly Study Time */}
      {overview.weeklyStudyTime.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">Weekly Study Time</h3>
          <div className="flex items-end gap-2 h-24">
            {overview.weeklyStudyTime.map((w, i) => {
              const hours = w.ms / 3_600_000;
              const maxHours = Math.max(
                ...overview.weeklyStudyTime.map((ww) => ww.ms / 3_600_000),
                1,
              );
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary/80 rounded-t-sm"
                    style={{
                      height: `${Math.max((hours / maxHours) * 100, 4)}%`,
                    }}
                  />
                  <span className="text-[9px] text-muted-foreground mt-1">
                    W{i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Difficulty per module */}
      {overview.moduleDifficulty.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">Difficulty Level</h3>
          <div className="flex flex-wrap gap-2">
            {overview.moduleDifficulty.map((m) => (
              <Badge
                key={m.moduleKey}
                variant={m.difficulty >= 4 ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {m.moduleKey} Lv.{m.difficulty}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
    </Card>
  );
}

// ── History Tab ─────────────────────────────────────────────────────

function HistoryTab({
  sessions,
  hasMore,
  loading,
  onLoadMore,
}: {
  sessions: SessionHistoryItem[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BookOpen className="mx-auto size-10 mb-3 opacity-40" />
        <p>No study sessions yet.</p>
        <p className="text-sm">Start studying to see your history here!</p>
      </div>
    );
  }

  const modeIcons: Record<string, string> = {
    flashcard: '📖',
    practice: '✏️',
    test: '📝',
  };

  return (
    <div className="space-y-2">
      {sessions.map((s) => {
        const date = new Date(s.startedAt);
        const timeMin = Math.round(s.timeSpentMs / 60_000);
        const scoreDisplay =
          s.score !== null ? `${Math.round(s.score)}%` : null;

        return (
          <Card key={s.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg flex-shrink-0">
                  {s.isQuickReview ? '⚡' : modeIcons[s.mode] || '📖'}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {s.isQuickReview ? 'Quick Review' : s.moduleKey}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {date.toLocaleDateString()} • {timeMin}min •{' '}
                    {s.questionsCorrect}/{s.questionsAnswered}
                  </p>
                </div>
              </div>
              {scoreDisplay && (
                <Badge
                  variant={
                    (s.score ?? 0) >= 70 ? 'default' : 'secondary'
                  }
                  className="flex-shrink-0"
                >
                  {scoreDisplay}
                </Badge>
              )}
            </div>
          </Card>
        );
      })}

      {hasMore && (
        <div className="py-4 text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="min-h-[44px]"
          >
            {loading ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Topics Tab ──────────────────────────────────────────────────────

function TopicsTab({ topics }: { topics: TopicStat[] }) {
  if (topics.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="mx-auto size-10 mb-3 opacity-40" />
        <p>No topic data yet.</p>
        <p className="text-sm">
          Complete some study sessions to track topic performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topics.map((t) => {
        const accuracy = Math.round((1 - t.errorRate) * 100);
        const isImproving = t.consecutiveCorrect >= 3;
        const isWeak = t.errorRate > 0.4;

        return (
          <Card key={t.id} className="p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{t.topicCode}</p>
                <p className="text-xs text-muted-foreground">
                  {t.moduleKey} • {t.totalAttempts} attempts
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isImproving ? (
                  <TrendingUp className="size-4 text-green-500" />
                ) : isWeak ? (
                  <TrendingDown className="size-4 text-red-500" />
                ) : null}
                <Badge
                  variant={
                    accuracy >= 70
                      ? 'default'
                      : accuracy >= 50
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="text-xs"
                >
                  {accuracy}%
                </Badge>
              </div>
            </div>
            <Progress
              value={accuracy}
              className="h-1.5"
            />
          </Card>
        );
      })}
    </div>
  );
}
