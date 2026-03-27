'use client';

import EntitlementGuard from '@/components/EntitlementGuard';
import LogbookClientWrapper from '../../m/logbook/LogbookClientWrapper';

export default function ELogbookPage() {
  return (
    <EntitlementGuard moduleKey="e.logbook" title="Logbook — E">
      <LogbookClientWrapper licenceKey="e" initialLicenceType="E" />
    </EntitlementGuard>
  );
}
