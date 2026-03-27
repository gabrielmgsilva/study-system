import "server-only";
import AppShell from "@/components/AppShell";
import ModuleGate from "@/lib/ModuleGate";
import { ROUTES } from "@/lib/routes";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="M — Standard Practices"
      subtitle="Standard Practices module for Transport Canada M exams"
      backHref={ROUTES.m}
      backLabel="Back to M"
      maxWidthClass="max-w-6xl"
      showHeader={false}
    >
      <ModuleGate
        licenseId="m"
        moduleId="standard-practices"
        title="M — Standard Practices"
        backHref={ROUTES.m}
      >
        {children}
      </ModuleGate>
    </AppShell>
  );
}
