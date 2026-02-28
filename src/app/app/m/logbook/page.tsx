'use client';

import EntitlementGuard from '@/components/EntitlementGuard';
import LogbookClientWrapper from './LogbookClientWrapper';

export default function Page() {
  return (
    <EntitlementGuard moduleKey="m.logbook" title="M Logbook">
      <LogbookClientWrapper />
    </EntitlementGuard>
  );
}
