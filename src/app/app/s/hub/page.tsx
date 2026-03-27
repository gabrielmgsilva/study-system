'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, BookOpen, Wrench } from 'lucide-react';

import { getAppLocaleFromPathname, localizeAppHref } from '@/lib/i18n/app';
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

type HubItem = {
  id: string;
  name: string;
  desc: string;
  href: string;
};

export default function SHubPage() {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const isPt = locale === 'pt';

  const items: HubItem[] = [
    {
      id: 'sp',
      name: isPt ? 'S — Práticas Padrão' : 'S – Standard Practices',
      desc: isPt
        ? 'Práticas centrais (01–12): desenhos, ferragens, corrosão, END, ferramentas, servicing e procedimentos de manutenção.'
        : 'Core practices (01–12): drawings, hardware, corrosion, NDT, tools, servicing, and maintenance procedures.',
      href: ROUTES.sStandardPractices,
    },
    {
      id: 'rating',
      name: isPt ? 'Habilitação S — Estruturas' : 'S Rating – Structures',
      desc: isPt
        ? 'Habilitação de estruturas (13–20): chapa, tubular, madeira/tecido, compósitos, corrosão, END, linhas de fluido e termoplásticos.'
        : 'Structures rating (13–20): sheet metal, tubular, wood/fabric, composites, corrosion, NDT, fluid lines and thermoplastics.',
      href: ROUTES.sRatingStructures,
    },
  ];

  const surfaceCard =
    'rounded-[30px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]';
  const outlineBtn = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <Wrench className="h-3 w-3 text-[#2d4bb3]" />
            <span>{isPt ? 'Licença S — Estruturas' : 'Licence S – Structures'}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {isPt ? 'Hub S (seletor de módulos)' : 'S Hub (Module chooser)'}
          </h1>

          <p className="max-w-2xl text-sm text-slate-500">
            {isPt ? 'Escolha o que deseja estudar primeiro.' : 'Choose what you want to study first.'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {isPt ? 'Grupos de módulos' : 'Module Groups'}
          </div>
          <div className="text-3xl font-semibold leading-none text-[#2d4bb3]">2</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <Link key={it.id} href={localizeAppHref(it.href, locale)} className="block">
            <Card
              className={[
                surfaceCard,
                'h-full cursor-pointer transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_20px_46px_rgba(15,23,42,0.10)]',
              ].join(' ')}
            >
              <div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-slate-900 md:text-lg">
                    <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-[#eef3ff]">
                      <BookOpen className="h-4 w-4 text-[#2d4bb3]" />
                    </span>
                    {it.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 md:text-sm">
                    {it.desc}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-xs text-slate-500">
                  {isPt
                    ? 'Prática, flashcards e modo prova usando o mesmo fluxo do AdvancedEngine.'
                    : 'Practice, flashcards and test mode using the same AdvancedEngine workflow.'}
                </CardContent>

                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className={'w-full ' + outlineBtn}
                    type="button"
                    tabIndex={-1}
                  >
                    {isPt ? 'Abrir' : 'Open'} <ArrowRight className="ml-1 h-4 w-4" />
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
