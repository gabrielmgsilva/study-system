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
import { ROUTES } from '@/lib/routes';

const LAST_UPDATED = '2026-01-01';

// Classes "theme-safe": funcionam em dark e light
const glassBtn =
  'border-border/60 bg-background/60 text-foreground backdrop-blur hover:bg-background/80';
const glassPanel = 'border-border/50 bg-background/60 backdrop-blur';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Terms of Use
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" className={glassBtn}>
              <Link href={ROUTES.privacy}>Privacy Policy</Link>
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
            <CardTitle>TERMS OF USE — AME ONE</CardTitle>
            <CardDescription>Effective as of {LAST_UPDATED}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Purpose of the App</h2>
              <p>
                AME ONE is an educational platform designed to help users prepare
                for aviation maintenance exams, including Transport Canada AME
                examinations.
              </p>
              <p>
                AME ONE is not affiliated with, endorsed by, or operated by
                Transport Canada or any government authority.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Educational Use Only</h2>
              <p>
                All content provided in AME ONE is for study and educational
                purposes only.
              </p>
              <p>
                The app does not guarantee exam success, certification,
                licensing, or employment.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">User Accounts</h2>
              <p>
                Users are responsible for maintaining the confidentiality of
                their account.
              </p>
              <p>You must provide accurate information during registration.</p>
              <p>
                Accounts may be suspended or terminated if misuse or abuse is
                detected.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Credits and Payments</h2>
              <p>
                AME ONE uses a credit-based system to access certain features.
              </p>
              <p>
                Credits are consumed when starting specific activities (e.g.
                practice tests).
              </p>
              <p>Credits are non-refundable, unless required by applicable law.</p>
              <p>
                Users are responsible for confirming actions before spending
                credits.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Intellectual Property</h2>
              <p>
                All content, including questions, explanations, layouts, and
                branding, is the property of AME ONE or its content partners.
              </p>
              <p>
                Content may not be copied, redistributed, or resold without
                permission.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Limitation of Liability</h2>
              <p>AME ONE is provided “as is”.</p>
              <p>
                AME ONE is not responsible for exam results, licensing
                decisions, career outcomes, or errors or omissions in content.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Changes to the Service</h2>
              <p>
                AME ONE may update features, content, pricing, or these Terms at
                any time.
              </p>
              <p>
                Continued use of the app constitutes acceptance of the updated
                Terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Governing Law</h2>
              <p>These Terms are governed by the laws of Canada.</p>
            </section>

            {/* Bottom cross-link */}
            <section className="pt-6 border-t border-border/40">
              <div className={`rounded-xl border p-4 space-y-3 ${glassPanel}`}>
                <p className="text-sm text-muted-foreground">
                  For details on how personal information is collected, used,
                  and protected, please review our Privacy Policy.
                </p>

                <Button asChild variant="outline" className={glassBtn}>
                  <Link href={ROUTES.privacy}>View Privacy Policy</Link>
                </Button>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
