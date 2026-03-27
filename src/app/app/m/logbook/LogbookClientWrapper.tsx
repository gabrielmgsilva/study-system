'use client';

import React, { useEffect, useState } from 'react';
import { ensureLogbookId } from '@/lib/logbookBootstrap';
import LogbookUI from './LogbookUI';
import type { LogbookProfileId, LicenceType } from './logbookProfiles';

type LicenceKey = LogbookProfileId;

export default function LogbookClientWrapper({
  licenceKey = 'm',
  initialLicenceType = 'M',
}: {
  licenceKey?: LicenceKey;
  initialLicenceType?: LicenceType;
}) {
  const [logbookId, setLogbookId] = useState<string>('');
  const [bootError, setBootError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const id = await ensureLogbookId(licenceKey);
        setLogbookId(id);
      } catch (e: any) {
        setBootError(e?.message ?? 'Bootstrap error');
      }
    })();
  }, [licenceKey]);

  if (bootError) {
    return (
      <div className="p-6">
        <div className="text-red-600 font-semibold">Bootstrap error</div>
        <div className="text-sm mt-2">{bootError}</div>
      </div>
    );
  }

  if (!logbookId) {
    return <div className="p-6 text-slate-700">Loading logbook…</div>;
  }

  return (
    <LogbookUI
      logbookId={logbookId}
      initialLicenceType={initialLicenceType}
      profileId={licenceKey}
    />
  );
}
