import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

export async function GET() {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    activeUsers7d,
    activeUsers30d,
    subscriptionCounts,
    usersPerPlan,
    totalSessions30d,
    sessionsByMode,
    questionsAnswered30d,
    avgScore30d,
    dailySessions,
    questionsByStatus,
    recentUsers,
    recentEvents,
  ] = await Promise.all([
    // Total users
    prisma.user.count({ where: { deletedAt: null } }),

    // New users today
    prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: todayStart } },
    }),

    // New users this week
    prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: weekAgo } },
    }),

    // New users this month (30d)
    prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: monthAgo } },
    }),

    // Active users (had study session in last 7d)
    prisma.user.count({
      where: {
        deletedAt: null,
        studySessions: { some: { createdAt: { gte: weekAgo } } },
      },
    }),

    // Active users (had study session in last 30d)
    prisma.user.count({
      where: {
        deletedAt: null,
        studySessions: { some: { createdAt: { gte: monthAgo } } },
      },
    }),

    // Subscription status breakdown
    prisma.user.groupBy({
      by: ['subscriptionStatus'],
      where: { deletedAt: null },
      _count: { id: true },
    }),

    // Users per plan (with plan name)
    prisma.plan.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stripePriceMonthly: true,
        stripePriceAnnual: true,
        _count: { select: { users: { where: { deletedAt: null } } } },
      },
      orderBy: { displayOrder: 'asc' },
    }),

    // Total study sessions (30d)
    prisma.studySession.count({
      where: { createdAt: { gte: monthAgo }, deletedAt: null },
    }),

    // Sessions by mode (30d)
    prisma.studySession.groupBy({
      by: ['mode'],
      where: { createdAt: { gte: monthAgo }, deletedAt: null },
      _count: { id: true },
    }),

    // Total questions answered (30d)
    prisma.studySession.aggregate({
      where: { createdAt: { gte: monthAgo }, deletedAt: null },
      _sum: { questionsAnswered: true },
    }),

    // Average score (30d, only finished sessions)
    prisma.studySession.aggregate({
      where: {
        createdAt: { gte: monthAgo },
        deletedAt: null,
        finishedAt: { not: null },
        score: { not: null },
      },
      _avg: { score: true },
    }),

    // Daily session counts (last 30 days)
    prisma.$queryRawUnsafe<{ date: string; flashcard: number; practice: number; test: number }[]>(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (WHERE mode = 'flashcard') AS flashcard,
        COUNT(*) FILTER (WHERE mode = 'practice') AS practice,
        COUNT(*) FILTER (WHERE mode = 'test') AS test
      FROM study_sessions
      WHERE created_at >= $1
        AND deleted_at IS NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date
    `, monthAgo),

    // Questions by status
    prisma.question.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    }),

    // Recent registrations (last 10)
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        subscriptionStatus: true,
        plan: { select: { name: true } },
      },
    }),

    // Recent subscription events (last 10)
    prisma.subscriptionEvent.findMany({
      orderBy: { processedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        eventType: true,
        processedAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  // Build subscription status map
  const statusMap: Record<string, number> = { trialing: 0, active: 0, canceled: 0, expired: 0, free: 0 };
  for (const row of subscriptionCounts) {
    const key = row.subscriptionStatus ?? 'free';
    statusMap[key] = (statusMap[key] ?? 0) + row._count.id;
  }

  // MRR estimate: count active users per plan × plan monthly price
  // For annual users, we'd need Stripe data, so estimate all as monthly for now
  let mrrEstimate = 0;
  for (const plan of usersPerPlan) {
    if (plan.price && plan._count.users > 0) {
      mrrEstimate += Number(plan.price) * plan._count.users;
    }
  }

  // Build sessions by mode map
  const modeMap: Record<string, number> = { flashcard: 0, practice: 0, test: 0 };
  for (const row of sessionsByMode) {
    modeMap[row.mode] = row._count.id;
  }

  // Build questions status map
  const questionStatusMap: Record<string, number> = { draft: 0, review: 0, published: 0, archived: 0 };
  for (const row of questionsByStatus) {
    questionStatusMap[row.status] = row._count.id;
  }

  // Build daily sessions array (fill gaps with zeros for the 30-day range)
  const dailyMap = new Map<string, { flashcard: number; practice: number; test: number }>();
  for (const row of dailySessions) {
    dailyMap.set(row.date, {
      flashcard: Number(row.flashcard),
      practice: Number(row.practice),
      test: Number(row.test),
    });
  }

  const dailyChart: { date: string; flashcard: number; practice: number; test: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    dailyChart.push({
      date: key,
      flashcard: entry?.flashcard ?? 0,
      practice: entry?.practice ?? 0,
      test: entry?.test ?? 0,
    });
  }

  return NextResponse.json({
    users: {
      total: totalUsers,
      newToday: newUsersToday,
      newWeek: newUsersWeek,
      newMonth: newUsersMonth,
      active7d: activeUsers7d,
      active30d: activeUsers30d,
    },
    subscriptions: {
      byStatus: statusMap,
      activeTotal: (statusMap.active ?? 0) + (statusMap.trialing ?? 0),
    },
    revenue: {
      mrr: Math.round(mrrEstimate * 100) / 100,
    },
    plans: usersPerPlan.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      userCount: p._count.users,
    })),
    study: {
      sessions30d: totalSessions30d,
      byMode: modeMap,
      questionsAnswered: questionsAnswered30d._sum.questionsAnswered ?? 0,
      avgScore: avgScore30d._avg.score != null ? Math.round(avgScore30d._avg.score * 100) / 100 : null,
      dailyChart,
    },
    content: {
      questionsByStatus: questionStatusMap,
    },
    recent: {
      users: recentUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan?.name ?? null,
        subscriptionStatus: u.subscriptionStatus,
        createdAt: u.createdAt,
      })),
      events: recentEvents.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        processedAt: e.processedAt,
        user: { id: e.user.id, email: e.user.email, name: e.user.name },
      })),
    },
  });
}
