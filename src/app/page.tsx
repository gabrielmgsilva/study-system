import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ShieldCheck,
  Layers,
  Plane,
  Radio,
  ClipboardList,
  Check,
} from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard, GlassPanel } from '@/components/ui/glass';

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm text-white/85">
      <Check className="h-4 w-4 text-white/85 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function PlanCard({
  title,
  price,
  subtitle,
  features,
  highlight,
}: {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <GlassCard className={highlight ? 'ring-1 ring-white/25' : ''}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-white">{title}</CardTitle>
          <Badge className="border-white/18 bg-white/10 text-white" variant="outline">
            {price}
          </Badge>
        </div>
        <CardDescription className="text-white/75">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {features.map((f) => (
          <Feature key={f}>{f}</Feature>
        ))}
      </CardContent>
    </GlassCard>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href={ROUTES.landing} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl border border-white/14 bg-white/10 flex items-center justify-center overflow-hidden">
              <Image src="/home/logo.svg" alt="AME ONE" width={26} height={26} priority />
            </div>

            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">AME ONE</div>
              <div className="text-[11px] text-white/70">
                Licences-first study platform (Transport Canada mindset)
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <Link className="hover:text-white" href={ROUTES.pricing}>
              Pricing
            </Link>
            <Link className="hover:text-white" href={ROUTES.instructions}>
              Instructions
            </Link>
            <Link className="hover:text-white" href={ROUTES.about}>
              About
            </Link>
            <Link className="hover:text-white" href={ROUTES.help}>
              Help
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="border-white/15 bg-white/10 text-white hover:bg-white/15"
            >
              <Link href={ROUTES.login}>Sign in</Link>
            </Button>
            <Button asChild className="bg-white text-black hover:bg-white/90">
              <Link href={ROUTES.register} className="flex items-center gap-2">
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-16 space-y-10">
        <GlassPanel className="p-6 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] items-start">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                <ShieldCheck className="h-4 w-4" />
                Built for Transport Canada exams
              </div>

              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
                Study like Transport Canada thinks.
                <span className="block text-white/80">Buy access per licence.</span>
              </h1>

              <p className="text-white/75 md:text-lg max-w-2xl">
                AME ONE is a licence-first platform: M, E, S, Balloons, plus a shared REGS module.
                Clear gating, clean UX, and content organized the way the exams are structured.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                  <Link href={ROUTES.register} className="flex items-center gap-2">
                    Start now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  <Link href={ROUTES.appHub} className="flex items-center gap-2">
                    Open Hub <Layers className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <Link href={ROUTES.pricing}>See pricing</Link>
                </Button>
              </div>

              <Separator className="bg-white/10" />

              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl border border-white/12 bg-white/10 flex items-center justify-center">
                    <Plane className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Licences = products</div>
                    <div className="text-sm text-white/70">No “premium for everything”.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl border border-white/12 bg-white/10 flex items-center justify-center">
                    <Radio className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">REGS is global</div>
                    <div className="text-sm text-white/70">Unlock once → share across licences.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl border border-white/12 bg-white/10 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Logbook is pro</div>
                    <div className="text-sm text-white/70">Not a “bonus feature”.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-white/70">Plan examples (per licence)</div>
              <PlanCard
                title="BASIC"
                price="~USD 10"
                subtitle="Explore & Start"
                features={[
                  'Flashcards: daily limit',
                  'Practice: cooldown',
                  'Test: weekly limit',
                  'No Logbook',
                ]}
              />
              <PlanCard
                title="STANDARD"
                price="~USD 20"
                subtitle="Serious Study (most popular)"
                highlight
                features={['Flashcards: unlimited', 'Practice: unlimited', 'Test: weekly limit', 'No Logbook']}
              />
              <PlanCard
                title="PREMIUM"
                price="~USD 30"
                subtitle="Exam & Career"
                features={['Everything unlimited', 'Test: unlimited', 'Logbook included', 'Priority access to new modules']}
              />
            </div>
          </div>
        </GlassPanel>

        {/* Secondary section */}
        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-white/12 bg-white/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Exam-focused structure</div>
                <div className="text-sm text-white/70">CARs / Standards / TC-style topic breakdown.</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-white/12 bg-white/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Clean gating</div>
                <div className="text-sm text-white/70">Entitlements are the single source of truth.</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-white/12 bg-white/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Professional Logbook</div>
                <div className="text-sm text-white/70">Premium-only (or add-on later).</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Footer */}
        <footer className="pb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-white/70">
            <div>
              © {new Date().getFullYear()} AME ONE — licence-first AME study platform.
            </div>
            <div className="flex items-center gap-4">
              <Link className="hover:text-white" href={ROUTES.terms}>
                Terms
              </Link>
              <Link className="hover:text-white" href={ROUTES.privacy}>
                Privacy
              </Link>
              <Link className="hover:text-white" href={ROUTES.feedback}>
                Feedback
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
