import 'server-only';

import { prisma } from '@/lib/prisma';

export interface DashboardData {
  user: {
    id: number;
    name: string | null;
    email: string;
    planId: number | null;
    subscriptionStatus: string | null;
    subscriptionExpiresAt: Date | null;
    plan: {
      id: number;
      slug: string;
      name: string;
    } | null;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalXp: number;
    lastActiveDate: string;
  } | null;
  studyProgress: {
    moduleKey: string;
    questionsTotal: number;
    questionsCorrect: number;
    totalTimeSpentMs: number;
    lastStudiedAt: Date | null;
  }[];
  lastSession: {
    moduleKey: string;
    mode: string;
    startedAt: Date;
    questionsAnswered: number;
    questionsCorrect: number;
    score: number | null;
  } | null;
  weakTopics: {
    id: number;
    moduleKey: string;
    topicCode: string;
    errorRate: number;
    priority: number;
    nextReviewDate: Date | null;
  }[];
  activeGoals: {
    id: number;
    title: string;
    targetType: string;
    targetValue: number;
    currentValue: number;
    isCompleted: boolean;
    targetDate: Date | null;
  }[];
  licenses: {
    licenseId: string;
    moduleCount: number;
  }[];
  modules: {
    moduleKey: string;
    name: string;
    licenseId: string;
    displayOrder: number;
  }[];
}

export async function getDashboardData(
  userId: number,
): Promise<DashboardData> {
  const [
    user,
    streak,
    studyProgressRaw,
    lastSession,
    weakTopics,
    activeGoals,
    entitlements,
    modules,
  ] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        planId: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        plan: { select: { id: true, slug: true, name: true } },
      },
    }),

    prisma.userStreak.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        totalXp: true,
        lastActiveDate: true,
      },
    }),

    prisma.studyProgress.findMany({
      where: { userId, deletedAt: null },
      select: {
        moduleKey: true,
        questionsTotal: true,
        questionsCorrect: true,
        totalTimeSpentMs: true,
        lastStudiedAt: true,
      },
    }),

    prisma.studySession.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { startedAt: 'desc' },
      select: {
        moduleKey: true,
        mode: true,
        startedAt: true,
        questionsAnswered: true,
        questionsCorrect: true,
        score: true,
      },
    }),

    prisma.weakTopicTracker.findMany({
      where: { userId },
      orderBy: { priority: 'desc' },
      take: 3,
      select: {
        id: true,
        moduleKey: true,
        topicCode: true,
        errorRate: true,
        priority: true,
        nextReviewDate: true,
      },
    }),

    prisma.studyGoal.findMany({
      where: { userId, isCompleted: false, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        targetType: true,
        targetValue: true,
        currentValue: true,
        isCompleted: true,
        targetDate: true,
      },
    }),

    prisma.licenseEntitlement.findMany({
      where: { userId, isActive: true, deletedAt: null },
      select: { licenseId: true },
    }),

    prisma.module.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        moduleKey: true,
        name: true,
        licenseId: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' },
    }),
  ]);

  // Aggregate study progress per module (across modes)
  const moduleMap = new Map<
    string,
    {
      moduleKey: string;
      questionsTotal: number;
      questionsCorrect: number;
      totalTimeSpentMs: number;
      lastStudiedAt: Date | null;
    }
  >();

  for (const sp of studyProgressRaw) {
    const existing = moduleMap.get(sp.moduleKey);
    if (existing) {
      existing.questionsTotal += sp.questionsTotal;
      existing.questionsCorrect += sp.questionsCorrect;
      existing.totalTimeSpentMs += sp.totalTimeSpentMs;
      if (
        sp.lastStudiedAt &&
        (!existing.lastStudiedAt || sp.lastStudiedAt > existing.lastStudiedAt)
      ) {
        existing.lastStudiedAt = sp.lastStudiedAt;
      }
    } else {
      moduleMap.set(sp.moduleKey, { ...sp });
    }
  }

  // Build license→moduleCount from entitlements
  const licenseIds = entitlements.map((e) => e.licenseId);
  const licenseCounts = licenseIds.map((lid) => ({
    licenseId: lid,
    moduleCount: modules.filter((m) => m.licenseId === lid).length,
  }));

  return {
    user,
    streak,
    studyProgress: Array.from(moduleMap.values()),
    lastSession,
    weakTopics,
    activeGoals,
    licenses: licenseCounts,
    modules: modules.filter((m) => licenseIds.includes(m.licenseId)),
  };
}
