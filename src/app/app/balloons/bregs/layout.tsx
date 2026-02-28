import 'server-only';
import React from 'react';
import Link from 'next/link';
import { Wind, ArrowLeft } from 'lucide-react';

import ModuleGate from '@/lib/ModuleGate';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';

export default function BalloonsBregsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGate
      licenseId="balloons"
      moduleId="bregs"
      title="Balloons — BREGS"
      backHref={ROUTES.balloonsHub}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
              <Wind className="h-4 w-4" />
              Licence B — Question Bank
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Balloons — BREGS
            </h1>
            <p className="text-white/75">
              Focused preparation for BREGS-style questions and balloon ops/maintenance knowledge.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/10 text-white hover:bg-white/15"
          >
            <Link href={ROUTES.balloonsHub} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        {children}
      </div>
    </ModuleGate>
  );
}
