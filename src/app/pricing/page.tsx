import Link from 'next/link';
import { ArrowRight, Check, Minus, Zap } from 'lucide-react';

import { getPublicPlans, type PublicPlan } from '@/lib/publicPlans';
import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassPanel } from '@/components/ui/glass';
import { SubscribeButton, CouponInput } from '@/components/PricingClient';
import { PricingIntervalProvider, PricingIntervalToggle } from '@/components/PricingIntervalClient';
import { PriceDisplayClient } from '@/components/PricingPriceDisplay';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Feature comparison matrix
// ---------------------------------------------------------------------------
type FeatureRow = {
  label: string;
  free: string | boolean;
  student: string | boolean;
  pro: string | boolean;
};

const FEATURES: FeatureRow[] = [
  { label: 'REGS (CARs + Standards)',  free: 'Unlimited', student: 'Unlimited', pro: 'Unlimited' },
  { label: 'Certification tracks',     free: 'None',       student: '1',         pro: 'Up to 2'   },
  { label: 'Flashcards',               free: '3 / day',    student: 'Unlimited', pro: 'Unlimited' },
  { label: 'Practice mode',            free: false,        student: 'Unlimited', pro: 'Unlimited' },
  { label: 'Mock tests',               free: false,        student: '3 / week',  pro: 'Unlimited' },
  { label: 'Logbook',                  free: false,        student: false,        pro: true        },
  { label: '7-day free trial',         free: false,        student: false,        pro: true        },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function FeatureValue({ value }: { value: string | boolean }) {
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-white/25" />;
  }
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-emerald-400" />;
  }
  return <span className="text-sm text-white/85">{value}</span>;
}

function planFeatures(slug: 'student' | 'pro') {
  return FEATURES.filter((f) => f[slug] !== false);
}

// ---------------------------------------------------------------------------
// Free tier card (synthetic — no DB plan)
// ---------------------------------------------------------------------------
function FreePlanCard() {
  return (
    <GlassCard>
      <div className="p-6 flex flex-col gap-5 h-full">
        <div className="space-y-1">
          <span className="text-lg font-semibold text-white">Free</span>
          <p className="text-sm text-white/60">
            Explore the platform with REGS content and limited flashcards. No credit card required.
          </p>
        </div>

        <div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-white">$0</span>
            <span className="mb-1 text-sm text-white/50">/ month</span>
          </div>
          <p className="text-xs text-white/45">Always free</p>
        </div>

        <Button
          asChild
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        >
          <Link href={ROUTES.register}>
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <ul className="space-y-2">
          {FEATURES.filter((f) => f.free !== false).map((f) => (
            <li key={f.label} className="flex items-start gap-2 text-sm text-white/75">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
              <span>
                <span className="font-medium text-white/90">{f.label}</span>
                {typeof f.free === 'string' && ` — ${f.free}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Paid plan card (Student / Pro)
// ---------------------------------------------------------------------------
function PaidPlanCard({ plan, featured }: { plan: PublicPlan; featured?: boolean }) {
  const slug = plan.slug as 'student' | 'pro';

  return (
    <GlassCard className={featured ? 'ring-2 ring-white/25' : ''}>
      <div className="p-6 flex flex-col gap-5 h-full">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-white">{plan.name}</span>
            {featured && (
              <Badge className="border-white/20 bg-white/15 text-white text-[11px] font-semibold">
                <Zap className="mr-1 h-3 w-3" />
                Most Popular
              </Badge>
            )}
          </div>
          <p className="text-sm text-white/60">{plan.description}</p>
        </div>

        {/* Price — reactive to interval toggle */}
        <PriceDisplayClient plan={plan} />

        <SubscribeButton plan={plan} />

        <ul className="space-y-2">
          {planFeatures(slug).map((f) => {
            const val = f[slug];
            return (
              <li key={f.label} className="flex items-start gap-2 text-sm text-white/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  <span className="font-medium text-white/90">{f.label}</span>
                  {typeof val === 'string' && ` — ${val}`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Comparison table (server-rendered)
// ---------------------------------------------------------------------------
function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="py-3 text-left text-white/50 font-medium w-1/2">Feature</th>
            <th className="py-3 text-center text-white/50 font-medium">Free</th>
            <th className="py-3 text-center text-white/50 font-medium">Student</th>
            <th className="py-3 text-center text-white font-semibold">Pro</th>
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((row, i) => (
            <tr
              key={row.label}
              className={`border-b border-white/[0.06] ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
            >
              <td className="py-3 text-white/75">{row.label}</td>
              <td className="py-3 text-center"><FeatureValue value={row.free} /></td>
              <td className="py-3 text-center"><FeatureValue value={row.student} /></td>
              <td className="py-3 text-center"><FeatureValue value={row.pro} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function PricingPage() {
  const plans = await getPublicPlans();
  const studentPlan = plans.find((p) => p.slug === 'student') ?? null;
  const proPlan = plans.find((p) => p.slug === 'pro') ?? null;

  return (
    <PricingIntervalProvider>
      <div className="min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <GlassPanel className="p-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
              <Zap className="h-3.5 w-3.5" />
              Start with a 7-day free Pro trial — no card needed
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Simple, transparent pricing
            </h1>
            <p className="text-white/65 max-w-xl mx-auto text-sm md:text-base">
              Begin for free with REGS access. Upgrade anytime to unlock certification tracks, practice, and tests.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <PricingIntervalToggle />
              <CouponInput />
            </div>
          </GlassPanel>

          {/* ── Plan cards ─────────────────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-3 md:items-start">
            <FreePlanCard />
            {studentPlan ? (
              <PaidPlanCard plan={studentPlan} />
            ) : (
              <GlassCard>
                <div className="p-6 text-sm text-white/40">Student plan coming soon.</div>
              </GlassCard>
            )}
            {proPlan ? (
              <PaidPlanCard plan={proPlan} featured />
            ) : (
              <GlassCard>
                <div className="p-6 text-sm text-white/40">Pro plan coming soon.</div>
              </GlassCard>
            )}
          </div>

          {/* ── Feature comparison ─────────────────────────────────────── */}
          <GlassPanel className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Compare all features</h2>
            <ComparisonTable />
          </GlassPanel>

          {/* ── FAQ ────────────────────────────────────────────────────── */}
          <GlassPanel className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  q: 'Do I need a credit card to start?',
                  a: 'No. Create a free account and get 7 days of Pro access without entering any payment details.',
                },
                {
                  q: 'What happens after the trial?',
                  a: 'You continue on the Free tier automatically — REGS stays accessible. Upgrade when you are ready to study for your licence.',
                },
                {
                  q: 'Can I switch plans later?',
                  a: 'Yes. You can upgrade from Student to Pro at any time with prorated billing, or manage everything through the billing portal.',
                },
                {
                  q: 'Is REGS always free?',
                  a: 'Yes. CARs and Standards content is free for every account, forever — because every AME candidate needs regulatory knowledge.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="space-y-1">
                  <div className="text-white text-sm font-medium">{q}</div>
                  <p className="text-sm text-white/60">{a}</p>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* ── Footer links ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between text-sm text-white/55">
            <Link className="hover:text-white transition-colors" href={ROUTES.landing}>
              ← Back to home
            </Link>
            <div className="flex items-center gap-4">
              <Link className="hover:text-white transition-colors" href={ROUTES.terms}>Terms</Link>
              <Link className="hover:text-white transition-colors" href={ROUTES.privacy}>Privacy</Link>
            </div>
          </div>

        </div>
      </div>
    </PricingIntervalProvider>
  );
}
