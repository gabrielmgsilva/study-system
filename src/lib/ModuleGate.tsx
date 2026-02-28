// src/lib/ModuleGate.tsx
import React from 'react';

import type { LicenseId } from '@/lib/routes';
import { getEffectiveFlag } from '@/lib/moduleFlags';

type Props = {
  licenseId: LicenseId;
  moduleId?: any; // opcional (home pode não ter)
  title: string;
  backHref?: string;
  children: React.ReactNode;
};

export default function ModuleGate({
  licenseId,
  moduleId,
  title,
  backHref,
  children,
}: Props) {
  const flag = getEffectiveFlag(licenseId as any, moduleId as any);

  if (flag.status === 'active') return <>{children}</>;

  return (
    <div className="mx-auto w-full max-w-3xl py-10">
      <div className="rounded-[26px] border border-white/12 bg-white/8 p-6 backdrop-blur-md">
        <div className="text-xs text-white/60">Module status</div>
        <h1 className="mt-1 text-xl font-semibold text-white">{title}</h1>

        <div className="mt-3 inline-flex items-center rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-white/80">
          {flag.status === 'coming_soon' ? 'Coming soon' : 'Under maintenance'}
        </div>

        <p className="mt-3 text-sm text-white/70">
          {flag.message || 'This content is not available right now.'}
        </p>

        {backHref ? (
          <div className="mt-5">
            <a
              href={backHref}
              className="inline-flex items-center rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-sm text-white hover:bg-black/50"
            >
              Back
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
