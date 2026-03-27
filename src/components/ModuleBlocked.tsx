// src/components/ModuleBlocked.tsx
import Link from "next/link";
import type { ModuleStatus } from "@/lib/moduleFlags";
import ModuleStatusBadge from "@/components/ModuleStatusBadge";

export default function ModuleBlocked({
  title,
  status,
  message,
  backHref = "/",
}: {
  title: string;
  status: ModuleStatus;
  message?: string;
  backHref?: string;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            <ModuleStatusBadge status={status} />
          </div>

          <p className="mt-3 text-sm text-slate-500">
            {message ??
              "This module is not available right now. Please check back later."}
          </p>

          <div className="mt-6">
            <Link
              href={backHref}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
