'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, BookOpen, ClipboardList, FileText } from 'lucide-react';

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

export default function EMenuPage() {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const isPt = locale === 'pt';

  const surfaceCard =
    'rounded-[30px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]';
  const outlineBtn = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <Radio className="h-3 w-3 text-[#2d4bb3]" />
            <span>{isPt ? 'Licença E — Aviônicos' : 'Licence E – Avionics'}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {isPt ? 'E — Início da licença' : 'E – Licence Home'}
          </h1>

          <p className="max-w-2xl text-sm text-slate-500">
            {isPt
              ? 'Acesse seus módulos de estudo da habilitação E ou abra o logbook de aviônicos no estilo TC.'
              : 'Access your E-rating study modules or open the TC-style avionics logbook.'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {isPt ? 'Trilhas de estudo' : 'Study Tracks'}
          </div>
          <div className="text-3xl font-semibold leading-none text-[#2d4bb3]">2</div>
        </div>
      </div>

      {/* Top cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* E Hub */}
        <Link href={localizeAppHref(ROUTES.eHub, locale)} className="block">
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
                  {isPt ? 'Hub E (seletor de módulos)' : 'E Hub (Module chooser)'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 md:text-sm">
                  {isPt
                    ? 'Escolha entre Práticas Padrão e Sistemas Aviônicos.'
                    : 'Choose between Standard Practices and Avionics Systems.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-slate-500">
                <ul className="list-disc pl-4 space-y-1">
                  {isPt ? (
                    <>
                      <li>Práticas Padrão — Aviônicos</li>
                      <li>Habilitação E — Sistemas aviônicos e teoria</li>
                      <li>Flashcards, prática e modo prova</li>
                    </>
                  ) : (
                    <>
                      <li>Standard Practices – Avionics</li>
                      <li>E Rating – Avionics Systems &amp; Theory</li>
                      <li>Flashcards, Practice, and Test mode</li>
                    </>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className={'w-full ' + outlineBtn}
                >
                  {isPt ? 'Abrir Hub E' : 'Open E Hub'}
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>

        {/* Logbook */}
        <Link href={localizeAppHref(ROUTES.eLogbook, locale)} className="block">
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
                    <ClipboardList className="h-4 w-4 text-[#2d4bb3]" />
                  </span>
                  {isPt ? 'Logbook E' : 'E Logbook'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 md:text-sm">
                  {isPt ? 'Logbook de experiência no estilo TC para a habilitação E.' : 'TC-style experience logbook for the E rating.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-slate-500">
                <ul className="list-disc pl-4 space-y-1">
                  {isPt ? (
                    <>
                      <li>Tarefas modelo oficiais do TC</li>
                      <li>Gestão de signatários</li>
                      <li>Pronto para impressão e exportação</li>
                    </>
                  ) : (
                    <>
                      <li>Official TC sample tasks</li>
                      <li>Signatory management</li>
                      <li>Print / export ready</li>
                    </>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className={'w-full ' + outlineBtn}
                >
                  {isPt ? 'Abrir logbook' : 'Open Logbook'}
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>
      </div>

      <Card className="rounded-[30px] border-[#d8e0fb] bg-[linear-gradient(90deg,rgba(238,243,255,0.95),rgba(255,248,245,0.9))] shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
        <div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-[#eef3ff]">
                <FileText className="h-4 w-4 text-[#2d4bb3]" />
              </span>
              {isPt ? 'Recomendações de estudo' : 'Study Recommendations'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {isPt ? 'Mantenha a revisão de aviônicos focada e modular.' : 'Keep avionics review focused and modular.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm text-slate-500">
            {isPt ? (
              <>
                <p>Use Práticas Padrão para consolidar fundamentos antes de avançar para a revisão mais densa da habilitação E.</p>
                <p>Alterne sessões de prática com testes cronometrados para equilibrar troubleshooting e teoria.</p>
                <p>Mantenha o logbook disponível na mesma estrutura de rotas, em vez de um fluxo separado.</p>
              </>
            ) : (
              <>
                <p>Use Standard Practices to stabilize fundamentals before moving to systems-heavy E Rating review.</p>
                <p>Alternate practice sessions with timed tests so troubleshooting and theory stay balanced.</p>
                <p>Keep the logbook available as part of the same route structure instead of a separate flow.</p>
              </>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
