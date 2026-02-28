'use client';

import React from 'react';
import Link from 'next/link';
import { Hammer, FileText, ArrowLeft, BookOpen, ClipboardList } from 'lucide-react';

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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
            <Hammer className="h-3 w-3 text-white/90" />
            <span>Licence S – Structures</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Structures – Licence Home
          </h1>

          <p className="text-sm text-white/75 max-w-2xl">
            Study modules for sheet metal, composites, wood/fabric, corrosion
            control, NDT and repairs—plus a TC-style logbook for the S rating.
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
        {/* Hub */}
        <Link href={ROUTES.sHub} className="block">
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
                  S Hub (Module chooser)
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-white/75">
                  TC-like navigation: Standard Practices, S Rating, Logbook.
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-white/75">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Choose Standard Practices or S Rating</li>
                  <li>Open modules instantly when unlocked</li>
                  <li>Use Unlock flow from Student Area</li>
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  Open S Hub
                </Button>
              </CardFooter>
            </div>
          </Card>
        </Link>

        {/* Logbook */}
        <Link href={ROUTES.sLogbook} className="block">
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
                  Structures Logbook (S)
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-white/75">
                  TC-style experience logbook for the S rating.
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-white/75">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Sheet metal, composites, wood &amp; fabric repairs</li>
                  <li>Corrosion control, sealing and fastener work</li>
                  <li>Print/export ready</li>
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  Open Logbook
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
              This platform is a supplement—not a replacement—for official references.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/75">
            <p>
              Use AME ONE to practice and reinforce your knowledge, but always
              study the official Transport Canada references for deeper understanding.
            </p>
            <p>
              Exam strategy: read the whole question, read all options, eliminate
              the most incorrect answers, then choose the best remaining option.
            </p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
