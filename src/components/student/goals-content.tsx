'use client';

import { useState } from 'react';
import { Plus, Target, Trophy, Calendar } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { GoalData } from '@/lib/services/goals';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface Props {
  goals: GoalData[];
}

export function GoalsContent({ goals: initialGoals }: Props) {
  const [goals, setGoals] = useState(initialGoals);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [targetType, setTargetType] = useState('custom');
  const [targetValue, setTargetValue] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const handleCreate = async () => {
    if (!title.trim() || !targetValue) return;
    setCreating(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          targetType,
          targetValue: Number(targetValue),
          targetDate: targetDate || undefined,
        }),
      });
      if (res.ok) {
        const newGoal = await res.json();
        setGoals((prev) => [newGoal, ...prev]);
        setTitle('');
        setTargetValue('');
        setTargetDate('');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (goalId: number) => {
    const res = await fetch('/api/goals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId }),
    });
    if (res.ok) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Study Goals</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
              <Plus className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Create Goal</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium block mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Reach 80% in Airframe"
                  className="w-full h-12 rounded-xl border bg-background px-3 text-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Type</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'avg_score', label: 'Score' },
                    { key: 'streak', label: 'Streak' },
                    { key: 'module_completion', label: 'Completion' },
                    { key: 'custom', label: 'Custom' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTargetType(t.key)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm min-h-[44px] border transition-colors',
                        targetType === t.key
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={
                    targetType === 'avg_score'
                      ? '80'
                      : targetType === 'streak'
                        ? '7'
                        : '100'
                  }
                  className="w-full h-12 rounded-xl border bg-background px-3 text-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Deadline (optional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full h-12 rounded-xl border bg-background px-3 text-base"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating || !title.trim() || !targetValue}
                className="w-full h-12 rounded-xl"
              >
                {creating ? 'Creating…' : 'Create Goal'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="mx-auto size-10 mb-3 opacity-40" />
          <p>No goals yet.</p>
          <p className="text-sm">Tap + to set your first study goal!</p>
        </div>
      )}

      {activeGoals.length > 0 && (
        <div className="space-y-3 mb-6">
          {activeGoals.map((g) => (
            <GoalCard key={g.id} goal={g} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Completed
          </h2>
          <div className="space-y-2">
            {completedGoals.map((g) => (
              <GoalCard key={g.id} goal={g} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onDelete,
}: {
  goal: GoalData;
  onDelete: (id: number) => void;
}) {
  const progress =
    goal.targetValue > 0
      ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
      : 0;

  const deadlineDays = goal.targetDate
    ? Math.ceil(
        (new Date(goal.targetDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <Card className={cn('p-4', goal.isCompleted && 'opacity-60')}>
      <div className="flex items-start gap-3">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0 w-12 h-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={goal.isCompleted ? '#22c55e' : 'hsl(var(--primary))'}
              strokeWidth="3"
              strokeDasharray={`${(progress / 100) * 125.66} 125.66`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
            {goal.isCompleted ? (
              <Trophy className="size-4 text-green-500" />
            ) : (
              `${progress}%`
            )}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{goal.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {goal.targetType.replace('_', ' ')}
            </Badge>
            {deadlineDays !== null && !goal.isCompleted && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Calendar className="size-3" />
                {deadlineDays > 0
                  ? `${deadlineDays}d left`
                  : 'Overdue'}
              </span>
            )}
          </div>
          {goal.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>

        {/* Delete */}
        {!goal.isCompleted && (
          <button
            onClick={() => onDelete(goal.id)}
            className="text-muted-foreground hover:text-destructive text-xs min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Delete goal"
          >
            ✕
          </button>
        )}
      </div>
    </Card>
  );
}
