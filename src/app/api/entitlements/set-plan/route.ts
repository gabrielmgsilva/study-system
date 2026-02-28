import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySignedSession } from '@/lib/auth';
import { defaultLicenseExperience } from '@/lib/planEntitlements';

export async function POST(req: Request) {
  const cookie = (await cookies()).get('ameone_session')?.value;
  if (!cookie) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = verifySignedSession(cookie);
  if (!sessionId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { licenseId, plan } = await req.json().catch(() => ({}));
  const lid = String(licenseId || '').trim();
  const tier = String(plan || '').trim();

  const allowedLicenses = new Set(['m', 'e', 's', 'balloons', 'regs']);
  const allowedPlans = new Set(['basic', 'standard', 'premium']);

  if (!allowedLicenses.has(lid) || !allowedPlans.has(tier)) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const exp = defaultLicenseExperience(tier as any);

  await prisma.licenseEntitlement.upsert({
    where: { userId_licenseId: { userId: session.userId, licenseId: lid } },
    update: {
      plan: exp.plan,
      flashcards: exp.flashcards,
      practice: exp.practice,
      test: exp.test,
      logbook: exp.logbook,
    },
    create: {
      userId: session.userId,
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
