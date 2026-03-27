// src/app/app/m/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Wrench,
  FileText,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Plane,
  Cog,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import ModuleShortcutCard from '@/components/ModuleShortcutCard';
import { getAppLocaleFromPathname, localizeAppHref } from '@/lib/i18n/app';
import { ROUTES } from '@/lib/routes';

export default function MMenuPage() {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const isPt = locale === 'pt';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <Wrench className="h-3 w-3 text-[#2d4bb3]" />
            <span>{isPt ? 'Licença M — Avião e Helicóptero' : 'Licence M — Airplane & Helicopter'}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {isPt ? 'M — Início' : 'M — Home'}
          </h1>

          <p className="max-w-2xl text-sm text-slate-500">
            {isPt
              ? 'Acesse diretamente seus módulos de estudo (STDP, Célula, Grupo Motopropulsor, REGS) ou abra o logbook no estilo TC.'
              : 'Jump straight into your study modules (STDP, Airframe, Powerplant, REGS) or open the TC-style logbook.'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {isPt ? 'Rotas disponíveis' : 'Available Paths'}
          </div>
          <div className="text-3xl font-semibold leading-none text-[#2d4bb3]">5</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={localizeAppHref(ROUTES.mHub, locale)} className="block">
          <Card
            className="h-full cursor-pointer overflow-hidden rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_20px_46px_rgba(15,23,42,0.10)]"
          >
            <div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900 md:text-lg">
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-[#eef3ff]">
                    <BookOpen className="h-4 w-4 text-[#2d4bb3]" />
                  </span>
                  {isPt ? 'Hub M' : 'M Hub'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 md:text-sm">
                  {isPt
                    ? 'Ponto central para navegar por módulos, prática e questionários.'
                    : 'Central place to navigate modules, practice, and run quizzes.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-slate-500">
                <ul className="list-disc pl-4 space-y-1">
                  {isPt ? (
                    <>
                      <li>Veja quais módulos existem (disponíveis/bloqueados)</li>
                      <li>Gerencie acesso na Área do Aluno quando necessário</li>
                      <li>Abra módulos instantaneamente quando disponíveis</li>
                    </>
                  ) : (
                    <>
                      <li>See what modules exist (available/locked)</li>
                      <li>Manage access in Student Area when needed</li>
                      <li>Open modules instantly when available</li>
                    </>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  type="button"
                  tabIndex={-1}
                >
                  {isPt ? 'Abrir Hub M' : 'Open M Hub'}
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>

        <ModuleShortcutCard
          title="Logbook (M)"
          description="Maintenance experience logbook aligned with TC sample tasks."
          href={ROUTES.mLogbook}
          moduleKey="m.logbook"
          icon={<ClipboardList className="h-4 w-4" />}
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">
          {isPt ? 'Atalhos diretos de módulo' : 'Direct module shortcuts'}
        </h2>
        <p className="text-xs text-slate-500">
          {isPt ? 'Se você já sabe o que quer, entre direto no conteúdo.' : 'If you already know what you want, jump straight in.'}
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <ModuleShortcutCard
            title="Standard Practices (STDP)"
            description="Hardware, tools, processes, measurements and best practices."
            href={ROUTES.mStandardPractices}
            moduleKey="m.standard-practices"
            icon={<Cog className="h-4 w-4" />}
          />

          <ModuleShortcutCard
            title="Airframe (AF)"
            description="Structures, flight controls, systems, and airframe maintenance topics."
            href={ROUTES.mAirframe}
            moduleKey="m.airframe"
            icon={<Plane className="h-4 w-4" />}
          />

          <ModuleShortcutCard
            title="Powerplant (PP)"
            description="Engines, fuel & lubrication systems, ignition, starting and performance."
            href={ROUTES.mPowerplant}
            moduleKey="m.powerplant"
            icon={<Wrench className="h-4 w-4" />}
          />

          <ModuleShortcutCard
            title="Regulatory Requirements (CARs / REGS)"
            description="Regulations & standards relevant to AME licensing and maintenance."
            href={ROUTES.regs}
            moduleKey="regs.core"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </div>
      </section>

      <section>
        <Card className="overflow-hidden rounded-[30px] border-[#d8e0fb] bg-[linear-gradient(90deg,rgba(238,243,255,0.95),rgba(255,248,245,0.9))] shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
          <div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-[#eef3ff]">
                  <FileText className="h-4 w-4 text-[#2d4bb3]" />
                </span>
                {isPt ? 'Recomendações de estudo' : 'Study Recommendations'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {isPt
                  ? 'Mantenha o fluxo M alinhado à nova estrutura do Módulo de Estudo.'
                  : 'Keep the M workflow aligned with the new Study Module structure.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              {isPt ? (
                <>
                  <p>Comece no Hub M quando quiser uma visão guiada por tópico e status de desbloqueio.</p>
                  <p>Use os atalhos diretos quando já souber qual módulo precisa revisar.</p>
                  <p>Mantenha REGS próximo dos módulos técnicos para que a revisão regulatória siga o mesmo fluxo.</p>
                </>
              ) : (
                <>
                  <p>Start in M Hub when you want a guided overview by topic and unlock status.</p>
                  <p>Use the direct shortcuts when you already know the module you need to revise.</p>
                  <p>Keep REGS close to the technical modules so regulatory review stays in the same study flow.</p>
                </>
              )}
            </CardContent>
          </div>
        </Card>
      </section>
    </div>
  );
}
