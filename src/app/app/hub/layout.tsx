import "server-only";
import React from "react";
import AppShell from "@/components/AppShell";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Study Hub"
      subtitle="Choose your licence. Modules show lock status based on your credits/unlocks."
      backHref="/app"
      backLabel="Back to Home"
      maxWidthClass="max-w-6xl"
      showHeader={false}
    >
      {children}
    </AppShell>
  );
}
