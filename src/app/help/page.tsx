'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  ArrowLeft,
  Mail,
  Bug,
  HelpCircle,
  Send,
  CheckCircle2,
} from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

const MODULES = [
  'General',
  'Study / Practice / Test',
  'CARs / REGS',
  'Standard Practices',
  'Airframe',
  'Powerplant',
  'Avionics (E)',
  'Structures (S)',
  'Balloons (B)',
  'Logbook',
  'Billing / Credits',
];

export default function HelpPage() {
  const supportEmail = 'support@ameone.app';

  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [module, setModule] = useState('General');
  const [userEmail, setUserEmail] = useState('');

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = useMemo(() => {
    return subject.trim().length >= 3 && desc.trim().length >= 10;
  }, [subject, desc]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending || !canSend) return;

    setSending(true);
    setSent(false);

    // UI-only: simulate sending (no backend yet)
    await new Promise((r) => setTimeout(r, 700));

    setSending(false);
    setSent(true);
  }

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
            <div className="text-sm font-semibold text-white">Support / Help</div>
            <div className="text-xs text-white/60">
              Contacting support does not use credits.
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <LifeBuoy className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-semibold text-white">
                Found an issue?
              </h1>
              <p className="text-sm text-white/70">
                If something broke, feels confusing, or you think credits were spent by mistake,
                contact us here.
              </p>

              <div className="text-sm text-white/80 pt-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-white/70" />
                <a
                  className="underline underline-offset-4 hover:text-white"
                  href={`mailto:${supportEmail}`}
                >
                  {supportEmail}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Quick FAQ */}
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Quick FAQ
              </CardTitle>
              <CardDescription className="text-white/65">
                The most common issues.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  “I spent credits by mistake”
                </div>
                <p className="mt-1 text-sm text-white/75">
                  Send as many details as possible (what you clicked, which module, and approximate time).
                  We will investigate.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  “A page doesn’t open / shows an error”
                </div>
                <p className="mt-1 text-sm text-white/75">
                  Tell us your device and what you see. A screenshot helps a lot.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  “I don’t understand Study/Practice/Test”
                </div>
                <p className="mt-1 text-sm text-white/75">
                  Check{' '}
                  <Link
                    className="underline underline-offset-4"
                    href={ROUTES.instructions}
                  >
                    App Instructions / FAQ
                  </Link>
                  , and if you still need help, message us here.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact form (UI only) */}
          <Card className="rounded-[28px] border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Contact form
              </CardTitle>
              <CardDescription className="text-white/65">
                (UI only — no backend yet)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <div className="text-xs text-white/70">Subject</div>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Bug when opening Practice"
                    className="bg-white/10 border-white/15 text-white placeholder:text-white/45"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-white/70">Issue description</div>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="What did you try to do? What happened? (include IDs, module, and approximate time)"
                    className="w-full min-h-[120px] rounded-md bg-white/10 border border-white/15 text-white placeholder:text-white/45 p-3 text-sm outline-none focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-white/70">Related module</div>
                    <select
                      value={module}
                      onChange={(e) => setModule(e.target.value)}
                      className="w-full rounded-md bg-white/10 border border-white/15 text-white p-2 text-sm outline-none"
                    >
                      {MODULES.map((m) => (
                        <option key={m} value={m} className="bg-[#0b1220]">
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-white/70">
                      Your email (optional)
                    </div>
                    <Input
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="you@..."
                      className="bg-white/10 border-white/15 text-white placeholder:text-white/45"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-white/60">
                    Support contact does not use credits.
                  </div>

                  <Button type="submit" disabled={!canSend || sending}>
                    {sending ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>

                {sent && (
                  <div className="rounded-[18px] border border-emerald-200/20 bg-emerald-200/10 p-3 text-sm text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white/80" />
                    Message recorded (simulation). Use the email above for real contact.
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            asChild
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Link href={ROUTES.becomeAme}>How to Become an AME</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.instructions}>App Instructions</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
