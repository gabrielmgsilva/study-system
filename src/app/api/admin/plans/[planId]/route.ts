import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

function parseRuleId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parsePlanId(value: unknown) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNullableInt(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseNullableBool(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
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
  const ruleId = parseRuleId(planIdParam);
  if (!ruleId) {
    return NextResponse.json({ ok: false, error: 'Invalid plan rule id' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const planId = parsePlanId(body?.planId);
  const licenseId = body?.licenseId === undefined ? undefined : String(body.licenseId).trim().toLowerCase();
  const moduleId =
    body?.moduleId === undefined
      ? undefined
      : body.moduleId === null || body.moduleId === ''
        ? null
        : Number(body.moduleId);
  const flashcardsPerDay = parseNullableInt(body?.flashcardsPerDay);
  const practicePerDay = parseNullableInt(body?.practicePerDay);
  const testsPerWeek = parseNullableInt(body?.testsPerWeek);
  const maxQuestionsPerSession = parseNullableInt(body?.maxQuestionsPerSession);
  const logbookAccess = parseNullableBool(body?.logbookAccess);

  if (
    (body?.planId !== undefined && planId === undefined) ||
    flashcardsPerDay === undefined ||
    practicePerDay === undefined ||
    testsPerWeek === undefined ||
    maxQuestionsPerSession === undefined ||
    logbookAccess === undefined
  ) {
    return NextResponse.json({ ok: false, error: 'Invalid plan rule payload' }, { status: 400 });
  }

  if (moduleId !== undefined && moduleId !== null && (!Number.isInteger(moduleId) || moduleId <= 0)) {
    return NextResponse.json({ ok: false, error: 'Invalid module id' }, { status: 400 });
  }

  const current = await prisma.planModuleLimit.findFirst({
    where: { id: ruleId, deletedAt: null },
    select: { id: true, planId: true, licenseId: true, moduleId: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: 'Plan rule not found' }, { status: 404 });
  }

  const nextPlanId = planId ?? current.planId;
  const nextLicenseId = licenseId ?? current.licenseId;
  const nextModuleId = moduleId === undefined ? current.moduleId : moduleId;

  if (body?.planId !== undefined) {
    const plan = await prisma.plan.findFirst({
      where: { id: nextPlanId, deletedAt: null },
      select: { id: true },
    });
    if (!plan) {
      return NextResponse.json({ ok: false, error: 'Plan not found' }, { status: 404 });
    }
  }

  if (body?.licenseId !== undefined) {
    const license = await prisma.license.findFirst({
      where: { id: nextLicenseId, deletedAt: null },
      select: { id: true },
    });
    if (!license) {
      return NextResponse.json({ ok: false, error: 'License not found' }, { status: 404 });
    }
  }

  if (nextModuleId !== null) {
    const module = await prisma.module.findFirst({
      where: { id: nextModuleId, licenseId: nextLicenseId, deletedAt: null },
      select: { id: true },
    });
    if (!module) {
      return NextResponse.json({ ok: false, error: 'Module not found for selected license' }, { status: 404 });
    }
  }

  const duplicate = await prisma.planModuleLimit.findFirst({
    where: {
      deletedAt: null,
      id: { not: ruleId },
      planId: nextPlanId,
      licenseId: nextLicenseId,
      moduleId: nextModuleId,
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A rule already exists for this plan, license, and module scope.' }, { status: 409 });
  }

  const updated = await prisma.planModuleLimit.update({
    where: { id: ruleId },
    data: {
      ...(planId ? { planId } : {}),
      ...(licenseId !== undefined ? { licenseId } : {}),
      ...(moduleId !== undefined ? { moduleId } : {}),
      ...(flashcardsPerDay !== null || body?.flashcardsPerDay !== undefined ? { flashcardsPerDay } : {}),
      ...(practicePerDay !== null || body?.practicePerDay !== undefined ? { practicePerDay } : {}),
      ...(testsPerWeek !== null || body?.testsPerWeek !== undefined ? { testsPerWeek } : {}),
      ...(maxQuestionsPerSession !== null || body?.maxQuestionsPerSession !== undefined
        ? { maxQuestionsPerSession }
        : {}),
      ...(logbookAccess !== null || body?.logbookAccess !== undefined ? { logbookAccess } : {}),
    },
    include: {
      plan: { select: { id: true, tier: true, name: true, slug: true, isActive: true } },
      license: { select: { id: true, name: true } },
      module: { select: { id: true, name: true, slug: true, moduleKey: true } },
    },
  });

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  void req;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { planId: planIdParam } = await params;
  const ruleId = parseRuleId(planIdParam);
  if (!ruleId) {
    return NextResponse.json({ ok: false, error: 'Invalid plan rule id' }, { status: 400 });
  }

  await prisma.planModuleLimit.update({
    where: { id: ruleId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
