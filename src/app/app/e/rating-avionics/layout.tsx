import "server-only";
import AppShell from "@/components/AppShell";
import ModuleGate from "@/lib/ModuleGate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Avionics — Systems"
      subtitle="Avionics systems for Transport Canada exams"
      backHref="/avionics"
      backLabel="Back to Avionics"
      maxWidthClass="max-w-6xl"
    >
      <ModuleGate
        licenseId="avionics"
        moduleId="systems"
        title="Avionics"
        backHref="/avionics"
      >
        {children}
      </ModuleGate>
    </AppShell>
  );
}
