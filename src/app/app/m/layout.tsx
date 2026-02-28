import "server-only";
import AppShell from "@/components/AppShell";
import ModuleGate from "@/lib/ModuleGate";
import { ROUTES } from '@/lib/routes';


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="M Hub"
      subtitle="Prepare for Transport Canada exams — M1 & M2"
      backHref={ROUTES.appHub}
      backLabel="Back to Home"
      maxWidthClass="max-w-6xl"
    >
      <ModuleGate licenseId="m" title="M" backHref={ROUTES.appHub}>
        {children}
      </ModuleGate>
    </AppShell>
  );
}
