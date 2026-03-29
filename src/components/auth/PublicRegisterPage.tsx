'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, Mail, Plane, User, Loader2, Check } from 'lucide-react';
import { Sora } from 'next/font/google';

import type { LandingLocale } from '@/lib/i18n/landing';
import { getAuthDictionary } from '@/lib/i18n/auth';
import { localizeAppHref } from '@/lib/i18n/app';
import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

type PlanOption = {
  id: number;
  name: string;
  price: string | null;
  trialDays: number;
};

export function PublicRegisterPage({ locale }: { locale: LandingLocale }) {
  const router = useRouter();
  const dictionary = getAuthDictionary(locale);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.items)) {
          setPlans(
            data.items.map((p: { id: number; name: string; price: string | null; trialDays: number }) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              trialDays: p.trialDays,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const cleanName = name.trim().replace(/\s+/g, ' ');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !password) {
      setError(dictionary.register.validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        password,
        planId: selectedPlanId,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? dictionary.register.invalidError);
      return;
    }

    router.push(localizeAppHref(ROUTES.appOnboarding, locale));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-[560px]">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d4bb3] text-white shadow-[0_12px_25px_rgba(45,75,179,0.22)]">
            <Plane className="h-5 w-5" />
          </div>
          <h1 className={`${sora.className} mt-5 text-4xl font-semibold tracking-tight text-slate-900`}>
            {dictionary.brand.title}
          </h1>
          <p className="mt-2 text-base text-slate-500">{dictionary.brand.subtitle}</p>
        </div>

        <Card className="mx-auto w-full max-w-[315px] rounded-[18px] border-slate-200 bg-white py-0 shadow-[0_16px_40px_rgba(15,23,42,0.10)] sm:max-w-[355px]">
          <CardHeader className="px-5 pt-6 sm:px-6 sm:pt-6">
            <CardTitle className="text-[1.1rem] text-slate-900">{dictionary.register.cardTitle}</CardTitle>
            <CardDescription className="pt-1 text-[13px] leading-6 text-slate-500">
              {dictionary.register.cardDescription}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-slate-600">{dictionary.register.nameLabel}</Label>
                <div className="relative">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    autoComplete="name"
                    placeholder={dictionary.register.namePlaceholder}
                    className="h-10 rounded-lg border-slate-200 bg-white pr-10 text-sm text-slate-700 placeholder:text-slate-400"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-slate-600">{dictionary.register.emailLabel}</Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                    placeholder={dictionary.register.emailPlaceholder}
                    className="h-10 rounded-lg border-slate-200 bg-white pr-10 text-sm text-slate-700 placeholder:text-slate-400"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-slate-600">{dictionary.register.passwordLabel}</Label>
                <div className="relative">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                    placeholder={dictionary.register.passwordPlaceholder}
                    className="h-10 rounded-lg border-slate-200 bg-white pr-10 text-sm text-slate-700 placeholder:text-slate-400"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-[11px] leading-5 text-slate-400">{dictionary.register.passwordHint}</p>
              </div>

              {plans.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[12px] font-semibold text-slate-600">Choose your plan</Label>
                  <div className="space-y-1.5">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          selectedPlanId === plan.id
                            ? 'border-[#2d4bb3] bg-[#2d4bb3]/5 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                              selectedPlanId === plan.id
                                ? 'border-[#2d4bb3] bg-[#2d4bb3]'
                                : 'border-slate-300'
                            }`}
                          >
                            {selectedPlanId === plan.id && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <span className="font-medium">{plan.name}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {plan.trialDays} day free trial
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button
                className="h-10 w-full rounded-lg bg-[#2d4bb3] text-sm font-semibold text-white hover:bg-[#243d99]"
                disabled={loading}
                aria-label={loading ? dictionary.register.submitting : dictionary.register.submit}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {dictionary.register.submit}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="border-t border-slate-200 pt-4 text-center">
                <p className="text-[11px] text-slate-400">{dictionary.categoriesLabel}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  {dictionary.categories.map((category) => (
                    <span
                      key={category.label}
                      className={`rounded-md px-2 py-1 text-[10px] font-semibold ${category.className}`}
                    >
                      {category.label}
                    </span>
                  ))}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-5 text-center text-sm text-slate-500">
          <p>{dictionary.register.footerLead}</p>
          <Link href={ROUTES.localizedLogin(locale)} className="mt-2 block font-semibold text-[#2d4bb3] hover:text-[#22398a]">
            {dictionary.register.footerCta}
          </Link>
          <p className="mx-auto mt-2 max-w-[260px] text-[12px] leading-5 text-slate-500">
            {dictionary.register.legalPrefix}{' '}
            <Link href={ROUTES.terms} className="font-medium text-[#2d4bb3] hover:text-[#22398a]">
              {dictionary.legal.terms}
            </Link>{' '}
            {dictionary.register.legalAnd}{' '}
            <Link href={ROUTES.privacy} className="font-medium text-[#2d4bb3] hover:text-[#22398a]">
              {dictionary.legal.privacy}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}