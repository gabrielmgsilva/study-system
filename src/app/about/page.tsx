import Link from 'next/link';
import {
  Info,
  ArrowLeft,
  Target,
  BookOpen,
  Coins,
  Users,
  AlertTriangle,
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

export default function AboutPage() {
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
            <div className="text-sm font-semibold text-white">About AME ONE</div>
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
                About AME ONE
              </h1>
              <p className="text-sm text-white/70">
                A focused, no-nonsense platform built to help AMEs prepare for
                Transport Canada exams with confidence.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Mission */}
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5" />
                Our mission
              </CardTitle>
              <CardDescription className="text-white/65">
                Why AME ONE exists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-white/80">
                AME ONE was created to simplify and optimize exam preparation
                for Aircraft Maintenance Engineers. The goal is not to overwhelm
                users with theory, but to help them focus on what actually
                matters for real exams.
              </p>
              <p className="text-sm text-white/80">
                The platform is designed to be practical, objective, and aligned
                with how AMEs really study and work.
              </p>
            </CardContent>
          </Card>

          {/* Who it's for */}
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Who AME ONE is for
              </CardTitle>
              <CardDescription className="text-white/65">
                Designed with real users in mind.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-white/80 space-y-2">
                <li>• AMEs preparing for Transport Canada written exams</li>
                <li>• Foreign AMEs transitioning to the Canadian system</li>
                <li>• Students in approved or independent training paths</li>
                <li>• Licensed AMEs refreshing knowledge before exams</li>
              </ul>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                How AME ONE works
              </CardTitle>
              <CardDescription className="text-white/65">
                Simple structure, clear intent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-white/80">
                AME ONE organizes questions and study material by module and
                topic, allowing users to study using different modes depending
                on their objective.
              </p>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 space-y-2">
                <div className="text-sm font-semibold text-white">
                  Study / Practice / Test
                </div>
                <p className="text-sm text-white/75">
                  Each mode serves a different purpose, from learning and
                  repetition to realistic exam simulation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Credits philosophy */}
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Credits & transparency
              </CardTitle>
              <CardDescription className="text-white/65">
                No hidden tricks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-white/80">
                AME ONE uses a credit-based system for certain features, but
                transparency is a core principle.
              </p>
              <ul className="text-sm text-white/80 space-y-2">
                <li>• Institutional pages never use credits</li>
                <li>• Credit usage should always be clearly explained</li>
                <li>• The user must confirm before spending credits</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <Card className="rounded-[28px] border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Important disclaimer
            </CardTitle>
            <CardDescription className="text-white/65">
              Please read carefully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[22px] border border-amber-200/20 bg-amber-200/10 p-4">
              <p className="text-sm text-white/85">
                AME ONE is an independent educational platform. It is not
                affiliated with, endorsed by, or officially connected to
                Transport Canada.
              </p>
              <p className="text-sm text-white/85 mt-2">
                Exam requirements, regulations, and interpretations may change.
                Users are responsible for confirming all official information
                with Transport Canada.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            asChild
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Link href={ROUTES.instructions}>App Instructions</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.appHub}>Go to Study</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
