import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  CreditCard,
  BookOpen,
  Target,
  Settings,
  HelpCircle,
  LogOut,
  Zap,
  Flame,
} from 'lucide-react';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { checkStudentAccess } from '@/lib/services/subscription-guard';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';

export default async function ProfilePage() {
  const session = await getCurrentSessionServer();
  if (!session) redirect('/auth/login');

  const access = await checkStudentAccess(session.userId);
  if (!access.allowed) redirect(access.redirect);

  const [user, streak] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { id: session.userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionStatus: true,
        plan: { select: { name: true, slug: true } },
      },
    }),
    prisma.userStreak.findUnique({
      where: { userId: session.userId },
      select: { currentStreak: true, totalXp: true },
    }),
  ]);

  const totalSessions = await prisma.studySession.count({
    where: { userId: session.userId, deletedAt: null },
  });

  const initials = (user.name ?? user.email)
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const menuItems = [
    {
      href: '/profile/plan',
      icon: CreditCard,
      label: 'My Plan',
      badge: user.plan?.name ?? null,
    },
    {
      href: '/profile/licenses',
      icon: BookOpen,
      label: 'Certifications',
    },
    { href: '/goals', icon: Target, label: 'Study Goals' },
    { href: '/profile/settings', icon: Settings, label: 'Settings' },
    { href: '/help', icon: HelpCircle, label: 'Help & Support' },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mb-3">
          {initials}
        </div>
        <h1 className="text-lg font-bold">{user.name ?? user.email}</h1>
        {user.plan && (
          <Badge variant="secondary" className="mt-1">
            {user.plan.name}
          </Badge>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-6">
        <div className="flex flex-col items-center p-3 rounded-xl bg-muted">
          <Zap className="size-5 text-amber-500 mb-1" />
          <span className="font-bold text-sm">
            {streak?.totalXp ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground">XP</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-muted">
          <Flame className="size-5 text-orange-500 mb-1" />
          <span className="font-bold text-sm">
            {streak?.currentStreak ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground">Streak</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-muted">
          <BookOpen className="size-5 text-blue-500 mb-1" />
          <span className="font-bold text-sm">{totalSessions}</span>
          <span className="text-[10px] text-muted-foreground">Sessions</span>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 min-h-[52px] px-3 rounded-xl hover:bg-muted transition-colors"
          >
            <item.icon className="size-5 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            {item.badge && (
              <Badge variant="outline" className="text-xs mr-1">
                {item.badge}
              </Badge>
            )}
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}

        {/* Sign Out */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-3 min-h-[52px] px-3 rounded-xl hover:bg-muted transition-colors w-full text-left"
          >
            <LogOut className="size-5 text-red-500 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-red-500">
              Sign Out
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
