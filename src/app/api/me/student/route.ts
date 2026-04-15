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

  const freeTier = !user?.plan && !user?.subscriptionStatus;
  const subscriptionActive =
    freeTier ||
    ((user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing') &&
      user?.subscriptionExpiresAt != null &&
      user.subscriptionExpiresAt > new Date());

  return NextResponse.json({
    ok: true,
    plan: user?.plan ?? null,
    enrollmentSummary: {
      count: enrolledCount,
      max: user?.plan?.maxLicenses ?? 1, // free tier allows 1 license
    },
    licenseEntitlements,
    subscription: {
      status: freeTier ? 'free' : (user?.subscriptionStatus ?? null),
      expiresAt: user?.subscriptionExpiresAt?.toISOString() ?? null,
      active: subscriptionActive,
    },
  });
}
