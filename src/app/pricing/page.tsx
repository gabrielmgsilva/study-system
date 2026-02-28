import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Plane,
  Radio,
  Wrench,
  Wind,
  Check,
} from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassPanel } from '@/components/ui/glass';

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm text-white/85">
      <Check className="h-4 w-4 text-white/85 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function Plan({
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
      <div className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-semibold text-lg">{title}</div>
            <div className="text-white/70 text-sm">{subtitle}</div>
          </div>
          <Badge className="border-white/18 bg-white/10 text-white" variant="outline">
            {price}
          </Badge>
        </div>
        <div className="space-y-2">
          {features.map((f) => (
            <Feature key={f}>{f}</Feature>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <GlassPanel className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                <ShieldCheck className="h-4 w-4" />
                Licence-first pricing (Transport Canada mindset)
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Pay per licence, not for stuff you don&apos;t use.
              </h1>
              <p className="text-white/75 max-w-2xl">
                AME ONE sells <span className="text-white">licences</span> (M, E, S, Balloons) — each one is its own product.
                REGS is global: unlock once and share CARs + Standards across all licences.
              </p>
            </div>

            <div className="flex gap-2">
              <Button asChild className="rounded-2xl">
                <Link href={ROUTES.register}>
                  Create account <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-2xl border-white/15 bg-white/10 text-white hover:bg-white/15">
                <Link href={ROUTES.login}>Sign in</Link>
              </Button>
            </div>
          </div>
        </GlassPanel>

        {/* Licence tiles */}
        <div className="grid gap-3 md:grid-cols-5">
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-semibold">REGS</span>
              <Badge className="ml-auto border-white/18 bg-white/10 text-white" variant="outline">
                Global
              </Badge>
            </div>
            <p className="text-sm text-white/70 mt-2">CARs + Standards. Unlock once.</p>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 text-white"><Plane className="h-4 w-4" /><span className="font-semibold">M</span></div>
            <p className="text-sm text-white/70 mt-2">Std Practices • Airframe • Powerplant</p>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 text-white"><Radio className="h-4 w-4" /><span className="font-semibold">E</span></div>
            <p className="text-sm text-white/70 mt-2">Std Practices • Avionics</p>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 text-white"><Wrench className="h-4 w-4" /><span className="font-semibold">S</span></div>
            <p className="text-sm text-white/70 mt-2">Std Practices • Structures</p>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 text-white"><Wind className="h-4 w-4" /><span className="font-semibold">Balloons</span></div>
            <p className="text-sm text-white/70 mt-2">BREGS • ops/maintenance</p>
          </GlassCard>
        </div>

        {/* Plans */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Plan
            title="BASIC"
            price="~USD 10 / licence"
            subtitle="Explore & Start"
            features={[
              'Flashcards: daily limit (ex: 20/day)',
              'Practice: cooldown (ex: 2 sessions/day)',
              'Test: weekly limit (ex: 1/week)',
              'No Logbook',
            ]}
          />
          <Plan
            title="STANDARD"
            price="~USD 20 / licence"
            subtitle="Serious Study (most popular)"
            highlight
            features={[
              'Flashcards: unlimited',
              'Practice: unlimited',
              'Test: weekly limit (ex: 3/week)',
              'No Logbook',
            ]}
          />
          <Plan
            title="PREMIUM"
            price="~USD 30 / licence"
            subtitle="Exam & Career"
            features={[
              'Everything unlimited',
              'Test: unlimited',
              'Logbook included (professional tool)',
              'Priority access to new modules for that licence',
            ]}
          />
        </div>

        <GlassPanel className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-white font-semibold">Why this is fair (and sells better)</div>
              <p className="text-sm text-white/75">
                Competitors charging one flat price make people pay for modules they don&apos;t need. Here you buy only the licence
                you&apos;re targeting — exactly how Transport Canada structures the exams.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-white font-semibold">REGS is separate on purpose</div>
              <p className="text-sm text-white/75">
                REGS (CARs + Standards) is shared knowledge across ratings. Unlock once and it follows you no matter which licence
                you focus on.
              </p>
            </div>
          </div>
        </GlassPanel>

        <div className="flex items-center justify-between text-sm text-white/70">
          <Link className="hover:text-white" href={ROUTES.landing}>
            ← Back to home
          </Link>
          <div className="flex items-center gap-4">
            <Link className="hover:text-white" href={ROUTES.terms}>Terms</Link>
            <Link className="hover:text-white" href={ROUTES.privacy}>Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
