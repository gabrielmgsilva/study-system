'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Sparkles } from 'lucide-react';

import type { PublicPlan } from '@/lib/publicPlans';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type PlanWithFeatured = PublicPlan & { isFeatured: boolean };

function formatPrice(plan: PublicPlan, interval: 'month' | 'year') {
  if (!plan.price) return null;
  const monthly = parseFloat(plan.price);
  if (interval === 'year') {
    const annual = plan.priceAnnual ? Number(plan.priceAnnual) : null;
    if (annual != null && Number.isFinite(annual)) {
      return `$${annual.toFixed(0)}`;
    }
    return `$${(monthly * 12).toFixed(0)}`;
  }
  return `$${monthly.toFixed(0)}`;
}

function formatFeatures(plan: PublicPlan): string[] {
  const features: string[] = [];

  if (plan.maxLicenses > 0) {
    features.push(
      `${plan.maxLicenses} certification${plan.maxLicenses > 1 ? 's' : ''}`,
    );
  }

  if (plan.flashcardsLimit > 0) {
    features.push(
      `${plan.flashcardsLimit} flashcards/${plan.flashcardsUnit}`,
    );
  }

  if (plan.practiceLimit > 0) {
    features.push(
      `${plan.practiceLimit} practice questions/${plan.practiceUnit}`,
    );
  }

  if (plan.testsLimit > 0) {
    features.push(`${plan.testsLimit} tests/${plan.testsUnit}`);
  }

  if (plan.maxQuestionsPerSession) {
    features.push(`${plan.maxQuestionsPerSession} questions per session`);
  }

  if (plan.logbookAccess) {
    features.push('Logbook access');
  }

  return features;
}

export function PlanSelector({ plans }: { plans: PlanWithFeatured[] }) {
  const router = useRouter();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);

  async function handleSubscribe(plan: PlanWithFeatured) {
    if (loadingPlanId) return;
    setLoadingPlanId(plan.id);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, interval }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push(`/auth/register?plan=${plan.id}`);
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
      setLoadingPlanId(null);
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Choose Your Plan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start with a free trial. Cancel anytime.
          </p>
        </div>

        {/* Interval toggle — sticky on mobile */}
        <div className="sticky top-0 z-10 -mx-4 mb-6 flex justify-center bg-background/80 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
          <div className="inline-flex items-center rounded-full border bg-muted p-1">
            <button
              type="button"
              onClick={() => setInterval('month')}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                interval === 'month'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval('year')}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                interval === 'year'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Annual
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const hasPrice =
              interval === 'year' ? plan.hasAnnualPrice : plan.hasMonthlyPrice;
            const price = formatPrice(plan, interval);
            const features = formatFeatures(plan);
            const isLoading = loadingPlanId === plan.id;

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative flex flex-col',
                  plan.isFeatured && 'border-primary shadow-md',
                )}
              >
                {plan.isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1">
                      <Sparkles className="size-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  {/* Price */}
                  <div className="mb-4">
                    {price ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{price}</span>
                        <span className="text-sm text-muted-foreground">
                          /{interval === 'year' ? 'year' : 'month'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold">Free</span>
                    )}
                    {plan.trialDays > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {plan.trialDays}-day free trial
                      </Badge>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="h-12 w-full text-base"
                    variant={plan.isFeatured ? 'default' : 'outline'}
                    disabled={!hasPrice || !!loadingPlanId}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading…
                      </>
                    ) : !hasPrice ? (
                      `Not available ${interval === 'year' ? 'annually' : 'monthly'}`
                    ) : (
                      'Get Started'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
