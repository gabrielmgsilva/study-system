// src/app/app/m/hub/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Plane, Lock, Unlock } from 'lucide-react';

import { getAppLocaleFromPathname, localizeAppHref } from '@/lib/i18n/app';
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
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const isPt = locale === 'pt';
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
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <Plane className="h-3 w-3 text-[#2d4bb3]" />
            <span>{isPt ? 'M — Mecânico de Manutenção de Aeronaves' : 'M – Aircraft Maintenance Engineer'}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {isPt ? 'M — Módulos de estudo' : 'M – Study Modules'}
          </h1>
          <p className="text-sm text-slate-500">
            {isPt ? 'Libere módulos individualmente conforme necessário.' : 'Unlock modules individually as you need them.'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {isPt ? 'Módulos' : 'Modules'}
          </div>
          <div className="text-3xl font-semibold leading-none text-[#2d4bb3]">5</div>
        </div>
      </div>

      <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <CardTitle className="text-slate-900">{isPt ? 'Módulos' : 'Modules'}</CardTitle>
          <CardDescription className="text-slate-500">
            {isPt
              ? 'Escolha um módulo abaixo. Módulos bloqueados exigem liberação.'
              : 'Choose a module below. Locked modules require unlock.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          {modules.map((m) => {
            const unlocked = hasModule(m.moduleKey);

            return (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                </div>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  {!ready ? null : unlocked ? (
                    <Badge className="gap-1 border border-emerald-200 bg-emerald-50 text-emerald-700">
                      <Unlock className="h-3 w-3" />
                      {isPt ? 'Liberado' : 'Unlocked'}
                    </Badge>
                  ) : (
                    <Badge className="gap-1 border border-amber-200 bg-amber-50 text-amber-700">
                      <Lock className="h-3 w-3" />
                      {isPt ? 'Bloqueado' : 'Locked'}
                    </Badge>
                  )}

                  {unlocked ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <Link href={localizeAppHref(m.href, locale)} className="flex items-center">
                        {isPt ? 'Abrir' : 'Open'} <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="sm"
                      className="border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99]"
                    >
                      <Link href={localizeAppHref(ROUTES.student, locale)} className="flex items-center">
                        {isPt ? 'Liberar' : 'Unlock'} <ArrowRight className="ml-1 h-4 w-4" />
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
