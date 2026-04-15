'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicPlan } from '@/lib/publicPlans';
import { useBillingInterval } from '@/components/PricingIntervalClient';

export function CouponInput() {
  const { interval, couponCode, setCouponCode } = useBillingInterval();

  if (interval !== 'year') return null;

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
        placeholder="Coupon code"
        className="h-8 rounded-lg border border-white/15 bg-white/10 px-3 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
      />
    </div>
  );
}

export function SubscribeButton({
  plan,
}: {
  plan: PublicPlan;
}) {
  const router = useRouter();
  const { interval, couponCode } = useBillingInterval();
  const [loading, setLoading] = useState(false);

  const hasPrice = interval === 'year' ? plan.hasAnnualPrice : plan.hasMonthlyPrice;

  async function handleClick() {
    if (loading) return;
    setLoading(true);

    try {
      const body: Record<string, unknown> = { planId: plan.id, interval };
      if (interval === 'year' && couponCode.trim()) {
        body.couponCode = couponCode.trim();
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push(`/auth/register?plan=${plan.id}`);
        return;
      }

      // User already has an active subscription — use the upgrade endpoint instead
      if (res.status === 409 && data.code === 'ALREADY_SUBSCRIBED') {
        const upgradeRes = await fetch('/api/me/subscription/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan.id, interval }),
        });
        const upgradeData = await upgradeRes.json().catch(() => ({}));
        if (upgradeRes.ok) {
          router.push('/app/account');
          return;
        }
        alert(upgradeData.message || 'Unable to change plan.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      alert(data.message || 'Unable to start checkout.');
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!hasPrice) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/40 cursor-not-allowed"
      >
        Not available {interval === 'year' ? 'annually' : 'monthly'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors disabled:opacity-50"
    >
      {loading ? 'Loading...' : `Subscribe ${interval === 'year' ? 'Annually' : 'Monthly'}`}
    </button>
  );
}
