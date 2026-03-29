import { NextRequest, NextResponse } from 'next/server';
import type { LimitUnit } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

function parseRuleId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseNullableInt(value: unknown, minimum = 0) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : undefined;
}

function parseNullableBool(value: unknown) {
  if (value === '' || value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseName(value: unknown) {
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : null;
}

function parseSlug(value: unknown) {
  const parsed = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return parsed.length > 0 ? parsed : null;
}

function parseDescription(value: unknown) {
  if (value === undefined) return undefined;
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : null;
}

function parseLimitUnit(value: unknown) {
  if (value === undefined) return undefined;
  return value === 'day' || value === 'week' || value === 'month'
    ? (value as LimitUnit)
    : undefined;
}

function parsePrice(value: unknown) {
  if (value === undefined) return undefined;
  if (value === '' || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed.toFixed(2) : undefined;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { planId: planIdParam } = await params;
  const planId = parseRuleId(planIdParam);
  if (!planId) {
    return NextResponse.json({ ok: false, error: 'Invalid plan id' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body?.name === undefined ? undefined : parseName(body?.name);
  const slug = body?.slug === undefined ? undefined : parseSlug(body?.slug);
  const description = parseDescription(body?.description);
  const price = parsePrice(body?.price);
  const maxLicenses = parseNullableInt(body?.maxLicenses, -1);
  const flashcardsLimit = parseNullableInt(body?.flashcardsLimit, -1);
  const flashcardsUnit = parseLimitUnit(body?.flashcardsUnit);
  const practiceLimit = parseNullableInt(body?.practiceLimit, -1);
  const practiceUnit = parseLimitUnit(body?.practiceUnit);
  const testsLimit = parseNullableInt(body?.testsLimit, -1);
  const testsUnit = parseLimitUnit(body?.testsUnit);
  const maxQuestionsPerSession = parseNullableInt(body?.maxQuestionsPerSession);
  const logbookAccess = parseNullableBool(body?.logbookAccess);
  const displayOrder = parseNullableInt(body?.displayOrder);
  const isActive = parseNullableBool(body?.isActive);
  const stripeProductId = body?.stripeProductId !== undefined ? (typeof body.stripeProductId === 'string' ? body.stripeProductId.trim() || null : null) : undefined;
  const stripePriceMonthly = body?.stripePriceMonthly !== undefined ? (typeof body.stripePriceMonthly === 'string' ? body.stripePriceMonthly.trim() || null : null) : undefined;
  const stripePriceAnnual = body?.stripePriceAnnual !== undefined ? (typeof body.stripePriceAnnual === 'string' ? body.stripePriceAnnual.trim() || null : null) : undefined;
  const trialDays = body?.trialDays !== undefined ? parseNullableInt(body.trialDays, 0) : undefined;

  if (
    (body?.name !== undefined && !name) ||
    (body?.slug !== undefined && !slug) ||
    maxLicenses === undefined ||
    flashcardsLimit === undefined ||
    (body?.flashcardsUnit !== undefined && flashcardsUnit === undefined) ||
    practiceLimit === undefined ||
    (body?.practiceUnit !== undefined && practiceUnit === undefined) ||
    testsLimit === undefined ||
    (body?.testsUnit !== undefined && testsUnit === undefined) ||
    maxQuestionsPerSession === undefined ||
    logbookAccess === undefined ||
    displayOrder === undefined ||
    isActive === undefined ||
    price === undefined
  ) {
    return NextResponse.json({ ok: false, error: 'Invalid plan payload' }, { status: 400 });
  }

  const current = await prisma.plan.findFirst({
    where: { id: planId, deletedAt: null },
    select: { id: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: 'Plan not found' }, { status: 404 });
  }

  const duplicate = await prisma.plan.findFirst({
    where: {
      deletedAt: null,
      id: { not: planId },
      OR: [
        ...(slug ? [{ slug }] : []),
        ...(name ? [{ name }] : []),
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A plan with this name or slug already exists.' }, { status: 409 });
  }

  const updated = await prisma.plan.update({
    where: { id: planId },
    data: {
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof slug === 'string' ? { slug } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(maxLicenses !== null || body?.maxLicenses !== undefined ? { maxLicenses: maxLicenses ?? 0 } : {}),
      ...(flashcardsLimit !== null || body?.flashcardsLimit !== undefined
        ? { flashcardsLimit: flashcardsLimit ?? 0 }
        : {}),
      ...(flashcardsUnit !== undefined ? { flashcardsUnit } : {}),
      ...(practiceLimit !== null || body?.practiceLimit !== undefined
        ? { practiceLimit: practiceLimit ?? 0 }
        : {}),
      ...(practiceUnit !== undefined ? { practiceUnit } : {}),
      ...(testsLimit !== null || body?.testsLimit !== undefined ? { testsLimit: testsLimit ?? 0 } : {}),
      ...(testsUnit !== undefined ? { testsUnit } : {}),
      ...(maxQuestionsPerSession !== null || body?.maxQuestionsPerSession !== undefined
        ? { maxQuestionsPerSession }
        : {}),
      ...(logbookAccess !== undefined ? { logbookAccess } : {}),
      ...(displayOrder !== null || body?.displayOrder !== undefined ? { displayOrder: displayOrder ?? 0 } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(stripeProductId !== undefined ? { stripeProductId } : {}),
      ...(stripePriceMonthly !== undefined ? { stripePriceMonthly } : {}),
      ...(stripePriceAnnual !== undefined ? { stripePriceAnnual } : {}),
      ...(trialDays !== undefined && trialDays !== null ? { trialDays } : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      price: true,
      maxLicenses: true,
      flashcardsLimit: true,
      flashcardsUnit: true,
      practiceLimit: true,
      practiceUnit: true,
      testsLimit: true,
      testsUnit: true,
      maxQuestionsPerSession: true,
      logbookAccess: true,
      displayOrder: true,
      isActive: true,
      stripeProductId: true,
      stripePriceMonthly: true,
      stripePriceAnnual: true,
      trialDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, item: { ...updated, price: updated.price?.toString() ?? null } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  void req;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { planId: planIdParam } = await params;
  const planId = parseRuleId(planIdParam);
  if (!planId) {
    return NextResponse.json({ ok: false, error: 'Invalid plan id' }, { status: 400 });
  }

  const plan = await prisma.plan.findFirst({
    where: { id: planId, deletedAt: null },
    select: {
      id: true,
      _count: {
        select: {
          users: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ ok: false, error: 'Plan not found' }, { status: 404 });
  }

  if (plan._count.users > 0) {
    return NextResponse.json({ ok: false, error: 'Plan is currently assigned to users and cannot be deleted.' }, { status: 409 });
  }

  await prisma.plan.update({
    where: { id: planId },
    data: { deletedAt: new Date(), isActive: false },
  });

  return NextResponse.json({ ok: true });
}
