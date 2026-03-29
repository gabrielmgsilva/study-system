import { redirect } from 'next/navigation';

import { OnboardingPage } from '@/components/auth/OnboardingPage';
import { getCurrentUserServer } from '@/lib/currentUserServer';
import { localizeAppHref } from '@/lib/i18n/app';
import { getServerAppLocale } from '@/lib/i18n/appServer';
import {
  normalizeOnboardingLicense,
  normalizeOnboardingStudyGoal,
  normalizeOnboardingStudyLevel,
  resolvePostOnboardingDestination,
} from '@/lib/onboarding';
import { prisma } from '@/lib/prisma';

export default async function AppOnboardingPage() {
  const locale = await getServerAppLocale();
  const user = await getCurrentUserServer();

  if (!user) {
    redirect(localizeAppHref('/auth/login', locale));
  }

  const primaryLicenseId = normalizeOnboardingLicense(user.primaryLicenseId);
  const enrollmentState = await prisma.user.findFirst({
    where: { id: user.id, deletedAt: null },
    select: {
      plan: {
        select: {
          maxLicenses: true,
        },
      },
      licenseEntitlements: {
        where: {
          isActive: true,
          deletedAt: null,
        },
        select: {
          licenseId: true,
        },
      },
    },
  });

  if (user.onboardingCompletedAt && primaryLicenseId) {
    redirect(localizeAppHref(await resolvePostOnboardingDestination(user.id, primaryLicenseId), locale));
  }

  const initialSelectedLicenses: Array<NonNullable<typeof primaryLicenseId>> = [];

  for (const entitlement of (enrollmentState?.licenseEntitlements ?? []) as Array<{ licenseId: string }>) {
    const normalizedLicenseId = normalizeOnboardingLicense(entitlement.licenseId);
    if (normalizedLicenseId) {
      initialSelectedLicenses.push(normalizedLicenseId);
    }
  }

  return (
    <OnboardingPage
      userName={user.name || 'pilot'}
      initialLicenseId={primaryLicenseId}
      initialSelectedLicenses={initialSelectedLicenses}
      initialStudyLevel={normalizeOnboardingStudyLevel(user.studyLevel)}
      initialStudyGoal={normalizeOnboardingStudyGoal(user.studyGoal)}
      maxSelectableLicenses={Math.max(0, enrollmentState?.plan?.maxLicenses ?? 0)}
    />
  );
}