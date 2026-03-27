import React from 'react';
import { ShieldCheck } from 'lucide-react';

import { getServerAppLocale } from '@/lib/i18n/appServer';

export default async function RegsLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerAppLocale();
  const isPt = locale === 'pt';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <ShieldCheck className="h-3 w-3 text-[#2d4bb3]" />
            <span>{isPt ? 'REGS — CARs e Standards' : 'REGS – CARs & Standards'}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {isPt ? 'Requisitos regulatórios' : 'Regulatory Requirements'}
          </h1>

          <p className="max-w-2xl text-sm text-slate-500">
            {isPt
              ? 'Navegue por temas de CARs e Standards do Transport Canada e monte o estudo por seção.'
              : 'Browse Transport Canada CARs and Standards topics and build a study deck by section (based on the TC guide).'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {isPt ? 'Foco regulatório' : 'Regulatory Focus'}
          </div>
          <div className="text-3xl font-semibold leading-none text-[#2d4bb3]">2</div>
        </div>
      </div>

      {children}
    </div>
  );
}
