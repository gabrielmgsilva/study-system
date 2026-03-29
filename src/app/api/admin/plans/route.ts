import type { LimitUnit, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parsePageSize(value: string | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return 10;
  return Math.min(parsed, 50);
}

function parsePlanId(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseStatus(value: string | null) {
  if (value === 'active' || value === 'inactive') return value;
  return 'all';
}

function parseNullableInt(value: unknown, minimum = 0) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : undefined;
}

function parseNullableBool(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseLimitUnit(value: unknown, fallback: LimitUnit) {
  if (value === undefined || value === null || value === '') return fallback;
  return value === 'day' || value === 'week' || value === 'month' ? value : undefined;
}

function parsePrice(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed.toFixed(2) : undefined;
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

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const q = String(req.nextUrl.searchParams.get('q') ?? '').trim();
  const planId = parsePlanId(req.nextUrl.searchParams.get('planId'));
  const status = parseStatus(req.nextUrl.searchParams.get('status'));
  const page = parsePage(req.nextUrl.searchParams.get('page'));
  const pageSize = parsePageSize(req.nextUrl.searchParams.get('pageSize'));

  const where: Prisma.PlanWhereInput = {
    deletedAt: null,
    ...(planId ? { id: planId } : {}),
    ...(status === 'active' ? { isActive: true } : {}),
    ...(status === 'inactive' ? { isActive: false } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.plan.count({ where }),
    prisma.plan.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
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
        _count: {
          select: {
            users: {
              where: { deletedAt: null },
            },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    items: rows.map((row) => ({
      ...row,
      price: row.price?.toString() ?? null,
      userCount: row._count.users,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const name = parseName(body?.name);
  const slug = parseSlug(body?.slug);
  const description = parseDescription(body?.description);
  const price = parsePrice(body?.price);
  const maxLicenses = parseNullableInt(body?.maxLicenses, -1);
  const flashcardsLimit = parseNullableInt(body?.flashcardsLimit, -1);
  const flashcardsUnit = parseLimitUnit(body?.flashcardsUnit, 'day');
  const practiceLimit = parseNullableInt(body?.practiceLimit, -1);
  const practiceUnit = parseLimitUnit(body?.practiceUnit, 'day');
  const testsLimit = parseNullableInt(body?.testsLimit, -1);
  const testsUnit = parseLimitUnit(body?.testsUnit, 'week');
  const maxQuestionsPerSession = parseNullableInt(body?.maxQuestionsPerSession);
  const logbookAccess = parseNullableBool(body?.logbookAccess);
  const displayOrder = parseNullableInt(body?.displayOrder);
  const isActive = parseNullableBool(body?.isActive);
  const stripeProductId = typeof body?.stripeProductId === 'string' ? body.stripeProductId.trim() || null : null;
  const stripePriceMonthly = typeof body?.stripePriceMonthly === 'string' ? body.stripePriceMonthly.trim() || null : null;
  const stripePriceAnnual = typeof body?.stripePriceAnnual === 'string' ? body.stripePriceAnnual.trim() || null : null;
  const trialDays = parseNullableInt(body?.trialDays, 0);

  if (!name || !slug) {
    return NextResponse.json({ ok: false, error: 'Invalid plan payload' }, { status: 400 });
  }

  if (
    maxLicenses === undefined ||
    flashcardsLimit === undefined ||
    flashcardsUnit === undefined ||
    practiceLimit === undefined ||
    practiceUnit === undefined ||
    testsLimit === undefined ||
    testsUnit === undefined ||
    maxQuestionsPerSession === undefined ||
    logbookAccess === undefined ||
    displayOrder === undefined ||
    isActive === undefined ||
    price === undefined
  ) {
    return NextResponse.json({ ok: false, error: 'Invalid plan payload' }, { status: 400 });
  }

  const duplicate = await prisma.plan.findFirst({
    where: { deletedAt: null, OR: [{ slug }, { name }] },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A plan with this name or slug already exists.' }, { status: 409 });
  }

  const created = await prisma.plan.create({
    data: {
      name,
      slug,
      description,
      price,
      maxLicenses: maxLicenses ?? 0,
      flashcardsLimit: flashcardsLimit ?? 0,
      flashcardsUnit,
      practiceLimit: practiceLimit ?? 0,
      practiceUnit,
      testsLimit: testsLimit ?? 0,
      testsUnit,
      maxQuestionsPerSession,
      logbookAccess,
      displayOrder: displayOrder ?? 0,
      isActive,
      stripeProductId,
      stripePriceMonthly,
      stripePriceAnnual,
      trialDays: trialDays ?? 7,
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

  return NextResponse.json({ ok: true, item: { ...created, price: created.price?.toString() ?? null } });
}
