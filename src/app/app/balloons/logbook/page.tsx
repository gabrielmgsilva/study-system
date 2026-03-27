'use client';

import EntitlementGuard from '@/components/EntitlementGuard';
import LogbookClientWrapper from '../../m/logbook/LogbookClientWrapper';

export default function BalloonsLogbookPage() {
  return (
    <EntitlementGuard moduleKey="balloons.logbook" title="Logbook — Balloons">
      <LogbookClientWrapper licenceKey="balloons" initialLicenceType="B" />
    </EntitlementGuard>
  );
}
