import type { UserRole } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

const LICENSE_IDS = ['regs', 'm', 'e', 's', 'balloons'] as const;
const USER_ROLES = ['user', 'admin'] as const satisfies readonly UserRole[];

function parseUserId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseNullableString(value: unknown) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function parseRole(value: unknown): UserRole | undefined {
  if (value === undefined) return undefined;
  return USER_ROLES.includes(value as UserRole) ? (value as UserRole) : undefined;
}

function parseLicenseId(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  return LICENSE_IDS.includes(normalized as (typeof LICENSE_IDS)[number]) ? normalized : undefined;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { userId: userIdParam } = await params;
  const userId = parseUserId(userIdParam);
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Invalid user id' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const role = parseRole(body?.role);
  const primaryLicenseId = parseLicenseId(body?.primaryLicenseId);

  if (body?.role !== undefined && role === undefined) {
    return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 });
  }

  if (body?.primaryLicenseId !== undefined && primaryLicenseId === undefined) {
    return NextResponse.json({ ok: false, error: 'Invalid primary license' }, { status: 400 });
  }

  if (auth.userId === userId && role === 'user') {
    return NextResponse.json(
      { ok: false, error: 'You cannot remove your own admin access.' },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  }

  const data = {
    ...(body?.name !== undefined ? { name: parseNullableString(body.name) } : {}),
    ...(body?.username !== undefined ? { username: parseNullableString(body.username) } : {}),
    ...(role ? { role } : {}),
    ...(body?.primaryLicenseId !== undefined ? { primaryLicenseId } : {}),
    ...(body?.studyLevel !== undefined ? { studyLevel: parseNullableString(body.studyLevel) } : {}),
    ...(body?.studyGoal !== undefined ? { studyGoal: parseNullableString(body.studyGoal) } : {}),
  };

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      primaryLicenseId: true,
      studyLevel: true,
      studyGoal: true,
      onboardingCompletedAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, user: updated });
}
