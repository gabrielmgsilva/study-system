'use client';

import React from 'react';
import Link from 'next/link';

import EntitlementGuard from '@/components/EntitlementGuard';
import { ROUTES } from '@/lib/routes';

export default function ELogbookPage() {
  return (
    <EntitlementGuard moduleKey="e.logbook" title="Logbook — E">
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full border border-white/10 rounded-2xl bg-background/60 p-6">
          <div className="text-xl font-semibold">Logbook (E)</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Placeholder for now. We'll build the E logbook later (after the license pages are fully migrated).
          </p>

          <div className="mt-4 flex gap-2">
            <Link
              href={ROUTES.eHub}
              className="px-3 py-2 rounded-md border border-white/10 hover:bg-white/5 text-sm"
            >
              ← Back to E Hub
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
