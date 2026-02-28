import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

export default function RegsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
            <ShieldCheck className="h-3 w-3 text-white/90" />
            <span>REGS – CARs &amp; Standards</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Regulatory Requirements
          </h1>

          <p className="text-sm text-white/75 max-w-2xl">
            Browse Transport Canada CARs and Standards topics and build a study deck
            by section (based on the TC guide).
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-white/15 bg-white/10 text-white hover:bg-white/15"
        >
          {/* volta pro hub M (ou pro hub geral se você preferir) */}
          <Link href={ROUTES.m} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to M
          </Link>
        </Button>
      </div>

      {children}
    </div>
  );
}
