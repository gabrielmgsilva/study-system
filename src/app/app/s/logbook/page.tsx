'use client';

import EntitlementGuard from '@/components/EntitlementGuard';
import LogbookClientWrapper from '../../m/logbook/LogbookClientWrapper';

export default function SLogbookPage() {
  return (
    <EntitlementGuard moduleKey="s.logbook" title="Logbook — S">
      <LogbookClientWrapper licenceKey="s" initialLicenceType="S" />
    </EntitlementGuard>
  );
}
