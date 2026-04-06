import 'server-only';

import { prisma } from '@/lib/prisma';

type StudentAccessResult =
  | { allowed: true; user: StudentUser; readOnly: boolean }
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

/** Statuses that grant full access */
const ACTIVE_STATUSES = new Set(['active', 'trialing']);

/** Statuses that grant read-only access (dashboard, stats, profile, 1 quick review/day) */
const READONLY_STATUSES = new Set(['canceled', 'expired']);

/** Past-due grace period in milliseconds (3 days) */
const PAST_DUE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Verify that a student has a valid subscription and has completed onboarding.
 * Returns the user data if access is allowed, or a redirect path otherwise.
 *
 * Access rules per Phase 7 spec:
 * - null / "unpaid" → redirect /plans
 * - "trialing" / "active" → full access (check expires_at)
 * - "canceled" / "expired" → read-only (dashboard, stats, profile, 1 quick review/day)
 * - "past_due" → full access for 3-day grace period, then redirect /plans
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

  const status = user.subscriptionStatus;

  // Active / trialing → full access
  if (ACTIVE_STATUSES.has(status)) {
    return { allowed: true, user, readOnly: false };
  }

  // Past due → 3-day grace period
  if (status === 'past_due') {
    const expiresAt = user.subscriptionExpiresAt;
    if (expiresAt) {
      const graceEnd = new Date(expiresAt.getTime() + PAST_DUE_GRACE_MS);
      if (new Date() <= graceEnd) {
        return { allowed: true, user, readOnly: false };
      }
    }
    // Grace expired → redirect to plans
    return { allowed: false, redirect: '/plans' };
  }

  // Canceled / expired → read-only access
  if (READONLY_STATUSES.has(status)) {
    return { allowed: true, user, readOnly: true };
  }

  // Unknown status → redirect to plans
  return { allowed: false, redirect: '/plans' };
}

/**
 * Check if a user can start a new study session (not read-only).
 * Expired users can view dashboard, stats, profile, and do 1 quick review/day,
 * but CANNOT start new sessions, tests, or save practice.
 */
export async function assertCanStudy(
  userId: number,
): Promise<{ allowed: true; user: StudentUser } | { allowed: false; reason: string }> {
  const access = await checkStudentAccess(userId);

  if (!access.allowed) {
    return { allowed: false, reason: 'No active subscription.' };
  }

  if (access.readOnly) {
    return {
      allowed: false,
      reason: 'Your plan is paused. Reactivate to continue studying.',
    };
  }

  return { allowed: true, user: access.user };
}
