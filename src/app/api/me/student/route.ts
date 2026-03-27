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

  const licenseEntitlements = await getLicenseEntitlementSnapshots(prisma, userId);

  // IMPORTANT: do NOT auto-grant default access.
  // Missing licenseEntitlements means the user has not purchased that license/plan yet.

  return NextResponse.json({
    ok: true,
    credits: acct?.balance ?? 0,
    entitlements,
    licenseEntitlements,
  });
}
