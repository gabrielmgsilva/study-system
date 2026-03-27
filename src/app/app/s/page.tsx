'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hammer, FileText, BookOpen, ClipboardList } from 'lucide-react';

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

export default function SMenuPage() {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const isPt = locale === 'pt';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <Hammer className="h-3 w-3 text-[#2d4bb3]" />
            <span>{isPt ? 'Licença S — Estruturas' : 'Licence S – Structures'}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {isPt ? 'Estruturas — Início da licença' : 'Structures – Licence Home'}
          </h1>

          <p className="max-w-2xl text-sm text-slate-500">
            {isPt
              ? 'Módulos de estudo para chapa, compósitos, madeira/tecido, controle de corrosão, END e reparos, além de um logbook no estilo TC para a habilitação S.'
              : 'Study modules for sheet metal, composites, wood/fabric, corrosion control, NDT and repairs—plus a TC-style logbook for the S rating.'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {isPt ? 'Áreas centrais' : 'Core Areas'}
          </div>
          <div className="text-3xl font-semibold leading-none text-[#2d4bb3]">3</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={localizeAppHref(ROUTES.sHub, locale)} className="block">
          <Card
            className="h-full cursor-pointer overflow-hidden rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_20px_46px_rgba(15,23,42,0.10)]"
          >
            <div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900 md:text-lg">
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-[#eef3ff]">
                    <BookOpen className="h-4 w-4 text-[#2d4bb3]" />
                  </span>
                  {isPt ? 'Hub S (seletor de módulos)' : 'S Hub (Module chooser)'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 md:text-sm">
                  {isPt
                    ? 'Navegação estilo TC: Práticas Padrão, Habilitação S, Logbook.'
                    : 'TC-like navigation: Standard Practices, S Rating, Logbook.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-slate-500">
                <ul className="list-disc pl-4 space-y-1">
                  {isPt ? (
                    <>
                      <li>Escolha entre Práticas Padrão e Habilitação S</li>
                      <li>Abra módulos instantaneamente quando liberados</li>
                      <li>Use o fluxo de liberação pela Área do Aluno</li>
                    </>
                  ) : (
                    <>
                      <li>Choose Standard Practices or S Rating</li>
                      <li>Open modules instantly when unlocked</li>
                      <li>Use Unlock flow from Student Area</li>
                    </>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  {isPt ? 'Abrir Hub S' : 'Open S Hub'}
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>

        <Link href={localizeAppHref(ROUTES.sLogbook, locale)} className="block">
          <Card
            className="h-full cursor-pointer overflow-hidden rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_20px_46px_rgba(15,23,42,0.10)]"
          >
            <div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900 md:text-lg">
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-[#eef3ff]">
                    <ClipboardList className="h-4 w-4 text-[#2d4bb3]" />
                  </span>
                  {isPt ? 'Logbook de Estruturas (S)' : 'Structures Logbook (S)'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 md:text-sm">
                  {isPt ? 'Logbook de experiência no estilo TC para a habilitação S.' : 'TC-style experience logbook for the S rating.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-slate-500">
                <ul className="list-disc pl-4 space-y-1">
                  {isPt ? (
                    <>
                      <li>Reparos em chapa, compósitos, madeira e tecido</li>
                      <li>Controle de corrosão, selagem e fixadores</li>
                      <li>Pronto para impressão e exportação</li>
                    </>
                  ) : (
                    <>
                      <li>Sheet metal, composites, wood &amp; fabric repairs</li>
                      <li>Corrosion control, sealing and fastener work</li>
                      <li>Print/export ready</li>
                    </>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  {isPt ? 'Abrir logbook' : 'Open Logbook'}
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>
      </div>

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
              {isPt ? 'Mantenha o fluxo de estruturas alinhado à navegação final do produto.' : 'Keep the structures flow aligned with the final product navigation.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {isPt ? (
              <>
                <p>Use o hub primeiro quando quiser separar Práticas Padrão dos tópicos específicos de reparo estrutural.</p>
                <p>Mantenha o trabalho de logbook próximo das rotas de estudo para que o registro de experiência faça parte do mesmo fluxo.</p>
                <p>Revise corrosão, END e famílias de reparo em conjunto para acompanhar a organização do banco de questões.</p>
              </>
            ) : (
              <>
                <p>Use the hub first when you want to separate Standard Practices from structures-specific repair topics.</p>
                <p>Keep logbook work close to the study routes so experience recording stays part of the same workflow.</p>
                <p>Review corrosion, NDT and repair families together to match the way the question bank is organized.</p>
              </>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
