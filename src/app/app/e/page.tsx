'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Radio, BookOpen, ClipboardList, FileText } from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EMenuPage() {
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
            E – Licence Home
          </h1>

          <p className="text-sm text-white/75 max-w-2xl">
            Access your E-rating study modules or open the TC-style avionics
            logbook.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className={outlineBtn}>
          <Link href={ROUTES.appHome} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Top cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* E Hub */}
        <Link href={ROUTES.eHub} className="block">
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
                  E Hub (Module chooser)
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-white/75">
                  Choose between Standard Practices and Avionics Systems.
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-white/75">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Standard Practices – Avionics</li>
                  <li>E Rating – Avionics Systems &amp; Theory</li>
                  <li>Flashcards, Practice, and Test mode</li>
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className={'w-full ' + outlineBtn}
                >
                  Open E Hub
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>

        {/* Logbook */}
        <Link href={ROUTES.eLogbook} className="block">
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
                    <ClipboardList className="h-4 w-4 text-white" />
                  </span>
                  E Logbook
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-white/75">
                  TC-style experience logbook for the E rating.
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-white/75">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Official TC sample tasks</li>
                  <li>Signatory management</li>
                  <li>Print / export ready</li>
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className={'w-full ' + outlineBtn}
                >
                  Open Logbook
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>
      </div>

      {/* Study note */}
      <Card className={glassCard}>
        {glassOverlays}
        <div className="relative">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <span className="h-8 w-8 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </span>
              Study note
            </CardTitle>
            <CardDescription className="text-xs text-white/75">
              Always rely on official Transport Canada references.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm text-white/75">
            <p>
              AME ONE is a supplement—not a replacement—for official material.
              Use it to reinforce concepts and exam technique.
            </p>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="font-semibold text-white/90 mb-1">Exam strategy</p>
              <p className="text-white/75">
                Read carefully, eliminate wrong answers, then select the best
                remaining option.
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
