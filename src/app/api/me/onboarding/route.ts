import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAuth } from '@/lib/guards';
import {
  isOnboardingLicense,
  isOnboardingStudyGoal,
  isOnboardingStudyLevel,
  resolvePostOnboardingDestination,
} from '@/lib/onboarding';

function normalizeSelectedLicenses(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];

  const unique = new Set<string>();
  for (const item of value) {
    const normalized = String(item ?? '').trim().toLowerCase();
    if (normalized) unique.add(normalized);
  }

  return [...unique];
}

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));

  const primaryLicenseId = String(body?.primaryLicenseId ?? '').trim().toLowerCase();
  const selectedLicensesRaw = normalizeSelectedLicenses(body?.selectedLicenses);
  const studyLevel = String(body?.studyLevel ?? '').trim().toLowerCase();
  const studyGoalRaw = String(body?.studyGoal ?? '').trim().toLowerCase();
  const studyGoal = studyGoalRaw || null;

  if (!isOnboardingLicense(primaryLicenseId)) {
    return NextResponse.json({ message: 'Choose a valid license.' }, { status: 400 });
  }

  if (!isOnboardingStudyLevel(studyLevel)) {
    return NextResponse.json({ message: 'Choose a valid study level.' }, { status: 400 });
  }

  if (studyGoal && !isOnboardingStudyGoal(studyGoal)) {
    return NextResponse.json({ message: 'Choose a valid study goal.' }, { status: 400 });
  }

  const selectedLicenses = Array.from(new Set([...selectedLicensesRaw, primaryLicenseId, 'regs']));

  if (selectedLicenses.some((licenseId) => !isOnboardingLicense(licenseId))) {
    return NextResponse.json({ message: 'Choose valid certifications.' }, { status: 400 });
  }

  const selectedCertificationCount = selectedLicenses.filter((licenseId) => licenseId !== 'regs').length;

  const userState = await prisma.user.findFirst({
    where: { id: auth.userId, deletedAt: null },
    select: {
      plan: {
        select: {
          maxLicenses: true,
          isActive: true,
        },
      },
    },
  });

  if (selectedCertificationCount > 0) {
    if (!userState?.plan) {
      return NextResponse.json({ message: 'Choose a plan before selecting certifications.' }, { status: 403 });
    }

    if (!userState.plan.isActive) {
      return NextResponse.json({ message: 'Your current plan is inactive.' }, { status: 403 });
    }

    if (selectedCertificationCount > userState.plan.maxLicenses) {
      return NextResponse.json(
        { message: 'Your current plan does not support that many certifications.' },
        { status: 403 },
      );
    }
  }

  const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedUser = await tx.user.update({
      where: { id: auth.userId },
      data: {
        primaryLicenseId,
        studyLevel,
        studyGoal,
        onboardingCompletedAt: new Date(),
      },
      select: {
        primaryLicenseId: true,
        studyLevel: true,
        studyGoal: true,
        onboardingCompletedAt: true,
      },
    });

    for (const licenseId of selectedLicenses) {
      await tx.licenseEntitlement.upsert({
        where: { userId_licenseId: { userId: auth.userId, licenseId } },
        update: {
          isActive: true,
          enrolledAt: new Date(),
          deletedAt: null,
        },
        create: {
          userId: auth.userId,
          licenseId,
          isActive: true,
        },
      });
    }

    return updatedUser;
  });

  const redirectTo = await resolvePostOnboardingDestination(auth.userId, primaryLicenseId);

  return NextResponse.json({
    ok: true,
    user,
    redirectTo,
  });
}