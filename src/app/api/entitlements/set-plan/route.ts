import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSessionServer } from '@/lib/currentUserServer';

export async function POST(req: Request) {
  const session = await getCurrentSessionServer();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { planId, userId: targetUserId } = await req.json().catch(() => ({}));

  const effectiveUserId = targetUserId ? Number(targetUserId) : session.userId;
  const normalizedPlanId = Number(planId);

  if (!Number.isInteger(effectiveUserId) || effectiveUserId <= 0) {
    return NextResponse.json({ ok: false, error: 'Invalid userId' }, { status: 400 });
  }

  if (effectiveUserId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  if (!Number.isInteger(normalizedPlanId) || normalizedPlanId <= 0) {
    return NextResponse.json({ ok: false, error: 'Invalid planId' }, { status: 400 });
  }

  const plan = await prisma.plan.findFirst({
    where: {
      id: normalizedPlanId,
      deletedAt: null,
      ...(session.role === 'admin' ? {} : { isActive: true }),
    },
    select: { id: true, slug: true, name: true, isActive: true, maxLicenses: true },
  });

  if (!plan) {
    return NextResponse.json({ ok: false, error: 'Plan not found' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: effectiveUserId },
      data: { planId: plan.id },
    }),
    prisma.licenseEntitlement.upsert({
      where: { userId_licenseId: { userId: effectiveUserId, licenseId: 'regs' } },
      update: {
        isActive: true,
        enrolledAt: new Date(),
        deletedAt: null,
      },
      create: {
        userId: effectiveUserId,
        licenseId: 'regs',
        isActive: true,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, plan });
}
