import React from "react";
import Link from "next/link";

type AppShellProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  maxWidthClass?: string; // ex.: "max-w-5xl" | "max-w-6xl"
  showHeader?: boolean;
  children: React.ReactNode;
};

export default function AppShell({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Back to Home",
  maxWidthClass = "max-w-6xl",
  showHeader = true,
  children,
}: AppShellProps) {
  return (
    <div className={`${maxWidthClass} mx-auto w-full space-y-6`}>
      {showHeader && (title || subtitle) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={backHref}
            className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-50"
          >
            <span className="text-sm">←</span>
            <span className="text-sm">{backLabel}</span>
          </Link>

          <div className="sm:text-right">
            {title && <div className="text-sm font-semibold text-slate-900">{title}</div>}
            {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
          </div>
        </div>
      )}

      {children}
      <div className="h-2 md:h-4" />
    </div>
  );
}
