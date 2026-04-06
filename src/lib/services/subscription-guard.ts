import 'server-only';

import { prisma } from '@/lib/prisma';

type StudentAccessResult =
  | { allowed: true; user: StudentUser }
  | { allowed: false; redirect: string };

type StudentUser = {
  id: number;
  email: string;
  name: string | null;
  planId: number | null;
  subscriptionStatus: string | null;
  subscriptionExpiresAt: Date | null;
  onboardingCompletedAt: Date | null;
  primaryLicenseId: string | null;
  plan: {
    id: number;
    slug: string;
    name: string;
    maxLicenses: number;
  } | null;
  _count: { licenseEntitlements: number };
};

/**
 * Verify that a student has a valid subscription and has completed onboarding.
 * Returns the user data if access is allowed, or a redirect path otherwise.
 */
export async function checkStudentAccess(
  userId: number,
): Promise<StudentAccessResult> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      planId: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      onboardingCompletedAt: true,
      primaryLicenseId: true,
      plan: {
        select: {
          id: true,
          slug: true,
          name: true,
          maxLicenses: true,
        },
      },
      _count: {
        select: {
          licenseEntitlements: {
            where: { isActive: true, deletedAt: null },
          },
        },
      },
    },
  });

  if (!user) {
    return { allowed: false, redirect: '/auth/login' };
  }

  // No subscription at all → choose a plan
  if (!user.subscriptionStatus) {
    return { allowed: false, redirect: '/plans' };
  }

  // Onboarding not completed → pick licenses
  if (!user.onboardingCompletedAt) {
    return { allowed: false, redirect: '/onboarding/licenses' };
  }

  // No active license entitlements → pick licenses
  if (user._count.licenseEntitlements === 0) {
    return { allowed: false, redirect: '/onboarding/licenses' };
  }

  return { allowed: true, user };
}
