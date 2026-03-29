import "server-only";
import AppShell from "@/components/AppShell";
import ModuleGate from "@/lib/ModuleGate";
import { ROUTES } from '@/lib/routes';


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Avionics"
      subtitle="Prepare for Transport Canada exams — Avionics"
      backHref="/app"
      backLabel="Back to Home"
      maxWidthClass="max-w-6xl"
      showHeader={false}
    >
      <ModuleGate licenseId="e" title="Avionics" backHref={ROUTES.appHome}>
        {children}
      </ModuleGate>
    </AppShell>
  );
}
