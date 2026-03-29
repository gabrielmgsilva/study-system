import Link from 'next/link';
import {
  getPublicPlanDisplayDescription,
  getPublicPlanSectionId,
  isFeaturedPublicPlan,
  type PublicPlanSectionId,
} from '@/lib/publicPlanPresentation';
import {
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

import { getPublicPlans, type PublicPlan } from '@/lib/publicPlans';
import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassPanel } from '@/components/ui/glass';
import { SubscribeButton, CouponInput } from '@/components/PricingClient';
import { PricingIntervalProvider, PricingIntervalToggle } from '@/components/PricingIntervalClient';

export const dynamic = 'force-dynamic';

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm text-white/85">
      <Check className="h-4 w-4 text-white/85 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function formatPrice(price: string | null) {
  if (!price) return 'Custom';

  const amount = Number(price);
  if (!Number.isFinite(amount)) return price;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatUsageLimit(limit: number, unit: PublicPlan['flashcardsUnit']) {
  if (limit < 0) return 'Unlimited';
  if (limit === 0) return 'Not included';

  const period = limit === 1 ? unit : `${unit}s`;
  return `${limit} per ${period}`;
}

function formatCertificationLimit(maxLicenses: number) {
  if (maxLicenses < 0) return 'Unlimited certification tracks';
  if (maxLicenses === 0) return 'No certification tracks';
  if (maxLicenses === 1) return '1 certification track';
  return `${maxLicenses} certification tracks`;
}

function Plan({
  plan,
  features,
}: {
  plan: PublicPlan;
  features: string[];
}) {
  return (
    <GlassCard>
      <div className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-semibold text-lg">{plan.name}</div>
            <div className="text-white/70 text-sm">
              {getPublicPlanDisplayDescription(plan) || 'Dynamic plan with configurable study limits and enrollment capacity.'}
            </div>
          </div>
          <Badge className="border-white/18 bg-white/10 text-white" variant="outline">
            {formatPrice(plan.price)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-white/75">
          <span className="rounded-full border border-white/12 bg-white/10 px-2.5 py-1">
            {formatCertificationLimit(plan.maxLicenses)}
          </span>
          <span className="rounded-full border border-white/12 bg-white/10 px-2.5 py-1">
            {plan.logbookAccess ? 'Logbook included' : 'No logbook'}
          </span>
          <span className="rounded-full border border-white/12 bg-white/10 px-2.5 py-1">
            {plan.trialDays} day free trial
          </span>
        </div>
        <div className="space-y-2">
          {features.map((f) => (
            <Feature key={f}>{f}</Feature>
          ))}
        </div>
        <SubscribeButton plan={plan} />
      </div>
    </GlassCard>
  );
}

function planFeatures(plan: PublicPlan) {
  return [
    `Flashcards: ${formatUsageLimit(plan.flashcardsLimit, plan.flashcardsUnit)}`,
    `Practice: ${formatUsageLimit(plan.practiceLimit, plan.practiceUnit)}`,
    `Tests: ${formatUsageLimit(plan.testsLimit, plan.testsUnit)}`,
    plan.maxQuestionsPerSession
      ? `Session cap: ${plan.maxQuestionsPerSession} questions`
      : 'Session cap: no per-session limit',
  ];
}

const planSections: Array<{
  id: PublicPlanSectionId;
  eyebrow: string;
  title: string;
  description: string;
}> = [
  {
    id: 'regs',
    eyebrow: 'Regulatory access',
    title: 'REGS',
    description: 'Standalone regulatory study plans for CARs and Standards. These plans do not open certification tracks.',
  },
  {
    id: 'licenses',
    eyebrow: 'Certification study',
    title: 'Licences',
    description: 'Study plans for M, E, S, and Balloons with clear caps for certification enrollment and usage.',
  },
  {
    id: 'logbook',
    eyebrow: 'Professional records',
    title: 'Logbook',
    description: 'Professional logbook access for one enrolled certification track without study volume included.',
  },
];

function sectionGridClass(count: number) {
  if (count >= 3) return 'lg:grid-cols-3';
  if (count === 2) return 'md:grid-cols-2';
  return 'grid-cols-1';
}

export default async function PricingPage() {
  const plans = await getPublicPlans();
  const groupedPlans = planSections.map((section) => ({
    ...section,
    plans: plans.filter((plan) => getPublicPlanSectionId(plan) === section.id),
  }));

  return (
    <PricingIntervalProvider>
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <GlassPanel className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                <ShieldCheck className="h-4 w-4" />
                Dynamic plans with enrollment caps
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Choose the plan that controls your study limits and certification capacity.
              </h1>
              <p className="text-white/75 max-w-2xl">
                Each plan defines how many certification tracks you can enroll in, how much study volume is available in each period,
                and whether logbook access is included. REGS does not consume certification slots from your plan.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <PricingIntervalToggle />
                <CouponInput />
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild className="rounded-2xl">
                <Link href={ROUTES.register}>
                  Create account <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-2xl border-white/15 bg-white/10 text-white hover:bg-white/15">
                <Link href={ROUTES.login}>Sign in</Link>
              </Button>
            </div>
          </div>
        </GlassPanel>

        {plans.length === 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="p-6 lg:col-span-3">
              <div className="space-y-2">
                <div className="text-lg font-semibold text-white">No public plans available</div>
                <p className="max-w-2xl text-sm text-white/75">
                  There are no active plans published right now. Return later or contact the team if you need access.
                </p>
              </div>
            </GlassCard>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedPlans.map((section) => (
              section.plans.length > 0 ? (
                <section key={section.id} className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">{section.eyebrow}</div>
                      <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                      <p className="max-w-3xl text-sm text-white/75">{section.description}</p>
                    </div>
                    <div className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs text-white/70">
                      {section.plans.length} active {section.plans.length === 1 ? 'plan' : 'plans'}
                    </div>
                  </div>

                  <div className={`grid gap-4 ${sectionGridClass(section.plans.length)}`}>
                    {section.plans.map((plan) => (
                      <div key={plan.id} className={isFeaturedPublicPlan(plan) ? 'lg:-translate-y-2' : ''}>
                        <Plan plan={plan} features={planFeatures(plan)} />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null
            ))}
          </div>
        )}

        <GlassPanel className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-white font-semibold">How enrollment works</div>
              <p className="text-sm text-white/75">
                Your plan does not lock you to a single certification. It defines how many tracks you can enroll in at the same time,
                so you can move between M, E, S, or Balloons within the configured limit.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-white font-semibold">REGS does not count toward the cap</div>
              <p className="text-sm text-white/75">
                When your account has REGS enrollment, it does not consume one of the certification slots from your plan. The cap only
                applies to active certification tracks such as M, E, S, or Balloons.
              </p>
            </div>
          </div>
        </GlassPanel>

        <div className="flex items-center justify-between text-sm text-white/70">
          <Link className="hover:text-white" href={ROUTES.landing}>
            ← Back to home
          </Link>
          <div className="flex items-center gap-4">
            <Link className="hover:text-white" href={ROUTES.terms}>Terms</Link>
            <Link className="hover:text-white" href={ROUTES.privacy}>Privacy</Link>
          </div>
        </div>
      </div>
    </div>
    </PricingIntervalProvider>
  );
}
