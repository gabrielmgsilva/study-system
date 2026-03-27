// src/components/ModuleStatusBadge.tsx
import React from "react";
import type { ModuleStatus } from "@/lib/moduleFlags";
import { getModuleLabel } from "@/lib/moduleFlags";

export default function ModuleStatusBadge({
  status,
  label,
}: {
  status: ModuleStatus;
  label?: string;
}) {
  const resolvedLabel = label ?? getModuleLabel(status);

  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium";
  const cls =
    status === "coming_soon"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : status === "maintenance"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return <span className={`${base} ${cls}`}>{resolvedLabel}</span>;
}
