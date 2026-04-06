import 'server-only';

import { prisma } from '@/lib/prisma';

// ── Overview ────────────────────────────────────────────────────────

export interface StatsOverview {
  modulesStarted: number;
  totalModules: number;
  weeklyStudyMs: number;
  avgTestScore: number | null;
  currentStreak: number;
  totalXp: number;
  totalSessions: number;
  /** Last 12 sessions scores for line chart */
  scoreHistory: { date: string; score: number }[];
  /** Weekly study time last 7 weeks */
  weeklyStudyTime: { week: string; ms: number }[];
  /** Difficulty level per module */
  moduleDifficulty: { moduleKey: string; difficulty: number }[];
}

export async function getStatsOverview(
  userId: number,
): Promise<StatsOverview> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    streak,
    studyProgressRows,
    recentSessions,
    allModules,
    studyEngines,
    totalSessionCount,
  ] = await Promise.all([
    prisma.userStreak.findUnique({
      where: { userId },
      select: { currentStreak: true, totalXp: true },
    }),
    prisma.studyProgress.findMany({
      where: { userId, deletedAt: null },
      select: { moduleKey: true, questionsTotal: true, totalTimeSpentMs: true },
    }),
    prisma.studySession.findMany({
      where: { userId, deletedAt: null, score: { not: null } },
      orderBy: { startedAt: 'desc' },
      take: 30,
      select: {
        startedAt: true,
        score: true,
        timeSpentMs: true,
        moduleKey: true,
      },
    }),
    prisma.module.findMany({
      where: { isActive: true, deletedAt: null },
      select: { moduleKey: true },
    }),
    prisma.studyEngine.findMany({
      where: { userId },
      select: { moduleKey: true, currentDifficulty: true },
    }),
    prisma.studySession.count({
      where: { userId, deletedAt: null },
    }),
  ]);

  // Unique modules the user studied
  const uniqueModules = new Set(studyProgressRows.map((r) => r.moduleKey));

  // Weekly study time (this week)
  const weeklyMs = recentSessions
    .filter((s) => s.startedAt >= sevenDaysAgo)
    .reduce((sum, s) => sum + (s.timeSpentMs ?? 0), 0);

  // Average test scores
  const scored = recentSessions.filter((s) => s.score !== null);
  const avgTestScore =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length
      : null;

  // Score history (last 12 with score)
  const scoreHistory = recentSessions
    .filter((s) => s.score !== null)
    .slice(0, 12)
    .reverse()
    .map((s) => ({
      date: s.startedAt.toISOString().slice(0, 10),
      score: Math.round(s.score ?? 0),
    }));

  // Weekly study time (last 7 weeks)
  const weeklyStudyTime: { week: string; ms: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const ms = recentSessions
      .filter((s) => s.startedAt >= weekStart && s.startedAt < weekEnd)
      .reduce((sum, s) => sum + (s.timeSpentMs ?? 0), 0);
    weeklyStudyTime.push({
      week: weekStart.toISOString().slice(0, 10),
      ms,
    });
  }

  return {
    modulesStarted: uniqueModules.size,
    totalModules: allModules.length,
    weeklyStudyMs: weeklyMs,
    avgTestScore,
    currentStreak: streak?.currentStreak ?? 0,
    totalXp: streak?.totalXp ?? 0,
    totalSessions: totalSessionCount,
    scoreHistory,
    weeklyStudyTime,
    moduleDifficulty: studyEngines.map((e) => ({
      moduleKey: e.moduleKey,
      difficulty: e.currentDifficulty,
    })),
  };
}

// ── Session History ─────────────────────────────────────────────────

export interface SessionHistoryItem {
  id: number;
  moduleKey: string;
  mode: string;
  score: number | null;
  questionsAnswered: number;
  questionsCorrect: number;
  timeSpentMs: number;
  startedAt: string; // ISO
  isQuickReview: boolean;
}

export async function getSessionHistory(
  userId: number,
  cursor?: number,
  limit = 20,
): Promise<{ sessions: SessionHistoryItem[]; nextCursor: number | null }> {
  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { startedAt: 'desc' },
    take: limit + 1,
    select: {
      id: true,
      moduleKey: true,
      mode: true,
      score: true,
      questionsAnswered: true,
      questionsCorrect: true,
      timeSpentMs: true,
      startedAt: true,
      isQuickReview: true,
    },
  });

  const hasMore = sessions.length > limit;
  const items = hasMore ? sessions.slice(0, limit) : sessions;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    sessions: items.map((s) => ({
      ...s,
      mode: s.mode as string,
      startedAt: s.startedAt.toISOString(),
    })),
    nextCursor,
  };
}

// ── Topic Performance ───────────────────────────────────────────────

export interface TopicStat {
  id: number;
  moduleKey: string;
  topicCode: string;
  errorRate: number;
  totalAttempts: number;
  priority: number;
  consecutiveCorrect: number;
}

export async function getTopicStats(userId: number): Promise<TopicStat[]> {
  const topics = await prisma.weakTopicTracker.findMany({
    where: { userId },
    orderBy: { priority: 'desc' },
    select: {
      id: true,
      moduleKey: true,
      topicCode: true,
      errorRate: true,
      totalAttempts: true,
      priority: true,
      consecutiveCorrect: true,
    },
  });

  return topics;
}
