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

// --------------------------------------------------------
// Helpers UI
// --------------------------------------------------------

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
        <div className="font-semibold text-white leading-tight">{title}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-white/70" />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-[18px] border border-white/10 bg-white/5 hover:bg-white/10 transition"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[18px] border border-white/10 bg-white/5 hover:bg-white/10 transition"
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
    <div className="rounded-[18px] px-4 py-3 text-white/80 text-sm">
      <span className="text-white/60 mr-2">•</span>
      {tips[idx]}
    </div>
  );
}

// --------------------------------------------------------
// Page
// --------------------------------------------------------

export default function AppHomePage() {
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
    <div className="min-h-screen bg-gradient-to-br from-[#050a14] via-[#061427] to-[#050a14] p-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-white text-2xl font-semibold tracking-tight">
              AME ONE
            </div>
            <div className="text-white/70 text-sm">
              Your study cockpit — faster, cleaner, more consistent.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href={ROUTES.student}>
                <User className="h-4 w-4 mr-2" />
                Student
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href={ROUTES.appHub}>
                <BookOpen className="h-4 w-4 mr-2" />
                Study
              </Link>
            </Button>
          </div>
        </div>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 overflow-hidden rounded-[26px] border-white/10 bg-white/5 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-white text-xl">Quick Actions</CardTitle>
              <CardDescription className="text-white/70">
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
                <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <div className="text-white/80 text-sm mb-2">
                    Paste a Question ID (example: E-RA-001)
                  </div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Question ID..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <Button
                      className="bg-white text-black hover:bg-white/90"
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
                  <div className="text-white/50 text-xs mt-2">
                    (Note: this keeps query-param navigation; route stays under
                    /app.)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right panel */}
          <Card className="overflow-hidden rounded-[26px] border-white/10 bg-white/5 backdrop-blur">
            <div className="relative h-full">
              <div className="absolute inset-0">
                <Image
                  src="/home/bg.png"
                  alt=""
                  fill
                  className="object-cover opacity-40"
                  priority
                />
              </div>

              <div className="relative p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-white" />
                  <div className="text-white font-semibold">Support</div>
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

                <div className="text-white/60 text-xs">
                  Public pages (outside /app) are kept as-is until we add them to
                  ROUTES.
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="max-w-6xl mx-auto">
          <div className="rounded-[26px] border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
            <div className="shrink-0 p-3 md:p-4 border-t border-white/10 bg-white/10 backdrop-blur-md space-y-2">
              <div className="flex flex-wrap gap-1.5 text-white/80">
                {footerLinks.map(({ label, href }) => (
                  <Button
                    key={label}
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Link href={href}>{label}</Link>
                  </Button>
                ))}
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/10 backdrop-blur p-2">
                <TipsTicker />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
