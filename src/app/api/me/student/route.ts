// src/app/api/me/student/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';
import { verifySignedSession } from '@/lib/auth';

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
  const cookieStore = await cookies();
  const raw = cookieStore.get('ameone_session')?.value;

  const sessionId = verifySignedSession(raw);
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.userId;

  const acct = await prisma.creditAccount.findUnique({
    where: { userId },
    select: { balance: true },
  });

  const entRows = await prisma.entitlement.findMany({
    where: { userId, granted: true },
    select: { moduleKey: true },
  });

  const entitlements = entRows
    .map((r) => normalizeModuleKey(r.moduleKey))
    .filter(Boolean);

  const licRows = await prisma.licenseEntitlement.findMany({
    where: { userId },
    select: {
      licenseId: true,
      plan: true,
      flashcards: true,
      practice: true,
      test: true,
      logbook: true,
    },
  });

  const licenseEntitlements: Record<
    string,
    {
      plan: string;
      flashcards: string;
      practice: string;
      test: string;
      logbook: boolean;
    }
  > = {};

  for (const r of licRows) {
    licenseEntitlements[norm(r.licenseId)] = {
      plan: r.plan,
      flashcards: r.flashcards,
      practice: r.practice,
      test: r.test,
      logbook: !!r.logbook,
    };
  }

  // IMPORTANT: do NOT auto-grant default access.
  // Missing licenseEntitlements means the user has not purchased that license/plan yet.

  return NextResponse.json({
    ok: true,
    credits: acct?.balance ?? 0,
    entitlements,
    licenseEntitlements,
  });
}
