// src/app/app/m/hub/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Plane, Lock, Unlock } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import {
  getStudentState,
  hasModuleFromState,
  type StudentState,
} from '@/lib/entitlementsClient';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ModuleItem = {
  id: string;
  name: string;
  desc: string;
  href: string;
  moduleKey: string; // modelo novo only
};

export default function MHubPage() {
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<StudentState | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const s = await getStudentState();
      if (!alive) return;
      setStudent(s);
      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const modules: ModuleItem[] = [
    {
      id: 'stdp',
      name: 'Standard Practices (STDP)',
      desc: 'Safety, tools, corrosion, hardware, inspections, math and physics.',
      href: ROUTES.mStandardPractices,
      moduleKey: 'm.standard-practices',
    },
    {
      id: 'af',
      name: 'Airframe (AF)',
      desc: 'Structures, systems, controls, composites and rigging.',
      href: ROUTES.mAirframe,
      moduleKey: 'm.airframe',
    },
    {
      id: 'pp',
      name: 'Powerplant (PP)',
      desc: 'Engines, fuel, ignition, lubrication and operation.',
      href: ROUTES.mPowerplant,
      moduleKey: 'm.powerplant',
    },
    {
      id: 'regs',
      name: 'REGS – Regulatory Requirements',
      desc: 'CARs & Standards for AME licensing.',
      href: ROUTES.regs,
      moduleKey: 'regs.core',
    },
    {
      id: 'logbook',
      name: 'Logbook – Maintenance Experience',
      desc: 'Record tasks by ATA, aircraft and signatories.',
      href: ROUTES.mLogbook,
      moduleKey: 'm.logbook',
    },
  ];

  const hasModule = (key: string) => {
    if (!ready || !student) return false;
    return hasModuleFromState(student, key);
  };

  return (
    <div className="space-y-6">
      {/* Header (dark/glass friendly) */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white border border-white/15 backdrop-blur-md">
            <Plane className="h-3 w-3" />
            <span>M – Aircraft Maintenance Engineer</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            M – Study Modules
          </h1>
          <p className="text-sm text-white/70">
            Unlock modules individually as you need them.
          </p>
        </div>

        <Button
          asChild
          size="sm"
          className="border border-white/15 bg-white/10 text-white hover:bg-white/15"
          variant="outline"
        >
          <Link href={ROUTES.m} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Modules card (dark/glass) */}
      <Card className="relative overflow-hidden rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md">
        {/* overlays obrigatórios */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25 pointer-events-none" />

        <CardHeader className="relative">
          <CardTitle className="text-white">Modules</CardTitle>
          <CardDescription className="text-white/70">
            Choose a module below. Locked modules require unlock.
          </CardDescription>
        </CardHeader>

        <CardContent className="relative space-y-2">
          {modules.map((m) => {
            const unlocked = hasModule(m.moduleKey);

            return (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm text-white">{m.name}</p>
                  <p className="text-xs text-white/70">{m.desc}</p>
                </div>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  {/* Status badge */}
                  {!ready ? null : unlocked ? (
                    <Badge className="gap-1 border border-white/15 bg-white/10 text-white">
                      <Unlock className="h-3 w-3" />
                      Unlocked
                    </Badge>
                  ) : (
                    <Badge className="gap-1 border border-white/15 bg-transparent text-white/90">
                      <Lock className="h-3 w-3" />
                      Locked
                    </Badge>
                  )}

                  {/* Action button */}
                  {unlocked ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border border-white/15 bg-white/10 text-white hover:bg-white/15"
                    >
                      <Link href={m.href} className="flex items-center">
                        Open <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="sm"
                      className="border border-white/15 bg-black/70 text-white hover:bg-black/60"
                    >
                      <Link href={ROUTES.student} className="flex items-center">
                        Unlock <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
