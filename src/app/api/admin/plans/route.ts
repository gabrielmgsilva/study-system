import type { Prisma } from '@prisma/client';
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

function parseTierSearch(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === 'basic' || normalized === 'standard' || normalized === 'premium'
    ? (normalized as 'basic' | 'standard' | 'premium')
    : null;
}

function parseModuleId(value: string | null) {
  if (!value || value === 'all') return null;
  if (value === 'license') return 'license';
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseNullableInt(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseNullableBool(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

async function getPlanCatalogOptions() {
  const [plans, licenses, modules] = await Promise.all([
    prisma.plan.findMany({
      where: { deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        tier: true,
        slug: true,
        name: true,
        description: true,
        isActive: true,
        updatedAt: true,
      },
    }),
    prisma.license.findMany({
      where: { deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.module.findMany({
      where: { deletedAt: null },
      orderBy: [{ license: { displayOrder: 'asc' } }, { displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        licenseId: true,
        name: true,
        slug: true,
        moduleKey: true,
      },
    }),
  ]);

  return { plans, licenses, modules };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const q = String(req.nextUrl.searchParams.get('q') ?? '').trim();
  const planId = parsePlanId(req.nextUrl.searchParams.get('planId'));
  const licenseId = String(req.nextUrl.searchParams.get('licenseId') ?? '').trim().toLowerCase();
  const moduleFilter = parseModuleId(req.nextUrl.searchParams.get('moduleId'));
  const page = parsePage(req.nextUrl.searchParams.get('page'));
  const pageSize = parsePageSize(req.nextUrl.searchParams.get('pageSize'));
  const tierSearch = q ? parseTierSearch(q) : null;

  const where: Prisma.PlanModuleLimitWhereInput = {
    deletedAt: null,
    ...(planId ? { planId } : {}),
    ...(licenseId ? { licenseId } : {}),
    ...(moduleFilter === 'license'
      ? { moduleId: null }
      : typeof moduleFilter === 'number'
        ? { moduleId: moduleFilter }
        : {}),
    ...(q
      ? {
          OR: [
            { plan: { name: { contains: q, mode: 'insensitive' } } },
            ...(tierSearch ? [{ plan: { tier: tierSearch } }] : []),
            { licenseId: { contains: q, mode: 'insensitive' } },
            { license: { name: { contains: q, mode: 'insensitive' } } },
            { module: { name: { contains: q, mode: 'insensitive' } } },
            { module: { slug: { contains: q, mode: 'insensitive' } } },
            { module: { moduleKey: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, rows, options] = await Promise.all([
    prisma.planModuleLimit.count({ where }),
    prisma.planModuleLimit.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        plan: { select: { id: true, tier: true, name: true, slug: true, isActive: true } },
        license: { select: { id: true, name: true } },
        module: { select: { id: true, name: true, slug: true, moduleKey: true } },
      },
    }),
    getPlanCatalogOptions(),
  ]);

  return NextResponse.json({
    ok: true,
    items: rows,
    options,
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
  const planId = parsePlanId(String(body?.planId ?? ''));
  const licenseId = String(body?.licenseId ?? '').trim().toLowerCase();
  const moduleIdRaw = body?.moduleId;
  const moduleId = moduleIdRaw === null || moduleIdRaw === '' || moduleIdRaw === undefined ? null : Number(moduleIdRaw);
  const flashcardsPerDay = parseNullableInt(body?.flashcardsPerDay);
  const practicePerDay = parseNullableInt(body?.practicePerDay);
  const testsPerWeek = parseNullableInt(body?.testsPerWeek);
  const maxQuestionsPerSession = parseNullableInt(body?.maxQuestionsPerSession);
  const logbookAccess = parseNullableBool(body?.logbookAccess);

  if (!planId || !licenseId) {
    return NextResponse.json({ ok: false, error: 'Invalid plan payload' }, { status: 400 });
  }

  if (
    flashcardsPerDay === undefined ||
    practicePerDay === undefined ||
    testsPerWeek === undefined ||
    maxQuestionsPerSession === undefined ||
    logbookAccess === undefined
  ) {
    return NextResponse.json({ ok: false, error: 'Numeric fields must be null or non-negative integers.' }, { status: 400 });
  }

  if (moduleId !== null && (!Number.isInteger(moduleId) || moduleId <= 0)) {
    return NextResponse.json({ ok: false, error: 'Invalid module id' }, { status: 400 });
  }

  const plan = await prisma.plan.findFirst({
    where: { id: planId, deletedAt: null },
    select: { id: true },
  });

  if (!plan) {
    return NextResponse.json({ ok: false, error: 'Plan not found' }, { status: 404 });
  }

  const license = await prisma.license.findFirst({
    where: { id: licenseId, deletedAt: null },
    select: { id: true },
  });

  if (!license) {
    return NextResponse.json({ ok: false, error: 'License not found' }, { status: 404 });
  }

  if (moduleId !== null) {
    const module = await prisma.module.findFirst({
      where: { id: moduleId, licenseId, deletedAt: null },
      select: { id: true },
    });

    if (!module) {
      return NextResponse.json({ ok: false, error: 'Module not found for selected license' }, { status: 404 });
    }
  }

  const duplicate = await prisma.planModuleLimit.findFirst({
    where: { deletedAt: null, planId, licenseId, moduleId },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A rule already exists for this plan, license, and module scope.' }, { status: 409 });
  }

  const created = await prisma.planModuleLimit.create({
    data: {
      planId,
      licenseId,
      moduleId,
      flashcardsPerDay,
      practicePerDay,
      testsPerWeek,
      maxQuestionsPerSession,
      logbookAccess,
    },
    include: {
      plan: { select: { id: true, tier: true, name: true, slug: true, isActive: true } },
      license: { select: { id: true, name: true } },
      module: { select: { id: true, name: true, slug: true, moduleKey: true } },
    },
  });

  return NextResponse.json({ ok: true, item: created });
}
