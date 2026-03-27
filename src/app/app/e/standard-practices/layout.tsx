import "server-only";
import AppShell from "@/components/AppShell";
import ModuleGate from "@/lib/ModuleGate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Avionics — Standard Practices"
      subtitle="Standard Practices for Avionics (E)"
      backHref="/avionics"
      backLabel="Back to Avionics"
      maxWidthClass="max-w-6xl"
      showHeader={false}
    >
      <ModuleGate
        licenseId="avionics"
        moduleId="standard-Practices"
        title="Avionics"
        backHref="/avionics"
      >
        {children}
      </ModuleGate>
    </AppShell>
  );
}
