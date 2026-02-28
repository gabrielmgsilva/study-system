'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Radio, ArrowRight, BookOpen } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { ROUTES } from '@/lib/routes';

type HubItem = {
  id: string;
  name: string;
  desc: string;
  href: string;
};

export default function EHubPage() {
  const items: HubItem[] = [
    {
      id: 'sp',
      name: 'Standard Practices – Avionics',
      desc: 'Science & math, wiring practices, hardware, tools, electricity/electronics, corrosion and NDT.',
      href: ROUTES.eStandardPractices,
    },
    {
      id: 'rating',
      name: 'E Rating – Avionics (Systems & Theory)',
      desc: 'Communication, navigation, surveillance, autopilot, instruments, power distribution and troubleshooting.',
      href: ROUTES.eRatingAvionics,
    },
  ];

  const glassCard =
    'relative overflow-hidden rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md';
  const outlineBtn =
    'border-white/15 bg-white/10 text-white hover:bg-white/15';
  const glassOverlays = (
    <>
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25 pointer-events-none" />
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
            <Radio className="h-3 w-3 text-white/90" />
            <span>Licence E – Avionics</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            E Hub (Module chooser)
          </h1>

          <p className="text-sm text-white/75 max-w-2xl">
            Choose what you want to study first.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className={outlineBtn}>
          <Link href={ROUTES.e} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Hub options */}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <Link key={it.id} href={it.href} className="block">
            <Card
              className={[
                glassCard,
                'h-full transition-all hover:bg-white/15 hover:shadow-md cursor-pointer',
              ].join(' ')}
            >
              {glassOverlays}
              <div className="relative">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg flex items-center gap-2 text-white">
                    <span className="h-8 w-8 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-white" />
                    </span>
                    {it.name}
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm text-white/75">
                    {it.desc}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-xs text-white/75">
                  Practice, flashcards and test mode using the same AdvancedEngine
                  workflow.
                </CardContent>

                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className={'w-full ' + outlineBtn}
                    type="button"
                    tabIndex={-1}
                  >
                    Open <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
