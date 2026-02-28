// src/app/app/m/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wrench,
  FileText,
  ArrowLeft,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Plane,
  Cog,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import ModuleShortcutCard from '@/components/ModuleShortcutCard';
import { ROUTES } from '@/lib/routes';

export default function MMenuPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
            <Wrench className="h-3 w-3 text-white/90" />
            <span>Licence M — Airplane &amp; Helicopter</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            M — Home
          </h1>

          <p className="text-sm text-white/75 max-w-2xl">
            Jump straight into your study modules (STDP, Airframe, Powerplant,
            REGS) or open the TC-style logbook.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-white/15 bg-white/10 text-white hover:bg-white/15"
        >
          <Link href={ROUTES.appHub} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Primary actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Study hub (navigation) */}
        <Link href={ROUTES.mHub} className="block">
          <Card
            className="
              relative h-full overflow-hidden rounded-[30px]
              border-white/15 bg-white/10 backdrop-blur-md
              transition-all hover:bg-white/15 hover:shadow-md cursor-pointer
            "
          >
            {/* Readability overlay */}
            <div className="absolute inset-0 bg-black/25 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25 pointer-events-none" />

            <div className="relative">
              <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2 text-white">
                  <span className="h-8 w-8 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-white" />
                  </span>
                  M Hub
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-white/75">
                  Central place to navigate modules, practice, and run quizzes.
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-white/75">
                <ul className="list-disc pl-4 space-y-1">
                  <li>See what modules exist (available/locked)</li>
                  <li>Manage access in Student Area when needed</li>
                  <li>Open modules instantly when available</li>
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/15 bg-white/10 text-white hover:bg-white/15"
                  type="button"
                  tabIndex={-1}
                >
                  Open M Hub
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>

        {/* Logbook (paid module) */}
        <ModuleShortcutCard
          title="Logbook (M)"
          description="Maintenance experience logbook aligned with TC sample tasks."
          href={ROUTES.mLogbook}
          moduleKey="m.logbook"
          icon={<ClipboardList className="h-4 w-4 text-white" />}
        />
      </div>

      {/* Direct module shortcuts */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight text-white">
          Direct module shortcuts
        </h2>
        <p className="text-xs text-white/70">
          If you already know what you want, jump straight in.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <ModuleShortcutCard
            title="Standard Practices (STDP)"
            description="Hardware, tools, processes, measurements and best practices."
            href={ROUTES.mStandardPractices}
            moduleKey="m.standard-practices"
            icon={<Cog className="h-4 w-4 text-white" />}
          />

          <ModuleShortcutCard
            title="Airframe (AF)"
            description="Structures, flight controls, systems, and airframe maintenance topics."
            href={ROUTES.mAirframe}
            moduleKey="m.airframe"
            icon={<Plane className="h-4 w-4 text-white" />}
          />

          <ModuleShortcutCard
            title="Powerplant (PP)"
            description="Engines, fuel & lubrication systems, ignition, starting and performance."
            href={ROUTES.mPowerplant}
            moduleKey="m.powerplant"
            icon={<Wrench className="h-4 w-4 text-white" />}
          />

          <ModuleShortcutCard
            title="Regulatory Requirements (CARs / REGS)"
            description="Regulations & standards relevant to AME licensing and maintenance."
            href={ROUTES.regs}
            moduleKey="regs.core"
            icon={<ShieldCheck className="h-4 w-4 text-white" />}
          />
        </div>
      </section>

      {/* Small note */}
      <section>
        <Card className="relative overflow-hidden rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md">
          <div className="absolute inset-0 bg-black/25 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25 pointer-events-none" />
          <div className="relative">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-white">
                <span className="h-8 w-8 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </span>
                Study note
              </CardTitle>
              <CardDescription className="text-xs text-white/75">
                This platform is a supplement—not a replacement—for official references.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-white/75 space-y-2">
              <p>
                Many questions are inspired by real exam style, but you should
                always study the official Transport Canada materials for deeper
                understanding.
              </p>
              <p>
                Exam strategy: read the whole question, read all options,
                eliminate the most incorrect answers, then choose the best
                remaining option.
              </p>
            </CardContent>
          </div>
        </Card>
      </section>
    </div>
  );
}
