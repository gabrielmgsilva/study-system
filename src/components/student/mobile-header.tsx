'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MobileHeaderProps {
  userName: string | null;
  currentStreak: number;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MobileHeader({ userName, currentStreak }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm',
        'lg:hidden',
      )}
    >
      <span className="text-lg font-bold text-primary">AME</span>

      {currentStreak > 0 && (
        <div className="flex items-center gap-1 text-sm font-medium">
          <span>🔥</span>
          <span>{currentStreak}</span>
        </div>
      )}

      <Avatar className="size-8">
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
