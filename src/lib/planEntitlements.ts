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

export function planCaps(plan: PlanTier) {
  // Client uses this for perceived limits (MVP). Backend keeps only plan + access types.
  if (plan === 'premium') {
    return { flashcardsPerDay: Infinity, practicePerDay: Infinity, testsPerWeek: Infinity };
  }
  if (plan === 'standard') {
    return { flashcardsPerDay: Infinity, practicePerDay: Infinity, testsPerWeek: 3 };
  }
  return { flashcardsPerDay: 20, practicePerDay: 2, testsPerWeek: 1 };
}
