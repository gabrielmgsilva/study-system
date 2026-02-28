'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, ShieldCheck, RefreshCw } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { getStudentState, type StudentState } from '@/lib/entitlementsClient';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MyAccountPage() {
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

  const credits = student?.credits ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-white/15 bg-white/10 text-white hover:bg-white/15"
        >
          <Link href={ROUTES.appHome} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>

        <Button
          onClick={refresh}
          variant="outline"
          size="sm"
          className="border-white/15 bg-white/10 text-white hover:bg-white/15"
          disabled={!ready}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="relative overflow-hidden rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md">
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25 pointer-events-none" />
        <div className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5" />
              My Account
            </CardTitle>
            <CardDescription className="text-white/70">
              This page is the long-term home for billing, plans and usage limits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-white/15 bg-white/10 text-white" variant="outline">
                Credits (dev): <span className="ml-1 font-semibold">{ready ? credits : '…'}</span>
              </Badge>
              <Badge className="border-white/15 bg-white/10 text-white" variant="outline">
                Entitlements: <span className="ml-1 font-semibold">{ready ? (student?.entitlements?.length ?? 0) : '…'}</span>
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-[26px] border-white/15 bg-black/25">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">BASIC</CardTitle>
                  <CardDescription className="text-white/70">Explore & Start</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-white/75 space-y-2">
                  <p>Daily limits (Flashcards / Practice cooldown / Tests weekly).</p>
                  <p className="text-white/60 text-xs">Coming soon: plan enforcement.</p>
                </CardContent>
              </Card>

              <Card className="rounded-[26px] border-white/15 bg-black/25">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">STANDARD</CardTitle>
                  <CardDescription className="text-white/70">Serious Study</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-white/75 space-y-2">
                  <p>Practice unlimited, higher flashcard limit, tests 2–3/week.</p>
                  <p className="text-white/60 text-xs">Coming soon: checkout + license selection.</p>
                </CardContent>
              </Card>

              <Card className="rounded-[26px] border-white/15 bg-black/25">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">PREMIUM</CardTitle>
                  <CardDescription className="text-white/70">Exam & Career</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-white/75 space-y-2">
                  <p>Unlimited tests + Logbook included.</p>
                  <p className="text-white/60 text-xs">Coming soon: Logbook add-on & priority modules.</p>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-white font-medium">
                <ShieldCheck className="h-4 w-4" />
                Roadmap (no migration later)
              </div>
              <ul className="mt-2 text-sm text-white/70 list-disc pl-5 space-y-1">
                <li>Billing + plans per licence (M / E / S / Balloons) + REGS as global.</li>
                <li>Usage limits: daily flashcards, practice cooldown, tests per week.</li>
                <li>Logbook as add-on OR included in PREMIUM.</li>
                <li>Admin tools to grant entitlements for testing.</li>
              </ul>
            </div>

            <div className="text-xs text-white/55">
              For now, module unlock still uses credits while the subscription model is being finalized.
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
