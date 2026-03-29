import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

const LICENSE_IDS = ['regs', 'm', 'e', 's', 'balloons'] as const;

function normalizeEmail(value: string | null) {
  return String(value ?? '').trim().toLowerCase();
}

function parseTargetUserId(value: string | null) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

async function resolveTargetUser(searchParams: URLSearchParams) {
  const targetUserId = parseTargetUserId(searchParams.get('userId'));
  const targetEmail = normalizeEmail(searchParams.get('email'));

  if (targetUserId) {
    return prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
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

  if (targetEmail) {
    return prisma.user.findFirst({
      where: { email: targetEmail, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
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

  return null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const user = await resolveTargetUser(req.nextUrl.searchParams);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  }

  const rows = await prisma.licenseEntitlement.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { licenseId: 'asc' },
    select: {
      licenseId: true,
      enrolledAt: true,
      isActive: true,
    },
  });

  const byLicense = new Map(rows.map((row) => [row.licenseId, row]));

  return NextResponse.json({
    ok: true,
    user,
    entitlements: LICENSE_IDS.map((licenseId) => {
      const row = byLicense.get(licenseId);
      return {
        licenseId,
        exists: !!row,
        isActive: row?.isActive ?? false,
        enrolledAt: row?.enrolledAt?.toISOString() ?? null,
        countsAgainstLimit: licenseId !== 'regs',
      };
    }),
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const userId = parseTargetUserId(String(body?.userId ?? ''));
  const licenseId = String(body?.licenseId ?? '').trim().toLowerCase();
  const isActive = typeof body?.isActive === 'boolean' ? body.isActive : null;

  if (!userId || !LICENSE_IDS.includes(licenseId as (typeof LICENSE_IDS)[number]) || isActive === null) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      plan: {
        select: {
          id: true,
          maxLicenses: true,
          isActive: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  }

  if (isActive && licenseId !== 'regs') {
    if (!user.plan || !user.plan.isActive) {
      return NextResponse.json({ ok: false, error: 'User needs an active plan before enrollment.' }, { status: 409 });
    }

    if (user.plan.maxLicenses > 0) {
      const activeCount = await prisma.licenseEntitlement.count({
        where: {
          userId,
          deletedAt: null,
          isActive: true,
          licenseId: { not: 'regs' },
          ...(licenseId ? { licenseId: { not: licenseId } } : {}),
        },
      });

      if (activeCount >= user.plan.maxLicenses) {
        return NextResponse.json({ ok: false, error: 'The selected plan already reached the certification limit.' }, { status: 409 });
      }
    }
  }

  if (isActive) {
    const entitlement = await prisma.licenseEntitlement.upsert({
      where: { userId_licenseId: { userId, licenseId } },
      update: {
        isActive: true,
        enrolledAt: new Date(),
        deletedAt: null,
      },
      create: {
        userId,
        licenseId,
        isActive: true,
      },
      select: {
        licenseId: true,
        enrolledAt: true,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, entitlement });
  }

  await prisma.licenseEntitlement.updateMany({
    where: { userId, licenseId, deletedAt: null },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}