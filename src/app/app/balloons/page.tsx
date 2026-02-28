'use client';

import React from 'react';
import Link from 'next/link';
import { Wind, FileText, ArrowLeft, BookOpen, ClipboardList } from 'lucide-react';

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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
            <Wind className="h-3 w-3 text-white/90" />
            <span>Licence B – Balloons</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Balloons – Licence Home
          </h1>

          <p className="text-sm text-white/75 max-w-2xl">
            Study for BREGS and balloon operations/maintenance, plus a TC-style
            experience logbook for the B rating.
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
        {/* Study Hub */}
        <Link href={ROUTES.module('balloons', 'hub')} className="block">
          <Card
            className="
              relative h-full overflow-hidden rounded-[30px]
              border-white/15 bg-white/10 backdrop-blur-md
              transition-all hover:bg-white/15 hover:shadow-md cursor-pointer
            "
          >
            <div className="absolute inset-0 bg-black/25 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25 pointer-events-none" />

            <div className="relative">
              <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2 text-white">
                  <span className="h-8 w-8 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-white" />
                  </span>
                  Study Hub (Balloons)
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-white/75">
                  Central place to practice, run quizzes, and navigate balloon
                  study topics.
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-white/75">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Choose what to study first</li>
                  <li>Flashcards, practice, and test mode</li>
                  <li>Review regulatory and operational requirements</li>
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  Open Study Hub
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>

        {/* Logbook */}
        <Link href={ROUTES.balloonsLogbook} className="block">
          <Card
            className="
              relative h-full overflow-hidden rounded-[30px]
              border-white/15 bg-white/10 backdrop-blur-md
              transition-all hover:bg-white/15 hover:shadow-md cursor-pointer
            "
          >
            <div className="absolute inset-0 bg-black/25 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25 pointer-events-none" />

            <div className="relative">
              <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2 text-white">
                  <span className="h-8 w-8 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <ClipboardList className="h-4 w-4 text-white" />
                  </span>
                  Balloons Logbook (B)
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-white/75">
                  TC-style experience logbook for the B rating, aligned with
                  sample tasks.
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-white/75">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Envelope inspections and load tape checks</li>
                  <li>Parachute, vent, burner and fuel system tasks</li>
                  <li>Basket, instruments and technical records inspections</li>
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  Open Balloons Logbook
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>
      </div>

      {/* Study note */}
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
              This platform is a supplement—not a replacement—for official
              references.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-white/75">
            <p>
              This platform is a supplement—not a replacement—for official
              references. Many questions are inspired by real exam style, but
              you should always study the official Transport Canada materials
              for deeper understanding.
            </p>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="font-semibold text-white/90 mb-1">Exam strategy</p>
              <p className="text-white/75">
                Read the whole question, read all options, eliminate the most
                incorrect answers, then choose the best remaining option.
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
