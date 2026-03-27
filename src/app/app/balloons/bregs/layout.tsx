import 'server-only';
import React from 'react';
import { Wind } from 'lucide-react';

import ModuleGate from '@/lib/ModuleGate';
import { ROUTES } from '@/lib/routes';
import { getServerAppLocale } from '@/lib/i18n/appServer';

export default async function BalloonsBregsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerAppLocale();
  const isPt = locale === 'pt';

  return (
    <ModuleGate
      licenseId="balloons"
      moduleId="bregs"
      title={isPt ? 'Balões — BREGS' : 'Balloons — BREGS'}
      backHref={ROUTES.balloonsHub}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <Wind className="h-4 w-4 text-[#2d4bb3]" />
              {isPt ? 'Licença B — Banco de questões' : 'Licence B — Question Bank'}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {isPt ? 'Balões — BREGS' : 'Balloons — BREGS'}
            </h1>
            <p className="text-slate-500">
              {isPt
                ? 'Preparação focada para questões no estilo BREGS e conhecimentos de operação/manutenção de balões.'
                : 'Focused preparation for BREGS-style questions and balloon ops/maintenance knowledge.'}
            </p>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {isPt ? 'Questões focadas' : 'Focused Questions'}
            </div>
            <div className="text-3xl font-semibold leading-none text-[#2d4bb3]">1</div>
          </div>
        </div>

        {children}
      </div>
    </ModuleGate>
  );
}
