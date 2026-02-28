'use client';

import React from 'react';
import Link from 'next/link';
import { User, CreditCard } from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import LogoutButton from '@/components/auth/LogoutButton';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen ame-bg relative">
      {/* Extra overlay (helps readability on busy backgrounds) */}
      <div className="fixed inset-0 -z-10 bg-black/35" />

      {/* Top App Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/45 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          {/* Left: Brand */}
          <Link href={ROUTES.appHome} className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl border border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
              {/* ✅ Your logo in public/home/logo.svg */}
              <img
                src="/home/logo.svg"
                alt="AME ONE"
                className="h-6 w-6 object-contain"
              />
            </div>

            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">AME ONE</div>
              <div className="text-[11px] text-white/60">
                AME Study Platform
              </div>
            </div>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white/80 hover:text-white"
            >
              <Link href={ROUTES.student}>
                <User className="h-4 w-4 mr-1" />
                Student Area
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white/80 hover:text-white"
            >
              <Link href={ROUTES.account}>
                <CreditCard className="h-4 w-4 mr-1" />
                My Account
              </Link>
            </Button>

            <LogoutButton />
          </div>
        </div>
      </header>

      <Separator />

      {/* Main App Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
