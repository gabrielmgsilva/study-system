import type {
  FlashcardsAccess,
  PlanTier,
  PracticeAccess,
  Prisma,
  TestAccess,
} from '@prisma/client';

import { planCaps, type LicensePlanCaps } from '@/lib/planEntitlements';

export type StudyStartMode = 'flashcard' | 'practice' | 'test';

export type SerializablePlanCaps = {
  flashcardsPerDay: number | null;
  practicePerDay: number | null;
  testsPerWeek: number | null;
};

export type LicenseUsageSummary = {
  flashcardsToday: number;
  flashcardsRemaining: number | null;
  practiceToday: number;
  practiceRemaining: number | null;
  testsThisWeek: number;
  testsRemaining: number | null;
};

export type LicenseEntitlementSnapshot = {
  plan: PlanTier;
  flashcards: FlashcardsAccess;
  practice: PracticeAccess;
  test: TestAccess;
  logbook: boolean;
  caps: SerializablePlanCaps;
  usage: LicenseUsageSummary;
  overrides: {
    flashcardsPerDay: number | null;
    practicePerDay: number | null;
    testsPerWeek: number | null;
  };
};

type DbClient = Prisma.TransactionClient;

type LicenseEntitlementRow = {
  licenseId: string;
  plan: PlanTier;
  flashcards: FlashcardsAccess;
  practice: PracticeAccess;
  test: TestAccess;
  logbook: boolean;
  flashcardsPerDayOverride: number | null;
  practicePerDayOverride: number | null;
  testsPerWeekOverride: number | null;
};

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

function serializeLimit(limit: number) {
  return Number.isFinite(limit) ? limit : null;
}

function remainingLimit(limit: number, used: number) {
  if (!Number.isFinite(limit)) return null;
  return Math.max(limit - used, 0);
}

export function resolveEntitlementCaps(row: Pick<LicenseEntitlementRow, 'plan' | 'flashcardsPerDayOverride' | 'practicePerDayOverride' | 'testsPerWeekOverride'>): LicensePlanCaps {
  return planCaps(row.plan, {
    flashcardsPerDay: row.flashcardsPerDayOverride,
    practicePerDay: row.practicePerDayOverride,
    testsPerWeek: row.testsPerWeekOverride,
  });
}

function buildSnapshot(row: LicenseEntitlementRow, usage: { flashcardsToday: number; practiceToday: number; testsThisWeek: number; }): LicenseEntitlementSnapshot {
  const caps = resolveEntitlementCaps(row);

  return {
    plan: row.plan,
    flashcards: row.flashcards,
    practice: row.practice,
    test: row.test,
    logbook: row.logbook,
    caps: {
      flashcardsPerDay: serializeLimit(caps.flashcardsPerDay),
      practicePerDay: serializeLimit(caps.practicePerDay),
      testsPerWeek: serializeLimit(caps.testsPerWeek),
    },
    usage: {
      flashcardsToday: usage.flashcardsToday,
      flashcardsRemaining: remainingLimit(caps.flashcardsPerDay, usage.flashcardsToday),
      practiceToday: usage.practiceToday,
      practiceRemaining: remainingLimit(caps.practicePerDay, usage.practiceToday),
      testsThisWeek: usage.testsThisWeek,
      testsRemaining: remainingLimit(caps.testsPerWeek, usage.testsThisWeek),
    },
    overrides: {
      flashcardsPerDay: row.flashcardsPerDayOverride,
      practicePerDay: row.practicePerDayOverride,
      testsPerWeek: row.testsPerWeekOverride,
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

function usageSumMap(rows: Array<{ licenseId: string; _sum: { questionsTotal: number | null } }>) {
  const out: Record<string, number> = {};
  for (const row of rows) {
    out[normalizeLicenseId(row.licenseId)] = Number(row._sum.questionsTotal ?? 0);
  }
  return out;
}

export async function getLicenseEntitlementSnapshots(db: DbClient, userId: number, now = new Date()) {
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  const [entitlements, flashcardsRows, practiceRows, testRows] = await Promise.all([
    db.licenseEntitlement.findMany({
      where: { userId, deletedAt: null },
      select: {
        licenseId: true,
        plan: true,
        flashcards: true,
        practice: true,
        test: true,
        logbook: true,
        flashcardsPerDayOverride: true,
        practicePerDayOverride: true,
        testsPerWeekOverride: true,
      },
    }),
    db.studySession.groupBy({
      by: ['licenseId'],
      where: {
        userId,
        deletedAt: null,
        mode: 'flashcard',
        startedAt: { gte: dayStart },
      },
      _sum: { questionsTotal: true },
    }),
    db.studySession.groupBy({
      by: ['licenseId'],
      where: {
        userId,
        deletedAt: null,
        mode: 'practice',
        startedAt: { gte: dayStart },
      },
      _count: { _all: true },
    }),
    db.studySession.groupBy({
      by: ['licenseId'],
      where: {
        userId,
        deletedAt: null,
        mode: 'test',
        startedAt: { gte: weekStart },
      },
      _count: { _all: true },
    }),
  ]);

  const flashcardsMap = usageSumMap(flashcardsRows);
  const practiceMap = usageCountMap(practiceRows);
  const testMap = usageCountMap(testRows);

  const snapshots: Record<string, LicenseEntitlementSnapshot> = {};

  for (const row of entitlements) {
    const licenseId = normalizeLicenseId(row.licenseId);
    snapshots[licenseId] = buildSnapshot(row, {
      flashcardsToday: flashcardsMap[licenseId] ?? 0,
      practiceToday: practiceMap[licenseId] ?? 0,
      testsThisWeek: testMap[licenseId] ?? 0,
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
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  const entitlement = await db.licenseEntitlement.findFirst({
    where: { userId, licenseId: normalizedLicenseId, deletedAt: null },
    select: {
      licenseId: true,
      plan: true,
      flashcards: true,
      practice: true,
      test: true,
      logbook: true,
      flashcardsPerDayOverride: true,
      practicePerDayOverride: true,
      testsPerWeekOverride: true,
    },
  });

  if (!entitlement) {
    return null;
  }

  const [flashcardsAgg, practiceCount, testCount] = await Promise.all([
    db.studySession.aggregate({
      where: {
        userId,
        licenseId: normalizedLicenseId,
        deletedAt: null,
        mode: 'flashcard',
        startedAt: { gte: dayStart },
      },
      _sum: { questionsTotal: true },
    }),
    db.studySession.count({
      where: {
        userId,
        licenseId: normalizedLicenseId,
        deletedAt: null,
        mode: 'practice',
        startedAt: { gte: dayStart },
      },
    }),
    db.studySession.count({
      where: {
        userId,
        licenseId: normalizedLicenseId,
        deletedAt: null,
        mode: 'test',
        startedAt: { gte: weekStart },
      },
    }),
  ]);

  return buildSnapshot(entitlement, {
    flashcardsToday: Number(flashcardsAgg._sum.questionsTotal ?? 0),
    practiceToday: practiceCount,
    testsThisWeek: testCount,
  });
}