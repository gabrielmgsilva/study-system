import { getPublicPlans } from '@/lib/publicPlans';
import { isFeaturedPublicPlan } from '@/lib/publicPlanPresentation';

import { PlanSelector } from './plan-selector';

export const metadata = {
  title: 'Choose Your Plan',
};

export default async function PlansPage() {
  const plans = await getPublicPlans();

  const plansWithFeatured = plans.map((plan) => ({
    ...plan,
    isFeatured: isFeaturedPublicPlan(plan),
  }));

  return (
    <main className="min-h-dvh bg-background">
      <PlanSelector plans={plansWithFeatured} />
    </main>
  );
}
