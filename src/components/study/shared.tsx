import React from 'react';
import { Card } from '@/components/ui/card';

export function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={[
        'rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] md:rounded-[30px]',
        className,
      ].join(' ')}
    >
      <div>{children}</div>
    </Card>
  );
}

export const outlineBtn =
  'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
export const primaryBtn =
  'border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99]';

export function QuestionScoreIndicator({ score }: { score: number }) {
  const max = 5;
  const levels = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
      <span className="font-medium text-slate-700">Level {score}/5</span>
      <div className="flex gap-1">
        {levels.map((lvl) => (
          <div
            key={lvl}
            className={[
              'h-2 w-2 rounded-full border border-slate-300',
              lvl <= score ? 'bg-[#2d4bb3]' : 'bg-transparent',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
