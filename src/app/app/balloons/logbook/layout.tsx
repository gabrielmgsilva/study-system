import 'server-only';
import ModuleGate from '@/lib/ModuleGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGate
      licenseId="balloons"
      moduleId="logbook"
      title="Balloons Logbook"
      backHref="/balloons"
    >
      {children}
    </ModuleGate>
  );
}
