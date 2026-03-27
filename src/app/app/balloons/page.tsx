'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wind, FileText, BookOpen, ClipboardList } from 'lucide-react';

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

export default function BalloonsMenuPage() {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const isPt = locale === 'pt';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <Wind className="h-3 w-3 text-[#2d4bb3]" />
            <span>{isPt ? 'Licença B — Balões' : 'Licence B – Balloons'}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {isPt ? 'Balões — Início da licença' : 'Balloons – Licence Home'}
          </h1>

          <p className="max-w-2xl text-sm text-slate-500">
            {isPt
              ? 'Estude BREGS e operações/manutenção de balões, além de um logbook de experiência no estilo TC para a habilitação B.'
              : 'Study for BREGS and balloon operations/maintenance, plus a TC-style experience logbook for the B rating.'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {isPt ? 'Rotas disponíveis' : 'Available Routes'}
          </div>
          <div className="text-3xl font-semibold leading-none text-[#2d4bb3]">2</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={localizeAppHref(ROUTES.module('balloons', 'hub'), locale)} className="block">
          <Card
            className="h-full cursor-pointer overflow-hidden rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_20px_46px_rgba(15,23,42,0.10)]"
          >
            <div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900 md:text-lg">
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-[#eef3ff]">
                    <BookOpen className="h-4 w-4 text-[#2d4bb3]" />
                  </span>
                  {isPt ? 'Hub de estudo (Balões)' : 'Study Hub (Balloons)'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 md:text-sm">
                  {isPt
                    ? 'Ponto central para praticar, fazer questionários e navegar pelos tópicos de estudo de balões.'
                    : 'Central place to practice, run quizzes, and navigate balloon study topics.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-slate-500">
                <ul className="list-disc pl-4 space-y-1">
                  {isPt ? (
                    <>
                      <li>Escolha o que estudar primeiro</li>
                      <li>Flashcards, prática e modo prova</li>
                      <li>Revise requisitos regulatórios e operacionais</li>
                    </>
                  ) : (
                    <>
                      <li>Choose what to study first</li>
                      <li>Flashcards, practice, and test mode</li>
                      <li>Review regulatory and operational requirements</li>
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
                  {isPt ? 'Abrir hub de estudo' : 'Open Study Hub'}
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>

        <Link href={localizeAppHref(ROUTES.balloonsLogbook, locale)} className="block">
          <Card
            className="h-full cursor-pointer overflow-hidden rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_20px_46px_rgba(15,23,42,0.10)]"
          >
            <div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900 md:text-lg">
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-[#eef3ff]">
                    <ClipboardList className="h-4 w-4 text-[#2d4bb3]" />
                  </span>
                  {isPt ? 'Logbook de Balões (B)' : 'Balloons Logbook (B)'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 md:text-sm">
                  {isPt
                    ? 'Logbook de experiência no estilo TC para a habilitação B, alinhado às tarefas modelo.'
                    : 'TC-style experience logbook for the B rating, aligned with sample tasks.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-slate-500">
                <ul className="list-disc pl-4 space-y-1">
                  {isPt ? (
                    <>
                      <li>Inspeções de envelope e verificações de fitas de carga</li>
                      <li>Tarefas de paraquedas, vent, queimador e sistema de combustível</li>
                      <li>Inspeções de cesto, instrumentos e registros técnicos</li>
                    </>
                  ) : (
                    <>
                      <li>Envelope inspections and load tape checks</li>
                      <li>Parachute, vent, burner and fuel system tasks</li>
                      <li>Basket, instruments and technical records inspections</li>
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
                  {isPt ? 'Abrir logbook de balões' : 'Open Balloons Logbook'}
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
              {isPt ? 'Mantenha BREGS e a revisão operacional numa estrutura de rotas consistente.' : 'Keep BREGS and operational review in one consistent route structure.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-slate-500">
            {isPt ? (
              <>
                <p>Use o hub de estudo para um início guiado ao alternar entre revisão regulatória e tópicos operacionais.</p>
                <p>Mantenha o logbook na mesma árvore de navegação para que a experiência prática siga conectada à trilha teórica.</p>
                <p>Use referências oficiais para aprofundar o entendimento sempre que um tema exigir precisão regulatória.</p>
              </>
            ) : (
              <>
                <p>Use the study hub for a guided start when switching between regulatory review and operational topics.</p>
                <p>Keep the logbook in the same navigation tree so practical experience stays connected to the theory route.</p>
                <p>Use official references to deepen understanding whenever a topic requires regulatory precision.</p>
              </>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
