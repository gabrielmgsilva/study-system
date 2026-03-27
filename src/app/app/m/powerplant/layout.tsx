import "server-only";
import AppShell from "@/components/AppShell";
import ModuleGate from "@/lib/ModuleGate";
import { ROUTES } from "@/lib/routes";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="M — Powerplant"
      subtitle="Powerplant module for Transport Canada M exams"
      backHref={ROUTES.m}
      backLabel="Back to M"
      maxWidthClass="max-w-6xl"
      showHeader={false}
    >
      <ModuleGate licenseId="m" moduleId="powerplant" title="M — Powerplant" backHref={ROUTES.m}>
        {children}
      </ModuleGate>
    </AppShell>
  );
}
