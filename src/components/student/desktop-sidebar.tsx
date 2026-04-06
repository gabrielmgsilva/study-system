'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Target,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/study', label: 'Study', icon: BookOpen },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden lg:flex',
        'fixed inset-y-0 left-0 z-30 w-[260px] flex-col border-r bg-background',
      )}
    >
      <div className="flex h-14 items-center px-6">
        <span className="text-xl font-bold text-primary">AME ONE</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className={cn('size-5', isActive && 'fill-primary/20')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
