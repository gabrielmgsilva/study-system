import type { LimitUnit, Prisma } from '@prisma/client';

import { experienceForPlan, planCaps, type AccessStatus, type LicensePlanCaps, type PlanRecord } from '@/lib/planEntitlements';

// ─── Free tier defaults ───
// Users without a plan (planId = null) get these synthetic limits.
const FREE_TIER_PLAN: PlanRecord = {
  id: 0,
  slug: 'free',
  name: 'Free',
  description: 'Free tier with limited study access.',
  maxLicenses: 1,
  flashcardsLimit: 3,    // 3 sessions/day
  flashcardsUnit: 'day' as LimitUnit,
  practiceLimit: 0,      // blocked
  practiceUnit: 'day' as LimitUnit,
  testsLimit: 0,         // blocked
  testsUnit: 'week' as LimitUnit,
  maxQuestionsPerSession: null,
  logbookAccess: false,
  isActive: true,
};

// Regs license is always free with unlimited access
const FREE_TIER_REGS_PLAN: PlanRecord = {
  ...FREE_TIER_PLAN,
  flashcardsLimit: -1,   // unlimited
  practiceLimit: -1,     // unlimited
  testsLimit: -1,        // unlimited
};

const REGS_LICENSE_ID = 'regs';

export type StudyStartMode = 'flashcard' | 'practice' | 'test';

export type SerializablePlanCaps = {
  flashcards: { limit: number | null; unit: LimitUnit };
  practice: { limit: number | null; unit: LimitUnit };
  test: { limit: number | null; unit: LimitUnit };
  maxQuestionsPerSession: number | null;
};

export type LicenseUsageSummary = {
  flashcardsUsed: number;
  flashcardsRemaining: number | null;
  practiceUsed: number;
  practiceRemaining: number | null;
  testsUsed: number;
  testsRemaining: number | null;
};

export type LicenseEntitlementSnapshot = {
  plan: {
    id: number;
    slug: string;
    name: string;
    maxLicenses: number;
    isActive: boolean;
  };
  flashcards: AccessStatus;
  practice: AccessStatus;
  test: AccessStatus;
  logbook: boolean;
  caps: SerializablePlanCaps;
  usage: LicenseUsageSummary;
  enrollment: {
    licenseId: string;
    enrolledAt: string;
    isActive: boolean;
  };
};

type DbClient = Prisma.TransactionClient;

type LicenseEntitlementRow = {
  licenseId: string;
  enrolledAt: Date;
  isActive: boolean;
};

type UserPlanRow = PlanRecord;

function norm(s: string) {
  return String(s ?? '').trim().toLowerCase().replace(/_/g, '-');
}

export function normalizeLicenseId(licenseId: string) {
  return norm(licenseId);
}

export function normalizeStudyModuleKey(moduleKey: string, fallbackLicenseId?: string) {
  const raw = norm(moduleKey);
  if (!raw) return null;
  if (raw.includes('.')) return raw;
  if (!fallbackLicenseId) return null;
  return `${normalizeLicenseId(fallbackLicenseId)}.${raw}`;
}

