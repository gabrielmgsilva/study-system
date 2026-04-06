import { redirect } from 'next/navigation';

import { getCurrentUserServer } from '@/lib/currentUserServer';
import { prisma } from '@/lib/prisma';
import { StudentShell } from '@/components/student/student-shell';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserServer();
  if (!user) redirect('/auth/login');

  const streak = await prisma.userStreak.findUnique({
    where: { userId: user.id },
    select: { currentStreak: true },
  });

  return (
    <StudentShell
      userName={user.name}
      currentStreak={streak?.currentStreak ?? 0}
    >
      {children}
    </StudentShell>
  );
}
