import "server-only";
import AppShell from "@/components/AppShell";
import ModuleGate from "@/lib/ModuleGate";
import { ROUTES } from '@/lib/routes';


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Balloons"
      subtitle="Licence B — Study & Logbook"
      backHref="/app"
      backLabel="Back to Home"
      maxWidthClass="max-w-6xl"
      showHeader={false}
    >
      <ModuleGate licenseId="balloons" title="Balloons" backHref={ROUTES.landing}>
        {children}
      </ModuleGate>
    </AppShell>
  );
}
