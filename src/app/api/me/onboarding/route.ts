import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAuth } from '@/lib/guards';
import {
  isOnboardingLicense,
  isOnboardingStudyGoal,
  isOnboardingStudyLevel,
  resolvePostOnboardingDestination,
} from '@/lib/onboarding';

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));

  const primaryLicenseId = String(body?.primaryLicenseId ?? '').trim().toLowerCase();
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

  const user = await prisma.user.update({
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

  const redirectTo = await resolvePostOnboardingDestination(auth.userId, primaryLicenseId);

  return NextResponse.json({
    ok: true,
    user,
    redirectTo,
  });
}