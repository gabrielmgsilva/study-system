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

export default async function AppOnboardingPage() {
  const locale = await getServerAppLocale();
  const user = await getCurrentUserServer();

  if (!user) {
    redirect(localizeAppHref('/auth/login', locale));
  }

  const primaryLicenseId = normalizeOnboardingLicense(user.primaryLicenseId);

  if (user.onboardingCompletedAt && primaryLicenseId) {
    redirect(localizeAppHref(await resolvePostOnboardingDestination(user.id, primaryLicenseId), locale));
  }

  return (
    <OnboardingPage
      userName={user.name || 'pilot'}
      initialLicenseId={primaryLicenseId}
      initialStudyLevel={normalizeOnboardingStudyLevel(user.studyLevel)}
      initialStudyGoal={normalizeOnboardingStudyGoal(user.studyGoal)}
    />
  );
}