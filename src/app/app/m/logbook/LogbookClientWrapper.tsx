'use client';

import React, { useEffect, useState } from 'react';
import { ensureLogbookId } from '@/lib/logbookBootstrap';
import LogbookUI from './LogbookUI';

export default function LogbookClientWrapper() {
  const [logbookId, setLogbookId] = useState<string>('');
  const [bootError, setBootError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        // ✅ contrato novo
        const id = await ensureLogbookId('m');
        setLogbookId(id);
      } catch (e: any) {
        setBootError(e?.message ?? 'Bootstrap error');
      }
    })();
  }, []);

  if (bootError) {
    return (
      <div className="p-6">
        <div className="text-red-600 font-semibold">Bootstrap error</div>
        <div className="text-sm mt-2">{bootError}</div>
      </div>
    );
  }

  if (!logbookId) {
    return <div className="p-6 text-gray-700">Loading logbook…</div>;
  }

  return <LogbookUI logbookId={logbookId} />;
}
