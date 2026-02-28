import React from 'react';

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

/**
 * GlassPanel
 * - Use for large readable blocks on top of blueprint background
 * - Guarantees contrast (inner overlay) so text never depends on the page background
 */
export function GlassPanel({
  children,
  className,
  tone = 'dark',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'dark' | 'light';
}) {
  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-[32px] border backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.35)]',
        tone === 'dark'
          ? 'border-white/12 bg-black/40'
          : 'border-white/18 bg-white/10',
        className,
      )}
    >
      {/* Readability overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/55" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_22%_12%,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * GlassCard
 * - Smaller card variant for tiles
 */
export function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-[26px] border border-white/12 bg-white/10 backdrop-blur-xl shadow-[0_8px_28px_rgba(0,0,0,0.30)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_320px_at_20%_10%,rgba(255,255,255,0.07),transparent_60%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
