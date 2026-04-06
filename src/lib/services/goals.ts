import 'server-only';

import { prisma } from '@/lib/prisma';

// ── Types ───────────────────────────────────────────────────────────

export interface GoalData {
  id: number;
  title: string;
  description: string | null;
  targetType: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  completedAt: Date | null;
  targetDate: Date | null;
  createdAt: Date;
}

// ── Read ────────────────────────────────────────────────────────────

export async function getUserGoals(userId: number): Promise<GoalData[]> {
  return prisma.studyGoal.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      description: true,
      targetType: true,
      targetValue: true,
      currentValue: true,
      isCompleted: true,
      completedAt: true,
      targetDate: true,
      createdAt: true,
    },
  });
}

// ── Create ──────────────────────────────────────────────────────────

export async function createGoal(
  userId: number,
  data: {
    title: string;
    description?: string;
    targetType: string;
    targetValue: number;
    targetDate?: Date;
  },
): Promise<GoalData> {
  return prisma.studyGoal.create({
    data: {
      userId,
      title: data.title,
      description: data.description ?? null,
      targetType: data.targetType,
      targetValue: data.targetValue,
      targetDate: data.targetDate ?? null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      targetType: true,
      targetValue: true,
      currentValue: true,
      isCompleted: true,
      completedAt: true,
      targetDate: true,
      createdAt: true,
    },
  });
}

// ── Update ──────────────────────────────────────────────────────────

export async function updateGoalProgress(
  goalId: number,
  userId: number,
  currentValue: number,
): Promise<GoalData> {
  const goal = await prisma.studyGoal.findFirst({
    where: { id: goalId, userId, deletedAt: null },
  });

  if (!goal) throw new Error('Goal not found.');

  const isCompleted = currentValue >= goal.targetValue;

  return prisma.studyGoal.update({
    where: { id: goalId },
    data: {
      currentValue,
      isCompleted,
      completedAt: isCompleted && !goal.completedAt ? new Date() : goal.completedAt,
    },
    select: {
      id: true,
      title: true,
      description: true,
      targetType: true,
      targetValue: true,
      currentValue: true,
      isCompleted: true,
      completedAt: true,
      targetDate: true,
      createdAt: true,
    },
  });
}

// ── Delete (soft) ───────────────────────────────────────────────────

export async function deleteGoal(
  goalId: number,
  userId: number,
): Promise<void> {
  await prisma.studyGoal.updateMany({
    where: { id: goalId, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

// ── Auto-generate goals ─────────────────────────────────────────────

export async function generateAutoGoals(userId: number): Promise<void> {
  const [existingGoals, entitlements, streak] = await Promise.all([
    prisma.studyGoal.findMany({
      where: { userId, deletedAt: null },
      select: { targetType: true, title: true },
    }),
    prisma.licenseEntitlement.findMany({
      where: { userId, isActive: true, deletedAt: null },
      select: { licenseId: true },
    }),
    prisma.userStreak.findUnique({
      where: { userId },
      select: { currentStreak: true },
    }),
  ]);

  const existingTitles = new Set(existingGoals.map((g) => g.title));
  const goalsToCreate: {
    userId: number;
    title: string;
    targetType: string;
    targetValue: number;
  }[] = [];

  // Goal: "Complete all modules of {license}" for each enrolled license
  for (const e of entitlements) {
    const title = `Complete all modules of ${e.licenseId.toUpperCase()}`;
    if (!existingTitles.has(title)) {
      goalsToCreate.push({
        userId,
        title,
        targetType: 'module_completion',
        targetValue: 100,
      });
    }
  }

  // Goal: "Maintain 7-day streak" if user has studied at least once
  if (streak && streak.currentStreak > 0) {
    const streakTitle = 'Maintain 7-day streak';
    if (!existingTitles.has(streakTitle)) {
      goalsToCreate.push({
        userId,
        title: streakTitle,
        targetType: 'streak',
        targetValue: 7,
      });
    }
  }

  if (goalsToCreate.length > 0) {
    await prisma.studyGoal.createMany({ data: goalsToCreate });
  }
}
