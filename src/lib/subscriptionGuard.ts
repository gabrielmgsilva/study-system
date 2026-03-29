import { prisma } from '@/lib/prisma';

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

export function hasActiveSubscription(user: {
  subscriptionStatus: string | null;
  subscriptionExpiresAt: Date | null;
}): boolean {
  if (!user.subscriptionStatus) return false;
  if (!ACTIVE_STATUSES.has(user.subscriptionStatus)) return false;
  if (!user.subscriptionExpiresAt) return false;
  return user.subscriptionExpiresAt > new Date();
}

export async function getSubscriptionStatus(userId: number) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!user) return { active: false, status: null };

  return {
    active: hasActiveSubscription(user),
    status: user.subscriptionStatus,
  };
}
