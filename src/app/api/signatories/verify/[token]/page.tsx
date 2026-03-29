'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';

type Point = { x: number; y: number };
type Stroke = Point[];

function pointsToPath(points: Stroke) {
  if (!points.length) return '';
  const d: string[] = [];
  d.push(`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`);
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const next = points[i + 1];
    const mx = (p.x + next.x) / 2;
    const my = (p.y + next.y) / 2;
    d.push(`Q ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`);
  }
  const last = points[points.length - 1];
  d.push(`L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`);
  return d.join(' ');
}

function buildSignatureSvg(strokes: Stroke[], width: number, height: number) {
  const paths = strokes
    .filter((s) => s.length > 1)
    .map(
      (s) =>
        `<path d="${pointsToPath(s)}" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${paths}</svg>`;
}

function getPoint(e: PointerEvent, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(r.width, e.clientX - r.left)),
    y: Math.max(0, Math.min(r.height, e.clientY - r.top)),
  };
}

export default function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const PAD_W = 520;
  const PAD_H = 180;

  const padRef = useRef<HTMLDivElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke>([]);
  const drawingRef = useRef(false);

  const [, force] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>('');

  const liveSvg = useMemo(() => {
    const strokes = [...strokesRef.current];
    if (currentRef.current.length > 1) strokes.push(currentRef.current);
    return buildSignatureSvg(strokes, PAD_W, PAD_H);
  }, [force, saving, done]);

  useEffect(() => {
    const el = padRef.current;
    if (!el) return;

    const down = (e: PointerEvent) => {
      e.preventDefault();
      drawingRef.current = true;
      el.setPointerCapture(e.pointerId);
      currentRef.current = [getPoint(e, el)];
      force((x) => x + 1);
    };

    const move = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      currentRef.current.push(getPoint(e, el));
      force((x) => x + 1);
    };

    const up = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      if (currentRef.current.length > 1) strokesRef.current.push(currentRef.current);
      currentRef.current = [];
      force((x) => x + 1);
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);

    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, []);

  const clear = () => {
    strokesRef.current = [];
    currentRef.current = [];
    force((x) => x + 1);
  };

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      const svg = buildSignatureSvg(strokesRef.current, PAD_W, PAD_H);
      const res = await fetch('/api/signatories/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signatureSvg: svg }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Verification failed');
      setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 flex justify-center">
      <div className="w-full max-w-lg">
        <h1 className="text-xl font-semibold">Signatory verification</h1>
        <p className="text-sm text-gray-600 mt-1">
          Draw your signature below and confirm. Use your finger on your phone.
        </p>

        <div
          ref={padRef}
          className="mt-4 border border-gray-300 rounded bg-white"
          style={{ height: PAD_H, touchAction: 'none' }}
        >
          <div className="w-full h-full overflow-hidden" dangerouslySetInnerHTML={{ __html: liveSvg }} />
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        {done && <div className="mt-3 text-sm text-green-700">✅ Verified. You can close this page.</div>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded border border-gray-300"
            onClick={clear}
            disabled={saving || done}
          >
            Clear
          </button>

          <button
            type="button"
            className="px-3 py-2 rounded border border-gray-800 bg-gray-900 text-white"
            onClick={confirm}
            disabled={saving || done}
          >
            {saving ? 'Saving…' : 'Confirm signature'}
          </button>
        </div>
      </div>
    </div>
  );
}
