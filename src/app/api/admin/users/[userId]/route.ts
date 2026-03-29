import type { UserRole } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { isAuthError, requireAdmin } from '@/lib/guards';

const LICENSE_IDS = ['regs', 'm', 'e', 's', 'balloons'] as const;
const USER_ROLES = ['user', 'admin'] as const satisfies readonly UserRole[];
const USER_STATUSES = ['active', 'inactive'] as const;

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

function parseStatus(value: unknown) {
  if (value === undefined) return undefined;
  return USER_STATUSES.includes(value as (typeof USER_STATUSES)[number])
    ? (value as (typeof USER_STATUSES)[number])
    : undefined;
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
  const status = parseStatus(body?.status);
  const primaryLicenseId = parseLicenseId(body?.primaryLicenseId);

  if (body?.role !== undefined && role === undefined) {
    return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 });
  }

  if (body?.status !== undefined && status === undefined) {
    return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 });
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

  if (auth.userId === userId && status === 'inactive') {
    return NextResponse.json(
      { ok: false, error: 'You cannot deactivate your own account.' },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findFirst({
    where: { id: userId },
    select: { id: true, deletedAt: true, stripeCustomerId: true, subscriptionStatus: true },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  }

  // Handle subscription admin actions
  if (body?.subscriptionAction) {
    const action = body.subscriptionAction as string;

    if (action === 'cancel') {
      // Cancel Stripe subscription if customer exists
      if (existing.stripeCustomerId) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: existing.stripeCustomerId,
            status: 'active',
            limit: 1,
          });
          if (subscriptions.data[0]) {
            await stripe.subscriptions.cancel(subscriptions.data[0].id);
          }
        } catch {
          // Best-effort Stripe cancellation
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: 'canceled', subscriptionExpiresAt: null },
      });

      return NextResponse.json({ ok: true });
    }

    if (action === 'extend_trial') {
      const days = Number(body.trialDays) || 7;
      const baseDate = existing.subscriptionStatus === 'trialing'
        ? new Date()
        : new Date();
      const expiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: 'trialing', subscriptionExpiresAt: expiresAt },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Unknown subscription action.' }, { status: 400 });
  }

  const data = {
    ...(body?.name !== undefined ? { name: parseNullableString(body.name) } : {}),
    ...(body?.username !== undefined ? { username: parseNullableString(body.username) } : {}),
    ...(role ? { role } : {}),
    ...(status ? { deletedAt: status === 'inactive' ? existing.deletedAt ?? new Date() : null } : {}),
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
