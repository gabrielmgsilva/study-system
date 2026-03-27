import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

function parsePlanId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseName(value: unknown) {
  const nextValue = String(value ?? '').trim();
  return nextValue.length > 0 ? nextValue : null;
}

function parseDescription(value: unknown) {
  if (value === undefined) return undefined;
  const nextValue = String(value ?? '').trim();
  return nextValue.length > 0 ? nextValue : null;
}

function parseIsActive(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { planId: planIdParam } = await params;
  const planId = parsePlanId(planIdParam);
  if (!planId) {
    return NextResponse.json({ ok: false, error: 'Invalid plan id' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body?.name === undefined ? undefined : parseName(body?.name);
  const description = parseDescription(body?.description);
  const isActive = body?.isActive === undefined ? undefined : parseIsActive(body?.isActive);

  if ((body?.name !== undefined && !name) || (body?.isActive !== undefined && isActive === undefined)) {
    return NextResponse.json({ ok: false, error: 'Invalid plan payload' }, { status: 400 });
  }

  const updated = await prisma.plan.update({
    where: { id: planId },
    data: {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    select: {
      id: true,
      tier: true,
      slug: true,
      name: true,
      description: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, item: updated });
}