function startOfDay(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfWeek(now: Date) {
  const date = startOfDay(now);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function startOfMonth(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function rangeStart(unit: LimitUnit, now: Date) {
  if (unit === 'month') return startOfMonth(now);
  if (unit === 'week') return startOfWeek(now);
  return startOfDay(now);
}

function remainingLimit(limit: number | null, used: number) {
  if (limit === null) return null;
  return Math.max(limit - used, 0);
}

function buildSnapshot(
  row: LicenseEntitlementRow,
  plan: UserPlanRow,
  usage: { flashcardsUsed: number; practiceUsed: number; testsUsed: number },
): LicenseEntitlementSnapshot {
  const caps = planCaps(plan);
  const experience = experienceForPlan(plan);

  return {
    plan: experience.plan,
    flashcards: experience.flashcards,
    practice: experience.practice,
    test: experience.test,
    logbook: experience.logbook,
    caps: {
      flashcards: caps.flashcards,
      practice: caps.practice,
      test: caps.test,
      maxQuestionsPerSession: caps.maxQuestionsPerSession,
    },
    usage: {
      flashcardsUsed: usage.flashcardsUsed,
      flashcardsRemaining: remainingLimit(caps.flashcards.limit, usage.flashcardsUsed),
      practiceUsed: usage.practiceUsed,
      practiceRemaining: remainingLimit(caps.practice.limit, usage.practiceUsed),
      testsUsed: usage.testsUsed,
      testsRemaining: remainingLimit(caps.test.limit, usage.testsUsed),
    },
    enrollment: {
      licenseId: row.licenseId,
      enrolledAt: row.enrolledAt.toISOString(),
      isActive: row.isActive,
    },
  };
}

function usageCountMap(rows: Array<{ licenseId: string; _count: { _all: number } }>) {
  const out: Record<string, number> = {};
  for (const row of rows) {
    out[normalizeLicenseId(row.licenseId)] = Number(row._count._all ?? 0);
  }
  return out;
}

export async function getLicenseEntitlementSnapshots(db: DbClient, userId: number, now = new Date()) {
  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      plan: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          maxLicenses: true,
          flashcardsLimit: true,
          flashcardsUnit: true,
          practiceLimit: true,
          practiceUnit: true,
          testsLimit: true,
          testsUnit: true,
          maxQuestionsPerSession: true,
          logbookAccess: true,
          isActive: true,
        },
      },
    },
  });

  const isFreeTier = !user?.plan;
  const effectivePlan = (licenseId: string): PlanRecord =>
    isFreeTier
      ? (normalizeLicenseId(licenseId) === REGS_LICENSE_ID ? FREE_TIER_REGS_PLAN : FREE_TIER_PLAN)
      : user!.plan!;

  // For free tier, use fixed units; for paid plans, use plan config
  const basePlan = isFreeTier ? FREE_TIER_PLAN : user!.plan!;
  const flashcardsStart = rangeStart(basePlan.flashcardsUnit, now);
  const practiceStart = rangeStart(basePlan.practiceUnit, now);
  const testsStart = rangeStart(basePlan.testsUnit, now);

  const [entitlements, flashcardsRows, practiceRows, testRows] = await Promise.all([
    db.licenseEntitlement.findMany({
      where: { userId, deletedAt: null, isActive: true },
      select: {
        licenseId: true,
        enrolledAt: true,
        isActive: true,
      },
    }),
    db.studySession.groupBy({
      by: ['licenseId'],
      where: {
        userId,
        deletedAt: null,
        mode: 'flashcard',
        startedAt: { gte: flashcardsStart },
      },
      _count: { _all: true },
    }),
    db.studySession.groupBy({
      by: ['licenseId'],
      where: {
        userId,
        deletedAt: null,
        mode: 'practice',
        startedAt: { gte: practiceStart },
      },
      _count: { _all: true },
    }),
    db.studySession.groupBy({
      by: ['licenseId'],
      where: {
        userId,
        deletedAt: null,
        mode: 'test',
        startedAt: { gte: testsStart },
      },
      _count: { _all: true },
    }),
  ]);

  const flashcardsMap = usageCountMap(flashcardsRows);
  const practiceMap = usageCountMap(practiceRows);
  const testMap = usageCountMap(testRows);

  const snapshots: Record<string, LicenseEntitlementSnapshot> = {};

  for (const row of entitlements) {
    const licenseId = normalizeLicenseId(row.licenseId);
    snapshots[licenseId] = buildSnapshot(row, effectivePlan(licenseId), {
      flashcardsUsed: flashcardsMap[licenseId] ?? 0,
      practiceUsed: practiceMap[licenseId] ?? 0,
      testsUsed: testMap[licenseId] ?? 0,
    });
  }

  return snapshots;
}

export async function getSingleLicenseEntitlementSnapshot(
  db: DbClient,
  userId: number,
  licenseId: string,
  now = new Date(),
) {
  const normalizedLicenseId = normalizeLicenseId(licenseId);
  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      plan: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          maxLicenses: true,
          flashcardsLimit: true,
          flashcardsUnit: true,
          practiceLimit: true,
          practiceUnit: true,
          testsLimit: true,
          testsUnit: true,
          maxQuestionsPerSession: true,
          logbookAccess: true,
          isActive: true,
        },
      },
    },
  });

  const isFreeTier = !user?.plan;
  const plan: PlanRecord = isFreeTier
    ? (normalizedLicenseId === REGS_LICENSE_ID ? FREE_TIER_REGS_PLAN : FREE_TIER_PLAN)
    : user!.plan!;

  const entitlement = await db.licenseEntitlement.findFirst({
    where: { userId, licenseId: normalizedLicenseId, deletedAt: null, isActive: true },
    select: {
      licenseId: true,
      enrolledAt: true,
      isActive: true,
    },
  });

  if (!entitlement) {
    return null;
  }

  const flashcardsStart = rangeStart(plan.flashcardsUnit, now);
  const practiceStart = rangeStart(plan.practiceUnit, now);
  const testsStart = rangeStart(plan.testsUnit, now);

  const [flashcardsCount, practiceCount, testCount] = await Promise.all([
    db.studySession.count({
      where: {
        userId,
        licenseId: normalizedLicenseId,
        deletedAt: null,
        mode: 'flashcard',
        startedAt: { gte: flashcardsStart },
      },
    }),
    db.studySession.count({
      where: {
        userId,
        licenseId: normalizedLicenseId,
        deletedAt: null,
        mode: 'practice',
        startedAt: { gte: practiceStart },
      },
    }),
    db.studySession.count({
      where: {
        userId,
        licenseId: normalizedLicenseId,
        deletedAt: null,
        mode: 'test',
        startedAt: { gte: testsStart },
      },
    }),
  ]);

  return buildSnapshot(entitlement, plan, {
    flashcardsUsed: flashcardsCount,
    practiceUsed: practiceCount,
    testsUsed: testCount,
  });
}