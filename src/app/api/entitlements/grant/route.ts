import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';
import { verifySignedSession } from '@/lib/auth';

function norm(s: string) {
  return String(s ?? '').trim().toLowerCase().replace(/_/g, '-');
}

function normalizeModuleKey(moduleKey: string): string | null {
  const raw = String(moduleKey ?? '').trim();
  const [licenseRaw, modRaw] = raw.split('.');
  if (!licenseRaw || !modRaw) return null;
  return `${norm(licenseRaw)}.${norm(modRaw)}`;
}

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json().catch(() => ({} as any));
    const normalizedKey = normalizeModuleKey(body?.moduleKey);

    if (!normalizedKey) {
      return NextResponse.json({ ok: false, error: 'Invalid moduleKey' }, { status: 400 });
    }

    // Credits
    const acct = await prisma.creditAccount.findUnique({
      where: { userId },
      select: { balance: true },
    });

    if (!acct || acct.balance < 1) {
      return NextResponse.json({ ok: false, error: 'No credits available' }, { status: 402 });
    }

    // Already granted?
    const existing = await prisma.entitlement.findUnique({
      where: {
        userId_moduleKey: {
          userId,
          moduleKey: normalizedKey,
        },
      },
      select: { id: true, granted: true },
    });

    if (existing?.granted) {
      return NextResponse.json({ ok: false, error: 'Module already unlocked' }, { status: 409 });
    }

    // Atomic grant + debit + ledger
    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.entitlement.update({
          where: { id: existing.id },
          data: { granted: true, grantedAt: new Date() },
        });
      } else {
        await tx.entitlement.create({
          data: { userId, moduleKey: normalizedKey, granted: true },
        });
      }

      await tx.creditAccount.update({
        where: { userId },
        data: { balance: { decrement: 1 } },
      });

      await tx.creditLedger.create({
        data: { userId, delta: -1, reason: `Unlock ${normalizedKey}` },
      });
    });

    const updatedAcct = await prisma.creditAccount.findUnique({
      where: { userId },
      select: { balance: true },
    });

    const entRows = await prisma.entitlement.findMany({
      where: { userId, granted: true },
      select: { moduleKey: true },
    });

    return NextResponse.json({
      ok: true,
      credits: updatedAcct?.balance ?? 0,
      entitlements: entRows.map((r) => normalizeModuleKey(r.moduleKey)).filter(Boolean),
    });
  } catch (err) {
    console.error('[ENTITLEMENT_GRANT]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
