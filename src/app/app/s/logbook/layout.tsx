import "server-only";
import ModuleGate from "@/lib/ModuleGate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGate
      licenseId="structures"
      moduleId="logbook" // 🔁 AJUSTE CONFORME A PASTA
      title="Structures"
      backHref="/structures"
    >
      {children}
    </ModuleGate>
  );
}
