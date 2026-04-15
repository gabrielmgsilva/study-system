import { prisma } from '@/lib/prisma';

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

export function hasActiveSubscription(user: {
  planId?: number | null;
  subscriptionStatus: string | null;
  subscriptionExpiresAt: Date | null;
}): boolean {
  // Free tier: users without a plan are always "active" (limited access enforced elsewhere)
  if (!user.planId && !user.subscriptionStatus) return true;

  if (!user.subscriptionStatus) return false;
  if (!ACTIVE_STATUSES.has(user.subscriptionStatus)) return false;
  if (!user.subscriptionExpiresAt) return false;
  return user.subscriptionExpiresAt > new Date();
}

export async function getSubscriptionStatus(userId: number) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      planId: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!user) return { active: false, status: null, freeTier: false };

  const freeTier = !user.planId && !user.subscriptionStatus;

  return {
    active: hasActiveSubscription(user),
    status: freeTier ? 'free' : user.subscriptionStatus,
    freeTier,
  };
}
