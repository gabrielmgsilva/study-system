import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { getLicenseEntitlementSnapshots } from '@/lib/studyAccess';

export async function GET() {
  const session = await getCurrentSessionServer();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.userId;

  const [licenseEntitlements, user] = await Promise.all([
    getLicenseEntitlementSnapshots(prisma, userId),
    prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        plan: {
          select: {
            id: true,
            slug: true,
            name: true,
            maxLicenses: true,
            isActive: true,
          },
        },
      },
    }),
  ]);

  const enrolledCount = Object.keys(licenseEntitlements).filter((licenseId) => licenseId !== 'regs').length;

  const now = new Date();
  const rawStatus = user?.subscriptionStatus ?? null;
  const expiresAt = user?.subscriptionExpiresAt ?? null;

  // A trial is only active while subscriptionExpiresAt is in the future
  const trialExpired =
    rawStatus === 'trialing' && expiresAt != null && expiresAt <= now;

  // Effective plan: null when no plan, no status, or trial expired
  const effectivePlan =
    !user?.plan || !rawStatus || trialExpired ? null : user.plan;

  const isFreeTier = !rawStatus || trialExpired;
  const subscriptionActive =
    isFreeTier ||
    (rawStatus === 'active') ||
    (rawStatus === 'trialing' && !trialExpired);

  const displayStatus = isFreeTier
    ? 'free'
    : rawStatus;

  return NextResponse.json({
    ok: true,
    plan: effectivePlan,
    enrollmentSummary: {
      count: enrolledCount,
      max: effectivePlan?.maxLicenses ?? 1, // free tier: max 1 non-regs license
    },
    licenseEntitlements,
    subscription: {
      status: displayStatus,
      expiresAt: expiresAt?.toISOString() ?? null,
      active: subscriptionActive,
      trialExpired,
    },
  });
}
