'use client';

import { MobileHeader } from '@/components/student/mobile-header';
import { DesktopSidebar } from '@/components/student/desktop-sidebar';
import { BottomTabs } from '@/components/student/bottom-tabs';

interface StudentShellProps {
  children: React.ReactNode;
  userName: string | null;
  currentStreak: number;
}

export function StudentShell({
  children,
  userName,
  currentStreak,
}: StudentShellProps) {
  return (
    <div className="flex min-h-dvh">
      <DesktopSidebar />

      <div className="flex flex-1 flex-col lg:pl-[260px]">
        <MobileHeader userName={userName} currentStreak={currentStreak} />

        <main className="flex-1 pb-20 lg:pb-0">{children}</main>

        <BottomTabs />
      </div>
    </div>
  );
}
