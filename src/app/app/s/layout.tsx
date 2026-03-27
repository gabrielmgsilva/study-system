import React from 'react';

import AppShell from '@/components/AppShell';
import ModuleGate from '@/lib/ModuleGate';
import { ROUTES } from '@/lib/routes';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="S Rating — Structures"
      subtitle="Standard Practices, Structures Rating, Logbook"
      backHref={ROUTES.appHome}
      backLabel="Back to App Home"
      showHeader={false}
    >
      <ModuleGate
        licenseId="s"
        title="S Rating — Structures"
        backHref={ROUTES.appHome}
      >
        {children}
      </ModuleGate>
    </AppShell>
  );
}
