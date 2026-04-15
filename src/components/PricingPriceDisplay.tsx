'use client';

import { useBillingInterval } from '@/components/PricingIntervalClient';
import type { PublicPlan } from '@/lib/publicPlans';

type Props = {
  plan: PublicPlan;
};

export function PriceDisplayClient({ plan }: Props) {
  const { interval } = useBillingInterval();

  const isAnnual = interval === 'year';
  const monthly = plan.price ? Number(plan.price) : null;
  const annual = plan.priceAnnual ? Number(plan.priceAnnual) : null;

  // Per-month display when billed annually
  const annualPerMonth = annual !== null ? annual / 12 : null;

  // Savings percentage vs paying monthly for 12 months
  const savingsPct =
    monthly !== null && annual !== null
      ? Math.round(((monthly * 12 - annual) / (monthly * 12)) * 100)
      : null;

  const displayAmount = isAnnual && annualPerMonth !== null
    ? annualPerMonth.toFixed(2)
    : monthly !== null
      ? monthly.toFixed(2)
      : null;

  if (!displayAmount) {
    return <div className="text-white/50 text-sm">Price not configured</div>;
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-white">${displayAmount}</span>
        <span className="mb-1 text-sm text-white/55">/ month</span>
      </div>
      {isAnnual ? (
        <p className="text-xs text-white/55">
          Billed ${annual !== null ? annual.toFixed(2) : (Number(displayAmount) * 12).toFixed(2)}/year
          {savingsPct !== null && savingsPct > 0 && (
            <span className="ml-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-emerald-400 font-medium">
              Save {savingsPct}%
            </span>
          )}
        </p>
      ) : (
        <p className="text-xs text-white/50">Billed monthly · cancel anytime</p>
      )}
    </div>
  );
}
