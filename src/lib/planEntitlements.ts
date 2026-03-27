import type {
  FlashcardsAccess,
  PracticeAccess,
  TestAccess,
  PlanTier,
} from '@prisma/client';

export type LicenseId = 'm' | 'e' | 's' | 'balloons' | 'regs';

export type LicenseExperience = {
  plan: PlanTier;
  flashcards: FlashcardsAccess;
  practice: PracticeAccess;
  test: TestAccess;
  logbook: boolean;
};

export type PlanCapOverrides = {
  flashcardsPerDay?: number | null;
  practicePerDay?: number | null;
  testsPerWeek?: number | null;
};

export type LicensePlanCaps = {
  flashcardsPerDay: number;
  practicePerDay: number;
  testsPerWeek: number;
};

// Central mapping (no complicated counters in DB)
export function experienceForPlan(plan: PlanTier): Omit<LicenseExperience, 'plan'> {
  if (plan === 'premium') {
    return {
      flashcards: 'unlimited',
      practice: 'unlimited',
      test: 'unlimited',
      logbook: true,
    };
  }

  if (plan === 'standard') {
    return {
      flashcards: 'unlimited',
      practice: 'unlimited',
      test: 'weekly_limit',
      logbook: false,
    };
  }

  // basic
  return {
    flashcards: 'daily_limit',
    practice: 'cooldown',
    test: 'weekly_limit',
    logbook: false,
  };
}

export function defaultLicenseExperience(plan: PlanTier = 'basic'): LicenseExperience {
  return { plan, ...experienceForPlan(plan) };
}

function resolveOverride(base: number, override?: number | null) {
  if (typeof override !== 'number' || !Number.isFinite(override) || override < 0) {
    return base;
  }

  return override;
}

export function planCaps(plan: PlanTier, overrides?: PlanCapOverrides): LicensePlanCaps {
  // Client uses this for perceived limits (MVP). Backend keeps only plan + access types.
  const base: LicensePlanCaps =
    plan === 'premium'
      ? { flashcardsPerDay: Infinity, practicePerDay: Infinity, testsPerWeek: Infinity }
      : plan === 'standard'
        ? { flashcardsPerDay: Infinity, practicePerDay: Infinity, testsPerWeek: 3 }
        : { flashcardsPerDay: 20, practicePerDay: 2, testsPerWeek: 1 };

  return {
    flashcardsPerDay: resolveOverride(base.flashcardsPerDay, overrides?.flashcardsPerDay),
    practicePerDay: resolveOverride(base.practicePerDay, overrides?.practicePerDay),
    testsPerWeek: resolveOverride(base.testsPerWeek, overrides?.testsPerWeek),
  };
}
