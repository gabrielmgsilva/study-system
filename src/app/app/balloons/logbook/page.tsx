'use client';

import React from 'react';
import Link from 'next/link';

import EntitlementGuard from '@/components/EntitlementGuard';
import { ROUTES } from '@/lib/routes';

export default function BalloonsLogbookPage() {
  return (
    <EntitlementGuard moduleKey="balloons.logbook" title="Logbook — Balloons">
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full border border-white/10 rounded-2xl bg-background/60 p-6">
          <div className="text-xl font-semibold">Logbook (Balloons)</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Placeholder for now. We'll build the Balloons logbook later (after the license pages are fully migrated).
          </p>

          <div className="mt-4 flex gap-2">
            <Link
              href={ROUTES.balloonsHub}
              className="px-3 py-2 rounded-md border border-white/10 hover:bg-white/5 text-sm"
            >
              ← Back to Balloons Hub
            </Link>
            <Link
              href={ROUTES.appHub}
              className="px-3 py-2 rounded-md border border-white/10 hover:bg-white/5 text-sm"
            >
              Licenses Hub
            </Link>
          </div>
        </div>
      </div>
    </EntitlementGuard>
  );
}
