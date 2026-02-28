import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const LAST_UPDATED = '2026-01-01';

// Classes "theme-safe": funcionam em dark e light
const glassBtn =
  'border-border/60 bg-background/60 text-foreground backdrop-blur hover:bg-background/80';
const glassPanel = 'border-border/50 bg-background/60 backdrop-blur';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" className={glassBtn}>
              <Link href={ROUTES.terms}>Terms of Use</Link>
            </Button>

            <Button asChild variant="outline" className={glassBtn}>
              <Link href={ROUTES.landing} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>

        <Card className={glassPanel}>
          <CardHeader>
            <CardTitle>PRIVACY POLICY — AME ONE</CardTitle>
            <CardDescription>Effective as of {LAST_UPDATED}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Information We Collect</h2>
              <p>
                We may collect: name and email address, account login
                information, usage data (modules accessed, progress, credits
                used), and feedback voluntarily provided by users.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">How We Use Information</h2>
              <p>
                Your data is used to provide and improve the AME ONE service,
                track study progress, respond to support requests, and improve
                content quality.
              </p>
              <p>We do not sell user data.</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">
                Data Storage &amp; Security
              </h2>
              <p>
                User data is stored securely using industry-standard practices.
              </p>
              <p>
                We take reasonable measures to protect personal information from
                unauthorized access.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Sharing of Information</h2>
              <p>
                We do not share personal data with third parties, except when
                required by law or necessary to operate the service (e.g. hosting
                providers).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">User Rights</h2>
              <p>
                Depending on your jurisdiction (including Canada – PIPEDA), you
                may request access, correction, or deletion of your data, and
                close your account at any time.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Cookies &amp; Analytics</h2>
              <p>
                AME ONE may use cookies or analytics tools to improve user
                experience.
              </p>
              <p>These tools do not collect sensitive personal information.</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Changes to This Policy</h2>
              <p>This Privacy Policy may be updated periodically.</p>
              <p>
                Continued use of the app indicates acceptance of the updated
                policy.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Contact</h2>
              <p>
                For privacy-related questions, contact:{' '}
                <span className="font-medium">privacy@ameone.app</span>
              </p>
              <p className="text-xs text-muted-foreground">(placeholder)</p>
            </section>

            {/* Bottom cross-link */}
            <section className="pt-6 border-t border-border/40">
              <div className={`rounded-xl border p-4 space-y-3 ${glassPanel}`}>
                <p className="text-sm text-muted-foreground">
                  For general terms and conditions governing the use of AME ONE,
                  please review our Terms of Use.
                </p>

                <Button asChild variant="outline" className={glassBtn}>
                  <Link href={ROUTES.terms}>View Terms of Use</Link>
                </Button>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
