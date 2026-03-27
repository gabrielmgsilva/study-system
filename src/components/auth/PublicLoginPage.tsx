'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, Mail, Plane, User, ArrowRight, Loader2 } from 'lucide-react';
import { Sora } from 'next/font/google';

import type { LandingLocale } from '@/lib/i18n/landing';
import { getAuthDictionary } from '@/lib/i18n/auth';
import { localizeAppHref } from '@/lib/i18n/app';
import type { AuthRole } from '@/lib/jwt';
import { getDefaultPrivateRouteForRole, isRoleCompatibleRedirect } from '@/lib/authz';
import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

function LoginPageContent({ locale }: { locale: LandingLocale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dictionary = getAuthDictionary(locale);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resolvePostLoginPath(role: AuthRole, nextPath: string | null) {
    if (nextPath && isRoleCompatibleRedirect(role, nextPath)) {
      return nextPath;
    }

    return localizeAppHref(getDefaultPrivateRouteForRole(role), locale);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError(dictionary.login.validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? dictionary.login.invalidCredentials);
      return;
    }

    const data = await res.json().catch(() => null);

    if (rememberMe) {
      window.localStorage.setItem('ameone.rememberEmail', cleanEmail);
    } else {
      window.localStorage.removeItem('ameone.rememberEmail');
    }

    const next = searchParams?.get('next');
    const role = data?.user?.role === 'admin' ? 'admin' : 'user';
    router.push(resolvePostLoginPath(role, next));
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
            <CardTitle className="text-[1.1rem] text-slate-900">{dictionary.login.cardTitle}</CardTitle>
            <CardDescription className="pt-1 text-[13px] leading-6 text-slate-500">
              {dictionary.login.cardDescription}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-slate-600">{dictionary.login.emailLabel}</Label>
                <div className="relative">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    type="email"
                    autoComplete="email"
                    placeholder={dictionary.login.emailPlaceholder}
                    className="h-10 rounded-lg border-slate-200 bg-white pr-10 text-sm text-slate-700 placeholder:text-slate-400"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    {email.includes('@') ? <Mail className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-slate-600">{dictionary.login.passwordLabel}</Label>
                <div className="relative">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    placeholder={dictionary.login.passwordPlaceholder}
                    className="h-10 rounded-lg border-slate-200 bg-white pr-10 text-sm text-slate-700 placeholder:text-slate-400"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-[12px] text-slate-600">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={loading}
                    className="border-slate-300 data-[state=checked]:bg-[#2d4bb3] data-[state=checked]:border-[#2d4bb3]"
                  />
                  <span>{dictionary.login.rememberMe}</span>
                </label>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button
                className="h-10 w-full rounded-lg bg-[#2d4bb3] text-sm font-semibold text-white hover:bg-[#243d99]"
                disabled={loading}
                aria-label={loading ? dictionary.login.submitting : dictionary.login.submit}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {dictionary.login.submit}
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
          <p>{dictionary.login.footerLead}</p>
          <Link href={ROUTES.pricing} className="mt-2 block font-semibold text-[#2d4bb3] hover:text-[#22398a]">
            {dictionary.login.footerCta}
          </Link>
          <p className="mx-auto mt-2 max-w-[260px] text-[12px] leading-5 text-slate-500">
            {dictionary.login.legalPrefix}{' '}
            <Link href={ROUTES.terms} className="font-medium text-[#2d4bb3] hover:text-[#22398a]">
              {dictionary.legal.terms}
            </Link>{' '}
            {dictionary.login.legalAnd}{' '}
            <Link href={ROUTES.privacy} className="font-medium text-[#2d4bb3] hover:text-[#22398a]">
              {dictionary.legal.privacy}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function PublicLoginPage({ locale }: { locale: LandingLocale }) {
  return (
    <Suspense fallback={null}>
      <LoginPageContent locale={locale} />
    </Suspense>
  );
}