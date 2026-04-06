import { redirect } from 'next/navigation';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { checkStudentAccess } from '@/lib/services/subscription-guard';
import { prisma } from '@/lib/prisma';
import { LicenseManager } from './license-manager';

export default async function LicensesPage() {
  const session = await getCurrentSessionServer();
  if (!session) redirect('/auth/login');

  const access = await checkStudentAccess(session.userId);
  if (!access.allowed) redirect(access.redirect);

  const [entitlements, licenses, user] = await Promise.all([
    prisma.licenseEntitlement.findMany({
      where: { userId: session.userId, deletedAt: null },
      select: { licenseId: true, isActive: true },
    }),
    prisma.license.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findFirstOrThrow({
      where: { id: session.userId, deletedAt: null },
      select: {
        plan: { select: { maxLicenses: true } },
        subscriptionStatus: true,
      },
    }),
  ]);

  const maxLicenses = user.plan?.maxLicenses ?? 1;
  const isTrial = user.subscriptionStatus === 'trialing';

  return (
    <LicenseManager
      licenses={licenses}
      entitlements={entitlements}
      maxLicenses={isTrial ? 1 : maxLicenses}
    />
  );
}
