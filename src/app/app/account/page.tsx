'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CreditCard, ShieldCheck, RefreshCw } from 'lucide-react';

import { getAppDictionary, getAppLocaleFromPathname } from '@/lib/i18n/app';
import { ROUTES } from '@/lib/routes';
import { getStudentState, type StudentState } from '@/lib/entitlementsClient';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MyAccountPage() {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const dictionary = getAppDictionary(locale);
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<StudentState | null>(null);

  async function refresh() {
    const s = await getStudentState({ force: true });
    setStudent(s);
    setReady(true);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enrolledCount = student?.enrollmentSummary?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
            {dictionary.shell.profile}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {dictionary.account.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {dictionary.account.description}
            </p>
          </div>
        </div>

        <Button
          onClick={refresh}
          variant="outline"
          size="sm"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          disabled={!ready}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {dictionary.account.refresh}
        </Button>
      </div>

      <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <CreditCard className="h-5 w-5 text-[#2d4bb3]" />
              My Account
            </CardTitle>
            <CardDescription className="text-slate-500">
              This page is the long-term home for billing, plans and usage limits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-slate-200 bg-slate-50 text-slate-700" variant="outline">
                {dictionary.account.entitlements}: <span className="ml-1 font-semibold">{ready ? enrolledCount : '…'}</span>
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-[26px] border-slate-200 bg-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900">{dictionary.account.basicTitle}</CardTitle>
                  <CardDescription className="text-slate-500">{dictionary.account.basicDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-500">
                  <p>{dictionary.account.basicCopy}</p>
                  <p className="text-xs text-slate-400">{dictionary.account.basicHint}</p>
                </CardContent>
              </Card>

              <Card className="rounded-[26px] border-slate-200 bg-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900">{dictionary.account.standardTitle}</CardTitle>
                  <CardDescription className="text-slate-500">{dictionary.account.standardDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-500">
                  <p>{dictionary.account.standardCopy}</p>
                  <p className="text-xs text-slate-400">{dictionary.account.standardHint}</p>
                </CardContent>
              </Card>

              <Card className="rounded-[26px] border-slate-200 bg-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900">{dictionary.account.premiumTitle}</CardTitle>
                  <CardDescription className="text-slate-500">{dictionary.account.premiumDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-500">
                  <p>{dictionary.account.premiumCopy}</p>
                  <p className="text-xs text-slate-400">{dictionary.account.premiumHint}</p>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-medium text-slate-900">
                <ShieldCheck className="h-4 w-4 text-[#2d4bb3]" />
                {dictionary.account.roadmap}
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-500">
                {dictionary.account.roadmapItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-slate-400">
              {dictionary.account.note}
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
