import { redirect } from 'next/navigation';

import { getCurrentUserServer } from '@/lib/currentUserServer';
import { prisma } from '@/lib/prisma';

import { LicensePicker } from './license-picker';

export const metadata = {
  title: 'Select Your Certifications',
};

export default async function OnboardingLicensesPage() {
  const user = await getCurrentUserServer();
  if (!user) redirect('/auth/login');

  const [dbUser, licenses] = await Promise.all([
    prisma.user.findFirst({
      where: { id: user.id, deletedAt: null },
      select: {
        id: true,
        subscriptionStatus: true,
        planId: true,
        plan: {
          select: {
            id: true,
            name: true,
            maxLicenses: true,
          },
        },
        licenseEntitlements: {
          where: { isActive: true, deletedAt: null },
          select: { licenseId: true },
        },
      },
    }),
    prisma.license.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
      },
    }),
  ]);

  if (!dbUser) {
    redirect('/auth/login');
  }

  // Free tier: no subscriptionStatus is allowed — user gets 1 license slot.
  // Trial: use the plan's actual maxLicenses (not hardcoded 1).
  const isFreeTier = !dbUser.subscriptionStatus;
  const maxLicenses = dbUser.plan?.maxLicenses ?? 1;
  const currentLicenseIds = dbUser.licenseEntitlements.map(
    (e: { licenseId: string }) => e.licenseId,
  );

  return (
    <main className="min-h-dvh bg-background">
      <LicensePicker
        licenses={licenses}
        maxLicenses={maxLicenses}
        isTrial={dbUser.subscriptionStatus === 'trialing'}
        isFreeTier={isFreeTier}
        planName={isFreeTier ? 'Free' : (dbUser.plan?.name ?? 'Your Plan')}
        currentLicenseIds={currentLicenseIds}
      />
    </main>
  );
}
