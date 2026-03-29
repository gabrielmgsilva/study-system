import "server-only";
import AppShell from "@/components/AppShell";
import ModuleGate from "@/lib/ModuleGate";
import { ROUTES } from '@/lib/routes';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Avionics — Standard Practices"
      subtitle="Standard Practices for Avionics (E)"
      backHref={ROUTES.eHub}
      backLabel="Back to Avionics"
      maxWidthClass="max-w-6xl"
      showHeader={false}
    >
      <ModuleGate
        licenseId="e"
        moduleId="standard-practices"
        title="Avionics"
        backHref={ROUTES.eHub}
      >
        {children}
      </ModuleGate>
    </AppShell>
  );
}
