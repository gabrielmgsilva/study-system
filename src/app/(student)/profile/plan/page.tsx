import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { checkStudentAccess } from '@/lib/services/subscription-guard';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function PlanPage() {
  const session = await getCurrentSessionServer();
  if (!session) redirect('/auth/login');

  const access = await checkStudentAccess(session.userId);
  if (!access.allowed) redirect(access.redirect);

  const user = await prisma.user.findFirstOrThrow({
    where: { id: session.userId, deletedAt: null },
    select: {
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      stripeCustomerId: true,
      plan: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          maxLicenses: true,
        },
      },
    },
  });

  const daysUntilExpiry = user.subscriptionExpiresAt
    ? Math.ceil(
        (user.subscriptionExpiresAt.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const statusLabel: Record<string, string> = {
    active: 'Active',
    trialing: 'Free Trial',
    canceled: 'Canceled',
    past_due: 'Payment Due',
    expired: 'Paused',
  };

  const statusColor: Record<string, 'default' | 'secondary' | 'destructive'> = {
    active: 'default',
    trialing: 'secondary',
    canceled: 'destructive',
    past_due: 'destructive',
    expired: 'destructive',
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-4">
      <h1 className="text-xl font-bold mb-4">My Plan</h1>

      {/* Current Plan */}
      <Card className="p-5 mb-4">
        {user.plan ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg">{user.plan.name}</h2>
              {user.subscriptionStatus && (
                <Badge
                  variant={
                    statusColor[user.subscriptionStatus] ?? 'secondary'
                  }
                >
                  {statusLabel[user.subscriptionStatus] ??
                    user.subscriptionStatus}
                </Badge>
              )}
            </div>
            {user.plan.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {user.plan.description}
              </p>
            )}
            <div className="text-sm space-y-1">
              <p>
                Up to <strong>{user.plan.maxLicenses}</strong> certifications
              </p>
              {daysUntilExpiry !== null && (
                <p>
                  {user.subscriptionStatus === 'trialing' ? (
                    <span className="text-amber-600">
                      Trial: {daysUntilExpiry} days remaining
                    </span>
                  ) : (
                    <span>
                      Renews in {daysUntilExpiry} days
                    </span>
                  )}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No plan selected.</p>
        )}
      </Card>

      {/* Subscription paused notice */}
      {(user.subscriptionStatus === 'expired' ||
        user.subscriptionStatus === 'canceled') && (
        <Card className="p-4 mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-sm font-medium">Your plan is paused</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your progress is saved. Reactivate to continue studying.
          </p>
          <Button asChild className="w-full h-12 mt-3">
            <Link href="/plans">Reactivate Plan</Link>
          </Button>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button asChild variant="outline" className="w-full h-12">
          <Link href="/plans">Change Plan</Link>
        </Button>
        {user.stripeCustomerId && (
          <form action="/api/billing/portal" method="POST">
            <Button type="submit" variant="outline" className="w-full h-12">
              Manage Billing
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
