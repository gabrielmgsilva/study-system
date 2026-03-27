'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Signatory = {
  id: string;
  logbookId: string;
  name: string;
  email: string;
  licenceOrAuthNo?: string | null;
  initials?: string | null;
  status: 'draft' | 'pending' | 'verified' | 'needs_reverify';
};

const LS_KEY = 'ameone_dev_logbookId';

export default function SignatoryDevPage() {
  const [logbookId, setLogbookId] = useState<string>('');
  const [createdMsg, setCreatedMsg] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  // Form signatory
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [licenceOrAuthNo, setLicenceOrAuthNo] = useState('TC-123456');
  const [initials, setInitials] = useState('JD');

  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [selectedSignatoryId, setSelectedSignatoryId] = useState<string>('');

  // Task sample (MVP)
  const [rowIndex, setRowIndex] = useState<number>(12);
  const [ata, setAta] = useState<string>('05');
  const [taskText, setTaskText] = useState<string>(
    'Inspection following lightning strike',
  );

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setLogbookId(saved);
  }, []);

  useEffect(() => {
    if (logbookId) localStorage.setItem(LS_KEY, logbookId);
  }, [logbookId]);

  const canUse = useMemo(() => !!logbookId, [logbookId]);

  async function createLogbook() {
    setBusy(true);
    setCreatedMsg('');
    try {
      const res = await fetch('/api/logbook/create', { method: 'POST' });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? 'Failed');
      setLogbookId(j.logbookId);
      setCreatedMsg(`✅ Logbook created: ${j.logbookId}`);
    } catch (e: any) {
      setCreatedMsg(`❌ ${e.message ?? 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  async function addSignatory() {
    if (!logbookId) return;
    setBusy(true);
    setCreatedMsg('');
    try {
      const res = await fetch('/api/signatory/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logbookId,
          name,
          email,
          licenceOrAuthNo,
          initials,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? 'Failed');

      const s: Signatory = j.signatory;
      setSignatories((prev) => [s, ...prev]);
      setSelectedSignatoryId(s.id);
      setCreatedMsg(`✅ Signatory created: ${s.name} (${s.status})`);
    } catch (e: any) {
      setCreatedMsg(`❌ ${e.message ?? 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  async function sendVerify() {
    if (!selectedSignatoryId) return;
    setBusy(true);
    setCreatedMsg('');
    try {
      const res = await fetch(`/api/signatory/${selectedSignatoryId}/send-verify`, {
        method: 'POST',
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? 'Failed');
      setCreatedMsg(
        '✅ Verify email (DEV) generated. Check your terminal for the link.',
      );
    } catch (e: any) {
      setCreatedMsg(`❌ ${e.message ?? 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  async function requestSignature() {
    if (!selectedSignatoryId || !logbookId) return;
    setBusy(true);
    setCreatedMsg('');
    try {
      const res = await fetch('/api/sign-request/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logbookId,
          signatoryId: selectedSignatoryId,
          tasks: [
            {
              rowIndex: Number(rowIndex),
              ata,
              taskText,
            },
          ],
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? 'Failed');
      setCreatedMsg(
        '✅ Signature request (DEV) generated. Check your terminal for the link.',
      );
    } catch (e: any) {
      setCreatedMsg(`❌ ${e.message ?? 'Error'}`);
    } finally {
      setBusy(false);
    }
  }

  function resetLocal() {
    localStorage.removeItem(LS_KEY);
    setLogbookId('');
    setSignatories([]);
    setSelectedSignatoryId('');
    setCreatedMsg('✅ Local dev state cleared.');
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-2xl font-bold mb-1">DEV — Signatory + Email Flow</div>
      <div className="text-sm text-gray-700 mb-4">
        This page is just to test the DB + token links end-to-end.
      </div>

      <div className="border border-gray-200 rounded p-4 bg-white mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="font-semibold">Current logbookId</div>
            <div className="text-gray-700 break-all">
              {logbookId || '— (none yet)'}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createLogbook}
              disabled={busy}
              className="px-3 py-2 rounded border border-gray-800 bg-gray-900 text-white hover:bg-black disabled:opacity-50"
            >
              Create Logbook
            </button>
            <button
              onClick={resetLocal}
              disabled={busy}
              className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-600">
          Create Logbook = creates a DB “container” (Logbook) that owns signatories,
          signature requests and audit events.
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded p-4 bg-white">
          <div className="font-semibold mb-2">1) Add Signatory</div>

          <div className="space-y-2 text-sm">
            <label className="block">
              <div className="text-gray-700">Name</div>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="block">
              <div className="text-gray-700">Email</div>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <div className="text-gray-700">Licence/Authority #</div>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1"
                value={licenceOrAuthNo}
                onChange={(e) => setLicenceOrAuthNo(e.target.value)}
              />
            </label>

            <label className="block">
              <div className="text-gray-700">Initials</div>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
              />
            </label>

            <button
              onClick={addSignatory}
              disabled={busy || !canUse}
              className="w-full mt-1 px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Add Signatory
            </button>

            {!canUse && (
              <div className="text-xs text-red-600">
                Create Logbook first.
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded p-4 bg-white">
          <div className="font-semibold mb-2">2) Verify + Request Signature</div>

          <label className="block text-sm mb-2">
            <div className="text-gray-700">Select signatory</div>
            <select
              className="w-full border border-gray-300 rounded px-2 py-2"
              value={selectedSignatoryId}
              onChange={(e) => setSelectedSignatoryId(e.target.value)}
            >
              <option value="">— choose —</option>
              {signatories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              onClick={sendVerify}
              disabled={busy || !selectedSignatoryId}
              className="flex-1 px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Send Verify (DEV)
            </button>

            <button
              onClick={requestSignature}
              disabled={busy || !selectedSignatoryId}
              className="flex-1 px-3 py-2 rounded border border-gray-800 bg-gray-900 text-white hover:bg-black disabled:opacity-50"
            >
              Request Signature (DEV)
            </button>
          </div>

          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="font-semibold text-sm mb-2">Task sample</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <label className="block">
                <div className="text-gray-700">rowIndex</div>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  value={rowIndex}
                  onChange={(e) => setRowIndex(Number(e.target.value))}
                />
              </label>
              <label className="block">
                <div className="text-gray-700">ATA</div>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  value={ata}
                  onChange={(e) => setAta(e.target.value)}
                />
              </label>
              <label className="block col-span-3">
                <div className="text-gray-700">Task text</div>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                />
              </label>
            </div>

            <div className="text-xs text-gray-600 mt-2">
              After verification, the signatory will draw a signature on mobile.
              The signature request link also appears in the terminal (DEV mode).
            </div>
          </div>
        </div>
      </div>

      {createdMsg ? (
        <div className="mt-4 p-3 border border-gray-200 rounded bg-white text-sm">
          {createdMsg}
        </div>
      ) : null}
    </div>
  );
}
