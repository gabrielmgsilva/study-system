import { redirect } from 'next/navigation';

import { OnboardingPage } from '@/components/auth/OnboardingPage';
import { getCurrentUserServer } from '@/lib/currentUserServer';
import { localizeAppHref } from '@/lib/i18n/app';
import { getServerAppLocale } from '@/lib/i18n/appServer';
import {
  normalizeOnboardingLicense,
  normalizeOnboardingStudyGoal,
  normalizeOnboardingStudyLevel,
  resolvePostOnboardingRoute,
} from '@/lib/onboarding';
import { ROUTES } from '@/lib/routes';

export default async function AppOnboardingPage() {
  const locale = await getServerAppLocale();
  const user = await getCurrentUserServer();

  if (!user) {
    redirect(localizeAppHref('/auth/login', locale));
  }

  if (user.onboardingCompletedAt && user.primaryLicenseId) {
    redirect(localizeAppHref(resolvePostOnboardingRoute(user.primaryLicenseId), locale));
  }

  return (
    <OnboardingPage
      userName={user.name || 'pilot'}
      initialLicenseId={normalizeOnboardingLicense(user.primaryLicenseId)}
      initialStudyLevel={normalizeOnboardingStudyLevel(user.studyLevel)}
      initialStudyGoal={normalizeOnboardingStudyGoal(user.studyGoal)}
    />
  );
}