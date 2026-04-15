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
const ACTIVE_STATUSES = new Set(['active']);

/** Statuses that grant read-only access (dashboard, stats, profile, 1 quick review/day) */
const READONLY_STATUSES = new Set(['canceled', 'expired']);

/** Past-due grace period in milliseconds (3 days) */
const PAST_DUE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Verify that a student has completed onboarding and is allowed into /app.
 *
 * Access rules (MVP Free-tier model):
 * - null (no subscription)  → Free tier — allowed with limited access (planId = null)
 * - "trialing"              → Full Pro access while trial is valid; Free tier after expiry
 * - "active"                → Full access per plan
 * - "past_due"              → Full access for 3-day grace period, then Free tier
 * - "canceled" / "expired"  → Read-only access (dashboard, stats, profile)
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

  // Onboarding not completed → pick licenses
  if (!user.onboardingCompletedAt) {
    return { allowed: false, redirect: '/onboarding/licenses' };
  }

  // No active license entitlements → pick licenses
  if (user._count.licenseEntitlements === 0) {
    return { allowed: false, redirect: '/onboarding/licenses' };
  }

  const status = user.subscriptionStatus;
  const now = new Date();

  // No subscription → Free tier (allowed, limited by planId = null in studyAccess)
  if (!status) {
    return { allowed: true, user: { ...user, planId: null, plan: null }, readOnly: false };
  }

  // Active → full access per plan
  if (ACTIVE_STATUSES.has(status)) {
    return { allowed: true, user, readOnly: false };
  }

  // Trialing → full access while trial is valid; Free tier after expiry
  if (status === 'trialing') {
    const expiresAt = user.subscriptionExpiresAt;
    if (!expiresAt || now <= expiresAt) {
      return { allowed: true, user, readOnly: false };
    }
    // Trial expired — degrade to Free tier without blocking
    return { allowed: true, user: { ...user, planId: null, plan: null }, readOnly: false };
  }

  // Past due → 3-day grace period, then Free tier
  if (status === 'past_due') {
    const expiresAt = user.subscriptionExpiresAt;
    if (expiresAt) {
      const graceEnd = new Date(expiresAt.getTime() + PAST_DUE_GRACE_MS);
      if (now <= graceEnd) {
        return { allowed: true, user, readOnly: false };
      }
    }
    return { allowed: true, user: { ...user, planId: null, plan: null }, readOnly: false };
  }

  // Canceled / expired → read-only access
  if (READONLY_STATUSES.has(status)) {
    return { allowed: true, user, readOnly: true };
  }

  // Unknown status → Free tier (fail open, not fail closed)
  return { allowed: true, user: { ...user, planId: null, plan: null }, readOnly: false };
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
