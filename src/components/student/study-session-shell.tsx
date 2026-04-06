'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface StudySessionShellProps {
  totalQuestions: number;
  currentIndex: number;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function StudySessionShell({
  totalQuestions,
  currentIndex,
  onClose,
  children,
  actions,
}: StudySessionShellProps) {
  useEffect(() => {
    document.body.setAttribute('data-study-session', 'true');
    return () => {
      document.body.removeAttribute('data-study-session');
    };
  }, []);

  const progressPercent =
    totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const useDots = totalQuestions <= 15;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Mini header */}
      <div className="flex h-12 shrink-0 items-center gap-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-10 shrink-0"
          aria-label="Close session"
        >
          <X className="size-5" />
        </Button>

        <div className="flex flex-1 items-center justify-center">
          {useDots ? (
            <div className="flex gap-1.5">
              {Array.from({ length: totalQuestions }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'size-2 rounded-full transition-colors',
                    i < currentIndex
                      ? 'bg-primary'
                      : i === currentIndex
                        ? 'bg-primary ring-2 ring-primary/30'
                        : 'bg-muted',
                  )}
                />
              ))}
            </div>
          ) : (
            <Progress value={progressPercent} className="h-2 w-full max-w-48" />
          )}
        </div>

        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {currentIndex + 1}/{totalQuestions}
        </span>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto px-4">{children}</div>

      {/* Bottom action area */}
      {actions && (
        <div
          className="shrink-0 border-t bg-background px-4 pt-3"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
