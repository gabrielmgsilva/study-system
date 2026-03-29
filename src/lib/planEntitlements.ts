import type { LimitUnit } from '@prisma/client';

export type LicenseId = 'm' | 'e' | 's' | 'balloons' | 'regs';

export type AccessStatus = 'blocked' | 'limited' | 'unlimited';

export type PlanRecord = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  maxLicenses: number;
  flashcardsLimit: number;
  flashcardsUnit: LimitUnit;
  practiceLimit: number;
  practiceUnit: LimitUnit;
  testsLimit: number;
  testsUnit: LimitUnit;
  maxQuestionsPerSession: number | null;
  logbookAccess: boolean;
  isActive: boolean;
};

export type LicenseExperience = {
  plan: Pick<PlanRecord, 'id' | 'slug' | 'name' | 'maxLicenses' | 'isActive'>;
  flashcards: AccessStatus;
  practice: AccessStatus;
  test: AccessStatus;
  logbook: boolean;
};

export type LimitWindow = {
  limit: number | null;
  unit: LimitUnit;
};

export type LicensePlanCaps = {
  flashcards: LimitWindow;
  practice: LimitWindow;
  test: LimitWindow;
  maxQuestionsPerSession: number | null;
};

function normalizeLimit(limit: number | null | undefined) {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return null;
  }

  if (limit < 0) {
    return null;
  }

  return Math.floor(limit);
}

function accessStatus(limit: number | null) {
  if (limit === null) return 'unlimited';
  if (limit <= 0) return 'blocked';
  return 'limited';
}

export function planCaps(plan: PlanRecord): LicensePlanCaps {
  return {
    flashcards: {
      limit: normalizeLimit(plan.flashcardsLimit),
      unit: plan.flashcardsUnit,
    },
    practice: {
      limit: normalizeLimit(plan.practiceLimit),
      unit: plan.practiceUnit,
    },
    test: {
      limit: normalizeLimit(plan.testsLimit),
      unit: plan.testsUnit,
    },
    maxQuestionsPerSession:
      typeof plan.maxQuestionsPerSession === 'number' && Number.isFinite(plan.maxQuestionsPerSession)
        ? Math.max(Math.floor(plan.maxQuestionsPerSession), 1)
        : null,
  };
}

export function experienceForPlan(plan: PlanRecord): LicenseExperience {
  const caps = planCaps(plan);

  return {
    plan: {
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      maxLicenses: plan.maxLicenses,
      isActive: plan.isActive,
    },
    flashcards: accessStatus(caps.flashcards.limit),
    practice: accessStatus(caps.practice.limit),
    test: accessStatus(caps.test.limit),
    logbook: plan.logbookAccess,
  };
}
