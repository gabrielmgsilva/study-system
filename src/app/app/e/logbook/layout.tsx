import "server-only";
import ModuleGate from "@/lib/ModuleGate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGate
      licenseId="avionics"
      moduleId="logbook" // 🔁 AJUSTE CONFORME A PASTA
      title="Avionics"
      backHref="/avionics"
    >
      {children}
    </ModuleGate>
  );
}
