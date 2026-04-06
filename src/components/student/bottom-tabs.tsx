'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Zap, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/dashboard', label: 'Home', icon: Home, isFab: false },
  { href: '/study', label: 'Study', icon: BookOpen, isFab: false },
  { href: '/quick-review', label: 'Review', icon: Zap, isFab: true },
  { href: '/stats', label: 'Stats', icon: BarChart3, isFab: false },
  { href: '/profile', label: 'Me', icon: User, isFab: false },
] as const;

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm',
        'lg:hidden',
        '[[data-study-session]_&]:hidden',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          if (tab.isFab) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'min-h-[44px] min-w-[44px]',
                  '-mt-5',
                )}
              >
                <span
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full shadow-lg',
                    'bg-primary text-primary-foreground',
                    isActive && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
                  )}
                >
                  <Icon className="size-6" />
                </span>
                <span
                  className={cn(
                    'mt-0.5 text-[10px] font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            >
              <Icon
                className={cn('size-5', isActive && 'fill-primary/20')}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
