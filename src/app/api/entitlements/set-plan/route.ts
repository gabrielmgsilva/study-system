import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultLicenseExperience } from '@/lib/planEntitlements';
import { requireAdmin, isAuthError } from '@/lib/guards';

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { licenseId, plan, userId: targetUserId } = await req.json().catch(() => ({}));

  // Admin can change any user's plan; defaults to their own for backward compat
  const effectiveUserId = targetUserId ? Number(targetUserId) : auth.userId;

  const lid = String(licenseId || '').trim();
  const tier = String(plan || '').trim();

  const allowedLicenses = new Set(['m', 'e', 's', 'balloons', 'regs']);
  const allowedPlans = new Set(['basic', 'standard', 'premium']);

  if (!Number.isInteger(effectiveUserId) || effectiveUserId <= 0) {
    return NextResponse.json({ message: 'Invalid userId' }, { status: 400 });
  }

  if (!allowedLicenses.has(lid) || !allowedPlans.has(tier)) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const exp = defaultLicenseExperience(tier as any);

  await prisma.licenseEntitlement.upsert({
    where: { userId_licenseId: { userId: effectiveUserId, licenseId: lid } },
    update: {
      plan: exp.plan,
      flashcards: exp.flashcards,
      practice: exp.practice,
      test: exp.test,
      logbook: exp.logbook,
    },
    create: {
      userId: effectiveUserId,
      licenseId: lid,
      plan: exp.plan,
      flashcards: exp.flashcards,
      practice: exp.practice,
      test: exp.test,
      logbook: exp.logbook,
    },
  });

  return NextResponse.json({ ok: true });
}
