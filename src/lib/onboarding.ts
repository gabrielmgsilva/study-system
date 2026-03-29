import { prisma } from '@/lib/prisma';
import { ROUTES, type LicenseId } from '@/lib/routes';

export const onboardingLicenseOptions = [
  {
    value: 'm',
    title: 'M License',
    description: 'Mechanical track for airframe and powerplant preparation.',
  },
  {
    value: 'e',
    title: 'E License',
    description: 'Avionics-focused preparation for electrical and electronic systems.',
  },
  {
    value: 's',
    title: 'S License',
    description: 'Structures-focused training for repairs and structural maintenance.',
  },
  {
    value: 'balloons',
    title: 'Balloons',
    description: 'Study path dedicated to balloon maintenance and operations.',
  },
  {
    value: 'regs',
    title: 'REGS',
    description: 'Regulatory study path for CARs, standards, and certification rules.',
  },
] as const satisfies ReadonlyArray<{
  value: LicenseId;
  title: string;
  description: string;
}>;

export const onboardingStudyLevels = [
  {
    value: 'beginner',
    title: 'Beginner',
    description: 'I am just getting started and need the fundamentals.',
  },
  {
    value: 'reviewing',
    title: 'Reviewing',
    description: 'I already studied and want to reinforce the weak spots.',
  },
  {
    value: 'exam_ready',
    title: 'Almost Exam Ready',
    description: 'I want timed practice and sharper performance tracking.',
  },
] as const;

export const onboardingStudyGoals = [
  {
    value: 'pass_exam',
    title: 'Pass the exam',
    description: 'Focus on readiness and exam-style confidence.',
  },
  {
    value: 'review_topics',
    title: 'Review topics',
    description: 'Strengthen knowledge gaps and revisit key subjects.',
  },
  {
    value: 'build_study_habit',
    title: 'Build a study habit',
    description: 'Create a steady cadence with clear short sessions.',
  },
] as const;

export type OnboardingStudyLevel = (typeof onboardingStudyLevels)[number]['value'];
export type OnboardingStudyGoal = (typeof onboardingStudyGoals)[number]['value'];

const onboardingLicenseSet = new Set<LicenseId>(
  onboardingLicenseOptions.map((option) => option.value),
);
const onboardingStudyLevelSet = new Set<OnboardingStudyLevel>(
  onboardingStudyLevels.map((option) => option.value),
);
const onboardingStudyGoalSet = new Set<OnboardingStudyGoal>(
  onboardingStudyGoals.map((option) => option.value),
);

export function isOnboardingLicense(value: string): value is LicenseId {
  return onboardingLicenseSet.has(value as LicenseId);
}

export function isOnboardingStudyLevel(value: string): value is OnboardingStudyLevel {
  return onboardingStudyLevelSet.has(value as OnboardingStudyLevel);
}

export function isOnboardingStudyGoal(value: string): value is OnboardingStudyGoal {
  return onboardingStudyGoalSet.has(value as OnboardingStudyGoal);
}

export function normalizeOnboardingLicense(value?: string | null): LicenseId | null {
  if (!value) return null;
  return isOnboardingLicense(value) ? value : null;
}

export function normalizeOnboardingStudyLevel(
  value?: string | null,
): OnboardingStudyLevel | null {
  if (!value) return null;
  return isOnboardingStudyLevel(value) ? value : null;
}

export function normalizeOnboardingStudyGoal(
  value?: string | null,
): OnboardingStudyGoal | null {
  if (!value) return null;
  return isOnboardingStudyGoal(value) ? value : null;
}

export function resolvePostOnboardingRoute(licenseId: LicenseId): string {
  return licenseId === 'regs' ? ROUTES.regs : ROUTES.license(licenseId);
}

export async function resolvePostOnboardingDestination(userId: number, licenseId: LicenseId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      plan: {
        select: {
          id: true,
          isActive: true,
        },
      },
    },
  });

  const hasActiveSub =
    user?.subscriptionStatus === 'active' ||
    (user?.subscriptionStatus === 'trialing' &&
      user.subscriptionExpiresAt &&
      user.subscriptionExpiresAt > new Date());

  if (!user?.plan || !user.plan.isActive) {
    if (hasActiveSub) {
      // Plan is somehow mismatched but subscription is active — let them through
    } else {
      return `${ROUTES.student}?intent=choose-plan&license=${licenseId}`;
    }
  }

  return resolvePostOnboardingRoute(licenseId);
}