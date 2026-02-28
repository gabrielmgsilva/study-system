'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  FileText,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Mail,
  ListChecks,
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
      {children}
    </span>
  );
}

export default function BecomeAMEPage() {
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
            <Link href={ROUTES.landing} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
          </Button>

          <div className="text-right">
            <div className="text-sm font-semibold text-white">
              How to Become an AME (Canada)
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
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-semibold text-white">
                How to obtain an AME licence in Canada
              </h1>
              <p className="text-sm text-white/70">
                Educational overview of the typical path (always confirm with Transport Canada).
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge>No credits</Badge>
                <Badge>Informational</Badge>
                <Badge>UX-first</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* What is AME */}
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                What is an AME licence?
              </CardTitle>
              <CardDescription className="text-white/65">
                Certification to sign and release aircraft maintenance in Canada (within scope).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-white/80">
                An AME licence confirms you meet experience, knowledge, and competency requirements
                for a given category.
              </p>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  Licence categories
                </div>
                <ul className="mt-2 text-sm text-white/80 space-y-1">
                  <li>
                    <b>M1</b> — smaller aircraft (per category scope)
                  </li>
                  <li>
                    <b>M2</b> — larger/complex aircraft (per category scope)
                  </li>
                  <li>
                    <b>E</b> — Avionics
                  </li>
                  <li>
                    <b>S</b> — Structures
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Disclaimer (important)
              </CardTitle>
              <CardDescription className="text-white/65">
                Read before taking action.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[22px] border border-amber-200/20 bg-amber-200/10 p-4">
                <p className="text-sm text-white/85">
                  <b>Educational information only.</b> Requirements, forms, and policies may change.
                  Always confirm using official Transport Canada sources and your regional office
                  guidance before making decisions.
                </p>
              </div>
              <p className="text-sm text-white/75">
                Tip: keep a well-organized “dossier” with documents, translations, experience evidence,
                and training history to reduce back-and-forth.
              </p>
            </CardContent>
          </Card>

          {/* Path for Canadians */}
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Typical path for Canadians
              </CardTitle>
              <CardDescription className="text-white/65">
                High-level overview (varies by case).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-white/80 space-y-2">
                <li>1) Complete applicable training (e.g., approved school/program when required)</li>
                <li>2) Build documented practical experience</li>
                <li>3) Meet exam/knowledge requirements</li>
                <li>4) Submit application package to Transport Canada</li>
              </ul>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Clock className="h-4 w-4" />
                  Typical timelines
                </div>
                <p className="mt-2 text-sm text-white/75">
                  Timelines depend on region, office workload, and how complete/clear your package is.
                  A strong package usually moves faster.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Path for foreigners */}
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Typical path for foreign applicants
              </CardTitle>
              <CardDescription className="text-white/65">
                The focus is proving equivalency through documentation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-white/80 space-y-2">
                <li>1) Organize work history (companies, aircraft types, scope of tasks)</li>
                <li>2) Gather training evidence (certificates, courses, logbooks, letters)</li>
                <li>3) Obtain certified translations when applicable</li>
                <li>4) Submit package and respond to any follow-up requests</li>
              </ul>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  Certified translations (when applicable)
                </div>
                <p className="mt-2 text-sm text-white/75">
                  If documents are not in English or French, you may need certified translations
                  accepted by authorities. Confirm requirements with your regional office.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents + Form */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document checklist (common items)
              </CardTitle>
              <CardDescription className="text-white/65">
                Adjust based on your case and official guidance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-white/80 space-y-2">
                <li>• Valid identification</li>
                <li>• Experience evidence (letters, records, logbook)</li>
                <li>• Training certificates and course records</li>
                <li>• Task evidence (ATA/scope when available)</li>
                <li>• Certified translations (if applicable)</li>
              </ul>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  Form 26-0638E
                </div>
                <p className="mt-2 text-sm text-white/75">
                  Include it when required/requested. The correct version and usage may change—
                  confirm with Transport Canada.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Example email to Transport Canada
              </CardTitle>
              <CardDescription className="text-white/65">
                Copy, edit, and personalize.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/80">
                  <b>Subject:</b> AME Licence Application – Request for guidance
                </p>
                <p className="mt-3 text-sm text-white/80">
                  Hello,
                  <br />
                  <br />
                  I would like to request guidance regarding the process and documentation required
                  to apply for an AME licence in Canada (category: M1/M2/E/S).
                  <br />
                  <br />
                  I can provide my work experience records, training certificates, and any other
                  supporting documentation as required. Could you please confirm the current
                  requirements, forms to submit (including 26-0638E if applicable), and the
                  recommended next steps?
                  <br />
                  <br />
                  Thank you,
                  <br />
                  [Your full name]
                  <br />
                  [Phone]
                  <br />
                  [City/Province]
                </p>
              </div>

              <div className="rounded-[22px] border border-amber-200/20 bg-amber-200/10 p-4">
                <div className="text-sm font-semibold text-white">
                  Important notes
                </div>
                <p className="mt-2 text-sm text-white/85">
                  Some regions may have <b>pilot projects</b>, specific local interpretations,
                  and requirements about <b>approved schools/programs</b>. Always confirm.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            asChild
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Link href={ROUTES.instructions}>App Instructions</Link>
          </Button>

          <Button asChild>
            <Link href={ROUTES.help}>Support / Help</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
