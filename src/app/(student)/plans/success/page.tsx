'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PlanSuccessPage() {
  const router = useRouter();
  const polling = useRef(false);

  useEffect(() => {
    if (polling.current) return;
    polling.current = true;

    let cancelled = false;

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch('/api/me/subscription-status');
          if (res.ok) {
            const data = await res.json();
            if (data.active) {
              router.replace('/onboarding/licenses');
              return;
            }
          }
        } catch {
          // retry on network errors
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Setting up your account…</h1>
        <p className="text-sm text-muted-foreground">
          This may take a few seconds. Please don&apos;t close this page.
        </p>
      </div>
    </main>
  );
}
