'use client';

import { useBillingInterval } from '@/components/PricingIntervalClient';
import type { PublicPlan } from '@/lib/publicPlans';

type Props = {
  plan: PublicPlan;
  annualPricePerMonth: Record<string, string>;
  annualSavings: Record<string, string>;
};

export function PriceDisplayClient({ plan, annualPricePerMonth, annualSavings }: Props) {
  const { interval } = useBillingInterval();

  const isAnnual = interval === 'year';
  const annualPerMonth = annualPricePerMonth[plan.slug];
  const monthlyAmount = plan.price ? Number(plan.price).toFixed(2) : null;
  const displayAmount = isAnnual && annualPerMonth ? annualPerMonth : monthlyAmount;
  const savings = isAnnual ? annualSavings[plan.slug] : null;

  if (!displayAmount) {
    return (
      <div className="text-white/50 text-sm">Price not configured</div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-white">${displayAmount}</span>
        <span className="mb-1 text-sm text-white/55">/ month</span>
      </div>
      {isAnnual ? (
        <p className="text-xs text-white/55">
          Billed ${(Number(displayAmount) * 12).toFixed(2)}/year
          {savings && (
            <span className="ml-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-emerald-400 font-medium">
              {savings}
            </span>
          )}
        </p>
      ) : (
        <p className="text-xs text-white/50">Billed monthly · cancel anytime</p>
      )}
    </div>
  );
}
