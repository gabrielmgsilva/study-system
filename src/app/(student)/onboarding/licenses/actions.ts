'use server';

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { getCurrentSessionServer } from '@/lib/currentUserServer';

type TransactionClient = Prisma.TransactionClient;

export async function saveLicenseSelection(licenseIds: string[]) {
  const session = await getCurrentSessionServer();
  if (!session) {
    return { error: 'Not authenticated. Please sign in again.' };
  }

  if (!licenseIds.length) {
    return { error: 'Please select at least one certification.' };
  }

  const user = await prisma.user.findFirst({
    where: { id: session.userId, deletedAt: null },
    select: {
      id: true,
      subscriptionStatus: true,
      plan: {
        select: { maxLicenses: true },
      },
    },
  });

  if (!user || !user.subscriptionStatus) {
    return { error: 'No active subscription found.' };
  }

  const isTrial = user.subscriptionStatus === 'trialing';
  const maxLicenses = isTrial ? 1 : (user.plan?.maxLicenses ?? 1);

  if (licenseIds.length > maxLicenses) {
    return {
      error: `Your plan allows up to ${maxLicenses} certification${maxLicenses > 1 ? 's' : ''}. You selected ${licenseIds.length}.`,
    };
  }

  // Verify all selected licenses exist and are active
  const validLicenses = await prisma.license.findMany({
    where: {
      id: { in: licenseIds },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (validLicenses.length !== licenseIds.length) {
    return { error: 'One or more selected certifications are invalid.' };
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    // Deactivate existing entitlements
    await tx.licenseEntitlement.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    // Create new entitlements via upsert to handle the unique constraint
    for (const licenseId of licenseIds) {
      await tx.licenseEntitlement.upsert({
        where: {
          userId_licenseId: {
            userId: user.id,
            licenseId,
          },
        },
        update: { isActive: true },
        create: {
          userId: user.id,
          licenseId,
          isActive: true,
        },
      });
    }

    // Set primary license and mark onboarding as complete
    await tx.user.update({
      where: { id: user.id },
      data: {
        primaryLicenseId: licenseIds[0],
        onboardingCompletedAt: new Date(),
      },
    });
  });

  return { success: true };
}
