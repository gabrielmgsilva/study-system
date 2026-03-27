'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/lib/routes';

import {
  BookOpen,
  User,
  ClipboardList,
  Info,
  Search,
  MessageSquare,
  ChevronRight,
  X,
  LifeBuoy,
  GraduationCap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function PillButton({
  title,
  href,
  onClick,
  icon,
}: {
  title: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
}) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 text-left">
        <div className="leading-tight font-semibold text-slate-900">{title}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-[18px] border border-slate-200 bg-white transition hover:bg-slate-50"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[18px] border border-slate-200 bg-white transition hover:bg-slate-50"
    >
      {content}
    </button>
  );
}

function TipsTicker() {
  const tips = [
    'Tip: Use Test Mode (25Q/50Q) pra simular Transport Canada.',
    'Tip: Se travar num tópico, faça “Study focus + Copy” e revise.',
    'Tip: Most missed topics first = ganho rápido de nota.',
    'Tip: Faça hard reset de vez em quando pra validar estado real.',
  ];

  const [idx, setIdx] = useState(0);

  React.useEffect(() => {
    const t = setInterval(() => {
      setIdx((v) => (v + 1) % tips.length);
    }, 3800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
      <span className="mr-2 text-slate-400">•</span>
      {tips[idx]}
    </div>
  );
}

export function AppHomePage() {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState('');

  const footerLinks: Array<{ label: string; href: string }> = [
    { label: 'About', href: ROUTES.about },
    { label: 'Instructions', href: ROUTES.instructions },
    { label: 'Help', href: ROUTES.help },
    { label: 'Terms', href: ROUTES.terms },
    { label: 'Privacy', href: ROUTES.privacy },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-2xl font-semibold tracking-tight text-slate-900">
              AME ONE
            </div>
            <div className="text-sm text-slate-500">
              Your study cockpit — faster, cleaner, more consistent.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Link href={ROUTES.student}>
                <User className="h-4 w-4 mr-2" />
                Student
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Link href={ROUTES.appHub}>
                <BookOpen className="h-4 w-4 mr-2" />
                Study
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 overflow-hidden rounded-[26px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl text-slate-900">Quick Actions</CardTitle>
              <CardDescription className="text-slate-500">
                Navigate the app faster (and keep routes consistent).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <PillButton
                  title="Go to Student Area"
                  href={ROUTES.student}
                  icon={<GraduationCap className="h-5 w-5 text-white" />}
                />

                <PillButton
                  title="Go to Study"
                  href={ROUTES.appHub}
                  icon={<BookOpen className="h-5 w-5 text-white" />}
                />

                <PillButton
                  title="M Logbook"
                  href={ROUTES.mLogbook}
                  icon={<ClipboardList className="h-5 w-5 text-white" />}
                />

                <PillButton
                  title="Find a Question (by ID)"
                  icon={
                    showSearch ? (
                      <X className="h-5 w-5 text-white" />
                    ) : (
                      <Search className="h-5 w-5 text-white" />
                    )
                  }
                  onClick={() => {
                    setShowSearch((v) => !v);
                  }}
                />
              </div>

              {showSearch && (
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-sm text-slate-600">
                    Paste a Question ID (example: E-RA-001)
                  </div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Question ID..."
                      className="border-slate-200 bg-white text-slate-700 placeholder:text-slate-400"
                    />
                    <Button
                      className="bg-[#2d4bb3] text-white hover:bg-[#243d99]"
                      onClick={() => {
                        const id = q.trim();
                        if (!id) return;
                        router.push(
                          `${ROUTES.appHub}?find=${encodeURIComponent(id)}`
                        );
                      }}
                    >
                      Search
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    (Note: this keeps query-param navigation; route stays under
                    /app.)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[26px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <div className="relative h-full">
              <div className="absolute inset-0">
                <Image
                  src="/home/bg.png"
                  alt=""
                  fill
                  className="object-cover opacity-[0.08]"
                  priority
                />
              </div>

              <div className="relative p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-[#2d4bb3]" />
                  <div className="font-semibold text-slate-900">Support</div>
                </div>

                <div className="space-y-2">
                  <PillButton
                    title="How to Become an AME (Canada)"
                    href={ROUTES.becomeAme}
                    icon={<Info className="h-5 w-5 text-white" />}
                  />
                  <PillButton
                    title="Send Feedback"
                    href={ROUTES.feedback}
                    icon={<MessageSquare className="h-5 w-5 text-white" />}
                  />
                  <PillButton
                    title="App Instructions / FAQ"
                    href={ROUTES.instructions}
                    icon={<Info className="h-5 w-5 text-white" />}
                  />
                  <PillButton
                    title="Help / Support"
                    href={ROUTES.help}
                    icon={<LifeBuoy className="h-5 w-5 text-white" />}
                  />
                  <PillButton
                    title="About"
                    href={ROUTES.about}
                    icon={<Info className="h-5 w-5 text-white" />}
                  />
                </div>

                <div className="text-xs text-slate-500">
                  Public pages (outside /app) are kept as-is until we add them to
                  ROUTES.
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <div className="shrink-0 space-y-2 border-t border-slate-200 bg-white p-3 md:p-4">
              <div className="flex flex-wrap gap-1.5 text-slate-600">
                {footerLinks.map(({ label, href }) => (
                  <Button
                    key={label}
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-50"
                  >
                    <Link href={href}>{label}</Link>
                  </Button>
                ))}
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-2">
                <TipsTicker />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}