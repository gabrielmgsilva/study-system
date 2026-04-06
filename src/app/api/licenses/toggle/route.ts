import { NextRequest, NextResponse } from 'next/server';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getCurrentSessionServer();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { licenseId, isActive } = body as {
    licenseId?: string;
    isActive?: boolean;
  };

  if (!licenseId || typeof isActive !== 'boolean') {
    return NextResponse.json(
      { error: 'licenseId and isActive are required.' },
      { status: 400 },
    );
  }

  if (isActive) {
    // Check max licenses from plan
    const userWithPlan = await prisma.user.findFirstOrThrow({
      where: { id: session.userId, deletedAt: null },
      select: {
        subscriptionStatus: true,
        plan: { select: { maxLicenses: true } },
        _count: {
          select: {
            licenseEntitlements: {
              where: { isActive: true, deletedAt: null },
            },
          },
        },
      },
    });

    const max =
      userWithPlan.subscriptionStatus === 'trialing'
        ? 1
        : (userWithPlan.plan?.maxLicenses ?? 1);

    if (userWithPlan._count.licenseEntitlements >= max) {
      return NextResponse.json(
        { error: 'Maximum certifications reached.' },
        { status: 400 },
      );
    }

    // Find existing or create entitlement
    const existing = await prisma.licenseEntitlement.findFirst({
      where: { userId: session.userId, licenseId },
    });

    if (existing) {
      await prisma.licenseEntitlement.update({
        where: { id: existing.id },
        data: { isActive: true, deletedAt: null },
      });
    } else {
      await prisma.licenseEntitlement.create({
        data: { userId: session.userId, licenseId, isActive: true },
      });
    }
  } else {
    // Deactivate
    await prisma.licenseEntitlement.updateMany({
      where: { userId: session.userId, licenseId, deletedAt: null },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ ok: true });
}
