import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { defaultLicenseExperience } from '@/lib/planEntitlements';
import { isAuthError, requireAdmin } from '@/lib/guards';

const LICENSE_IDS = ['regs', 'm', 'e', 's', 'balloons'] as const;
const PLAN_IDS = ['basic', 'standard', 'premium'] as const;

function normalizeEmail(value: string | null) {
  return String(value ?? '').trim().toLowerCase();
}

function parseTargetUserId(value: string | null) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }

  return num;
}

function parseOverride(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return undefined;
  }

  return Math.floor(num);
}

async function resolveTargetUser(searchParams: URLSearchParams) {
  const targetUserId = parseTargetUserId(searchParams.get('userId'));
  const targetEmail = normalizeEmail(searchParams.get('email'));

  if (targetUserId) {
    return prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true, email: true, name: true },
    });
  }

  if (targetEmail) {
    return prisma.user.findFirst({
      where: { email: targetEmail, deletedAt: null },
      select: { id: true, email: true, name: true },
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
  });

  const byLicense = new Map(rows.map((row) => [row.licenseId, row]));

  const entitlements = LICENSE_IDS.map((licenseId) => {
    const row = byLicense.get(licenseId);
    const base = defaultLicenseExperience(row?.plan ?? 'basic');

    return {
      licenseId,
      plan: row?.plan ?? base.plan,
      flashcards: row?.flashcards ?? base.flashcards,
      practice: row?.practice ?? base.practice,
      test: row?.test ?? base.test,
      logbook: row?.logbook ?? base.logbook,
      flashcardsPerDayOverride: row?.flashcardsPerDayOverride ?? null,
      practicePerDayOverride: row?.practicePerDayOverride ?? null,
      testsPerWeekOverride: row?.testsPerWeekOverride ?? null,
      exists: !!row,
    };
  });

  return NextResponse.json({ ok: true, user, entitlements });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const targetUserId = parseTargetUserId(String(body?.userId ?? ''));
  const licenseId = String(body?.licenseId ?? '').trim();
  const plan = String(body?.plan ?? '').trim();
  const flashcardsPerDayOverride = parseOverride(body?.flashcardsPerDayOverride);
  const practicePerDayOverride = parseOverride(body?.practicePerDayOverride);
  const testsPerWeekOverride = parseOverride(body?.testsPerWeekOverride);

  if (!targetUserId || !LICENSE_IDS.includes(licenseId as (typeof LICENSE_IDS)[number])) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  if (!PLAN_IDS.includes(plan as (typeof PLAN_IDS)[number])) {
    return NextResponse.json({ ok: false, error: 'Invalid plan' }, { status: 400 });
  }

  if (
    flashcardsPerDayOverride === undefined ||
    practicePerDayOverride === undefined ||
    testsPerWeekOverride === undefined
  ) {
    return NextResponse.json({ ok: false, error: 'Override values must be empty or non-negative integers' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { id: targetUserId, deletedAt: null },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  }

  const exp = defaultLicenseExperience(plan as (typeof PLAN_IDS)[number]);

  const row = await prisma.licenseEntitlement.upsert({
    where: { userId_licenseId: { userId: targetUserId, licenseId } },
    update: {
      plan: exp.plan,
      flashcards: exp.flashcards,
      practice: exp.practice,
      test: exp.test,
      logbook: exp.logbook,
      flashcardsPerDayOverride,
      practicePerDayOverride,
      testsPerWeekOverride,
      deletedAt: null,
    },
    create: {
      userId: targetUserId,
      licenseId,
      plan: exp.plan,
      flashcards: exp.flashcards,
      practice: exp.practice,
      test: exp.test,
      logbook: exp.logbook,
      flashcardsPerDayOverride,
      practicePerDayOverride,
      testsPerWeekOverride,
    },
  });

  return NextResponse.json({ ok: true, entitlement: row });
}