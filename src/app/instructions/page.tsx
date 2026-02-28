import React from 'react';
import Link from 'next/link';
import {
  Info,
  BookOpen,
  ClipboardList,
  Coins,
  HelpCircle,
  Navigation,
  ArrowLeft,
  CheckCircle2,
  Mail,
} from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <CheckCircle2 className="h-4 w-4 mt-0.5 text-white/70" />
      <span className="text-sm text-white/80">{children}</span>
    </li>
  );
}

export default function InstructionsPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0b1220] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Link href={ROUTES.landing}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>

          <div className="text-right">
            <div className="text-sm font-semibold text-white">
              App Instructions / FAQ
            </div>
            <div className="text-xs text-white/60">
              This page does not use credits.
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-semibold text-white">
                How to use AME ONE
              </h1>
              <p className="text-sm text-white/70">
                A clear guide to navigate the app, understand Study / Practice /
                Test, use the Logbook correctly, validate tasks by email
                signature, and avoid spending credits by mistake.
              </p>
            </div>
          </div>
        </div>

        {/* OVERVIEW + CREDITS */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                AME ONE overview
              </CardTitle>
              <CardDescription className="text-white/65">
                What the platform is designed for.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                <Bullet>
                  AME ONE is a focused preparation platform for Transport Canada
                  AME written exams.
                </Bullet>
                <Bullet>
                  Content is organized by modules (CARs, Standard Practices,
                  Airframe, Powerplant, Avionics, Structures, etc.).
                </Bullet>
                <Bullet>
                  Institutional pages and the Logbook never consume credits.
                </Bullet>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Credits: when they are used
              </CardTitle>
              <CardDescription className="text-white/65">
                Transparency is a core principle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  Does NOT use credits
                </div>
                <ul className="mt-2 space-y-2">
                  <Bullet>Reading instructions and help pages</Bullet>
                  <Bullet>Using the Logbook module</Bullet>
                  <Bullet>Task validation by email signature</Bullet>
                </ul>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  MAY use credits
                </div>
                <p className="mt-2 text-sm text-white/80">
                  Starting a <b>Test</b>, unlocking premium features, or using
                  advanced tools. Credit usage is always confirmed before
                  proceeding.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* STUDY / PRACTICE / TEST */}
        <Card className="rounded-[28px] border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Study vs Practice vs Test
            </CardTitle>
            <CardDescription className="text-white/65">
              Each mode has a specific purpose.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Study</div>
              <p className="text-sm text-white/75 mt-1">
                Learn concepts, understand logic, and read explanations.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Practice</div>
              <p className="text-sm text-white/75 mt-1">
                Build repetition, improve retention, and identify weak areas.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Test</div>
              <p className="text-sm text-white/75 mt-1">
                Simulate the real exam with time pressure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* LOGBOOK + SIGNATURE */}
        <Card className="rounded-[28px] border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              How to use the Logbook module
            </CardTitle>
            <CardDescription className="text-white/65">
              Advanced usage, responsibilities, and task validation.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-white/80">
              The Logbook module helps you organize and document your maintenance
              experience in a structured way. It supports task organization,
              review, printing, and optional task validation by email — but it
              does not replace official Transport Canada processes.
            </p>

            {/* What it is */}
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                What the Logbook IS
              </div>
              <ul className="mt-2 space-y-2">
                <Bullet>
                  A structured way to record maintenance tasks by ATA chapter.
                </Bullet>
                <Bullet>
                  A preparation tool before discussing experience with inspectors.
                </Bullet>
                <Bullet>
                  A print-friendly record for review and submission support.
                </Bullet>
              </ul>
            </div>

            {/* What it is not */}
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                What the Logbook is NOT
              </div>
              <ul className="mt-2 space-y-2">
                <Bullet>
                  It does not replace official Transport Canada logbooks or forms.
                </Bullet>
                <Bullet>
                  It does not automatically certify or approve your experience.
                </Bullet>
                <Bullet>It does not guarantee licence issuance.</Bullet>
              </ul>
            </div>

            {/* Navigation */}
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Navigation and usage
              </div>
              <ul className="mt-2 space-y-2">
                <Bullet>
                  Tasks are grouped by ATA chapters for easier navigation.
                </Bullet>
                <Bullet>
                  Use expand / collapse controls to focus on one ATA at a time.
                </Bullet>
                <Bullet>
                  Collapsed view is for navigation only — printing always shows
                  the full logbook.
                </Bullet>
              </ul>
            </div>

            {/* Signature by email */}
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Mail className="h-4 w-4" />
                Task validation by email signature
              </div>

              <p className="mt-2 text-sm text-white/80">
                AME ONE allows you to request task validation via email. This
                feature is designed to help you collect written confirmation
                from a supervisor, ACA, or authorized person regarding specific
                tasks you performed.
              </p>

              <ul className="mt-2 space-y-2">
                <Bullet>
                  An email is sent containing task details and a validation
                  request.
                </Bullet>
                <Bullet>
                  The recipient can confirm the task by replying or approving
                  via email.
                </Bullet>
                <Bullet>
                  The confirmation is stored as supporting evidence inside your
                  logbook record.
                </Bullet>
              </ul>

              <div className="mt-3 rounded-[18px] border border-amber-200/20 bg-amber-200/10 p-3">
                <p className="text-sm text-white/85">
                  <b>Important:</b> Email validation is a supporting record only.
                  It does not replace official signatures, stamps, or approvals
                  required by Transport Canada. Acceptance of this evidence is
                  always at the discretion of the inspector.
                </p>
              </div>
            </div>

            {/* Responsibility */}
            <div className="rounded-[22px] border border-amber-200/20 bg-amber-200/10 p-4">
              <div className="text-sm font-semibold text-white">
                Responsibility notice
              </div>
              <p className="mt-2 text-sm text-white/85">
                You are fully responsible for the accuracy, truthfulness, and
                completeness of all logbook entries and validation requests.
                Always confirm requirements directly with Transport Canada or
                your local inspector.
              </p>
            </div>

            <div className="text-xs text-white/60">
              The Logbook module and email validation feature do not consume
              credits.
            </div>
          </CardContent>
        </Card>

        {/* NAVIGATION + START */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                How to navigate the app
              </CardTitle>
              <CardDescription className="text-white/65">
                Common user flows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <Bullet>
                  Use <b>Prepare for Written Test</b> to start studying.
                </Bullet>
                <Bullet>
                  Use <b>Find a question</b> to jump directly by question ID.
                </Bullet>
                <Bullet>
                  Use the Logbook to organize experience — not to study for exams.
                </Bullet>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Where should I start?
              </CardTitle>
              <CardDescription className="text-white/65">
                Guidance based on your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">Beginner</div>
                <p className="text-sm text-white/75 mt-1">
                  Start with Study mode and build a solid foundation.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  Experienced AME
                </div>
                <p className="text-sm text-white/75 mt-1">
                  Use Practice for volume and Test mode for simulation.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  CARs-focused study
                </div>
                <p className="text-sm text-white/75 mt-1">
                  Focus on CARs/Regs with short, frequent sessions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            asChild
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Link href={ROUTES.help}>Support / Help</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.appHub}>Go to Study</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
