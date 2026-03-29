import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { getLicenseEntitlementSnapshots } from '@/lib/studyAccess';

function norm(s: string) {
  return String(s ?? '').trim().toLowerCase().replace(/_/g, '-');
}

function normalizeModuleKey(moduleKey: string): string {
  const raw = String(moduleKey ?? '').trim();
  if (!raw.includes('.')) return norm(raw);
  const [licenseRaw, modRaw] = raw.split('.');
  return `${norm(licenseRaw)}.${norm(modRaw)}`;
}

export async function GET() {
  const session = await getCurrentSessionServer();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.userId;

  const acct = await prisma.creditAccount.findFirst({
    where: { userId, deletedAt: null },
    select: { balance: true },
  });

  const entRows = await prisma.entitlement.findMany({
    where: { userId, granted: true, deletedAt: null },
    select: { moduleKey: true },
  });

  const entitlements = entRows
    .map((r) => normalizeModuleKey(r.moduleKey))
    .filter(Boolean);

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

  const subscriptionActive =
    (user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing') &&
    user?.subscriptionExpiresAt != null &&
    user.subscriptionExpiresAt > new Date();

  return NextResponse.json({
    ok: true,
    credits: acct?.balance ?? 0,
    entitlements,
    plan: user?.plan ?? null,
    enrollmentSummary: {
      count: enrolledCount,
      max: user?.plan?.maxLicenses ?? 0,
    },
    licenseEntitlements,
    subscription: {
      status: user?.subscriptionStatus ?? null,
      expiresAt: user?.subscriptionExpiresAt?.toISOString() ?? null,
      active: subscriptionActive,
    },
  });
}
