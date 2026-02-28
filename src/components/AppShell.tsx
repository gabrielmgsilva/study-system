import React from "react";
import Link from "next/link";
import Image from "next/image";

type AppShellProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  maxWidthClass?: string; // ex.: "max-w-5xl" | "max-w-6xl"
  children: React.ReactNode;
};

export default function AppShell({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Back to Home",
  maxWidthClass = "max-w-6xl",
  children,
}: AppShellProps) {
  return (
    <div className="min-h-[100dvh] bg-[#0b1220] p-4 md:p-8">
      <div className={`${maxWidthClass} mx-auto`}>
        <div
          className="
            relative rounded-[48px] border border-white/10 shadow-xl overflow-hidden
            h-[calc(100dvh-2rem)] md:h-[calc(100dvh-4rem)]
          "
        >
          {/* Background (Home style) */}
          <div className="absolute inset-0">
            <Image
              src="/home/bg.png"
              alt="Aviation background"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#061427]/85 via-[#061427]/50 to-[#1b1307]/65" />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          <div className="relative z-10 h-full flex flex-col">
            {/* Scroll area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
              <div className="p-5 md:p-8 space-y-4">
                {(title || subtitle) && (
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={backHref}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <span className="text-sm">←</span>
                      <span className="text-sm">{backLabel}</span>
                    </Link>

                    <div className="text-right">
                      {title && (
                        <div className="text-sm font-semibold text-white">
                          {title}
                        </div>
                      )}
                      {subtitle && (
                        <div className="text-xs text-white/60">{subtitle}</div>
                      )}
                    </div>
                  </div>
                )}

                {children}

                <div className="h-2 md:h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
