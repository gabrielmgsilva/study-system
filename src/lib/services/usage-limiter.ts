import 'server-only';

import { prisma } from '@/lib/prisma';

// ── Types ───────────────────────────────────────────────────────────────────

export interface UsageResult {
  allowed: boolean;
  remaining: number;
  resetsAt?: Date;
  limit: number;
}

type LimitUnitValue = 'day' | 'week' | 'month';

const DEFAULT_LIMITS: Record<
  string,
  { limit: number; unit: LimitUnitValue }
> = {
  flashcard: { limit: 5, unit: 'day' },
  practice: { limit: 3, unit: 'day' },
  test: { limit: 1, unit: 'week' },
};

// ── Period-key helpers ──────────────────────────────────────────────────────

function getPeriodKey(unit: LimitUnitValue, now: Date): string {
  if (unit === 'day') {
    return now.toISOString().slice(0, 10); // "2026-04-06"
  }
  if (unit === 'week') {
    return getISOWeekKey(now); // "2026-W14"
  }
  return now.toISOString().slice(0, 7); // "2026-04"
}

function getISOWeekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getResetsAt(unit: LimitUnitValue, now: Date): Date {
  if (unit === 'day') {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  if (unit === 'week') {
    const d = new Date(now);
    const dayOfWeek = d.getUTCDay() || 7; // Monday = 1, Sunday = 7
    d.setUTCDate(d.getUTCDate() + (8 - dayOfWeek)); // Next Monday
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  // month
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
}

// ── checkAndIncrementUsage ──────────────────────────────────────────────────

export async function checkAndIncrementUsage(
  userId: number,
  mode: 'flashcard' | 'practice' | 'test',
): Promise<UsageResult> {
  const now = new Date();

  // 1. Get user plan
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      plan: {
        select: {
          flashcardsLimit: true,
          flashcardsUnit: true,
          practiceLimit: true,
          practiceUnit: true,
          testsLimit: true,
          testsUnit: true,
        },
      },
    },
  });

  // 2. Resolve limit and unit (defaults if no plan)
  let limit: number;
  let unit: LimitUnitValue;

  if (user.plan) {
    if (mode === 'flashcard') {
      limit = user.plan.flashcardsLimit;
      unit = user.plan.flashcardsUnit;
    } else if (mode === 'practice') {
      limit = user.plan.practiceLimit;
      unit = user.plan.practiceUnit;
    } else {
      limit = user.plan.testsLimit;
      unit = user.plan.testsUnit;
    }
  } else {
    const defaults = DEFAULT_LIMITS[mode];
    limit = defaults.limit;
    unit = defaults.unit;
  }

  // 3. Unlimited access: limit === -1
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  // 4. Period key and reset time
  const periodKey = getPeriodKey(unit, now);
  const resetsAt = getResetsAt(unit, now);

  // 5. Upsert counter and check
  const counter = await prisma.usageCounter.upsert({
    where: {
      userId_mode_periodKey: { userId, mode, periodKey },
    },
    create: { userId, mode, periodKey, count: 0 },
    update: {},
    select: { id: true, count: true },
  });

  // 6. Already at limit
  if (counter.count >= limit) {
    return { allowed: false, remaining: 0, resetsAt, limit };
  }

  // 7. Increment and return
  const updated = await prisma.usageCounter.update({
    where: { id: counter.id },
    data: { count: { increment: 1 } },
    select: { count: true },
  });

  return {
    allowed: true,
    remaining: limit - updated.count,
    resetsAt,
    limit,
  };
}

// ── checkQuickReviewAccess ──────────────────────────────────────────────────

/**
 * Quick review does NOT consume regular usage counters.
 * Active users have unlimited access; expired users are limited to 1/day.
 */
export async function checkQuickReviewAccess(
  userId: number,
): Promise<UsageResult> {
  // Check for any active license entitlement → unlimited
  const activeEntitlement = await prisma.licenseEntitlement.findFirst({
    where: { userId, isActive: true, deletedAt: null },
    select: { id: true },
  });

  if (activeEntitlement) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  // Expired user: max 1 quick-review session per day
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const tomorrow = new Date(todayStart);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const todayCount = await prisma.studySession.count({
    where: {
      userId,
      isQuickReview: true,
      deletedAt: null,
      createdAt: { gte: todayStart, lt: tomorrow },
    },
  });

  if (todayCount >= 1) {
    return { allowed: false, remaining: 0, resetsAt: tomorrow, limit: 1 };
  }

  return {
    allowed: true,
    remaining: 1 - todayCount,
    resetsAt: tomorrow,
    limit: 1,
  };
}
