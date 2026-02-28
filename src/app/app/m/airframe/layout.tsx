import "server-only";
import AppShell from "@/components/AppShell";
import ModuleGate from "@/lib/ModuleGate";
import { ROUTES } from '@/lib/routes';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="M1/M2 — Airframe"
      subtitle="Airframe module for Transport Canada M1/M2 exams"
      backHref={ROUTES.m}
      backLabel="Back to M1/M2"
      maxWidthClass="max-w-6xl"
    >
      <ModuleGate
        licenseId="m"
        moduleId="airframe"
        title="M1/M2 — Airframe"
        backHref={ROUTES.m}
      >
        {children}
      </ModuleGate>
    </AppShell>
  );
}
