import { NextResponse } from 'next/server';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { prisma } from '@/lib/prisma';

const LICENSE_IDS = new Set(['regs', 'm', 'e', 's', 'balloons']);

function normalizeLicenseId(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

// Free tier: synthetic plan limits for users with planId = null
const FREE_TIER_MAX_LICENSES = 1;

async function getUserEnrollmentContext(userId: number) {
  return prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      plan: {
        select: {
          id: true,
          name: true,
          slug: true,
          maxLicenses: true,
          isActive: true,
        },
      },
    },
  });
}

export async function POST(req: Request) {
  const session = await getCurrentSessionServer();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const licenseId = normalizeLicenseId(body?.licenseId);

  if (!LICENSE_IDS.has(licenseId)) {
    return NextResponse.json({ ok: false, error: 'Invalid licenseId' }, { status: 400 });
  }

  const user = await getUserEnrollmentContext(session.userId);

  // Free tier: no plan — allow up to FREE_TIER_MAX_LICENSES non-regs certifications.
  // Paid tier: plan must exist and be active.
  const isFreeTier = !user?.plan;

  if (!isFreeTier && !user?.plan?.isActive) {
    return NextResponse.json({ ok: false, error: 'Your current plan is inactive.' }, { status: 403 });
  }

  const maxLicenses = isFreeTier ? FREE_TIER_MAX_LICENSES : user!.plan!.maxLicenses;

  const activeEnrollment = await prisma.licenseEntitlement.findFirst({
    where: {
      userId: session.userId,
      licenseId,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!activeEnrollment && licenseId !== 'regs' && maxLicenses > 0) {
    const currentCount = await prisma.licenseEntitlement.count({
      where: {
        userId: session.userId,
        isActive: true,
        deletedAt: null,
        licenseId: { not: 'regs' },
      },
    });

    if (currentCount >= maxLicenses) {
      return NextResponse.json(
        {
          ok: false,
          error: isFreeTier
            ? 'Free accounts can enroll in 1 certification. Upgrade to add more.'
            : 'Your plan has reached the maximum number of certifications.',
        },
        { status: 403 },
      );
    }
  }

  const enrollment = await prisma.licenseEntitlement.upsert({
    where: { userId_licenseId: { userId: session.userId, licenseId } },
    update: {
      isActive: true,
      enrolledAt: new Date(),
      deletedAt: null,
    },
    create: {
      userId: session.userId,
      licenseId,
      isActive: true,
    },
    select: {
      licenseId: true,
      enrolledAt: true,
      isActive: true,
    },
  });

  return NextResponse.json({ ok: true, enrollment, plan: user?.plan ?? null });
}

export async function DELETE(req: Request) {
  const session = await getCurrentSessionServer();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const licenseId = normalizeLicenseId(body?.licenseId);

  if (!LICENSE_IDS.has(licenseId) || licenseId === 'regs') {
    return NextResponse.json({ ok: false, error: 'Invalid licenseId' }, { status: 400 });
  }

  await prisma.licenseEntitlement.updateMany({
    where: {
      userId: session.userId,
      licenseId,
      deletedAt: null,
    },
    data: {
      isActive: false,
    },
  });

  return NextResponse.json({ ok: true });
}