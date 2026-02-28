'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ============================
   API helpers
============================ */

async function apiListSignatories(logbookId: string) {
  const res = await fetch(
    `/api/signatories/list?logbookId=${encodeURIComponent(logbookId)}`,
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to load signatories');
  return json as { signatories: any[] };
}

async function apiUpsertSignatory(payload: any) {
  const res = await fetch('/api/signatories/upsert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to save signatory');
  return json as { signatory: any };
}

async function apiSendVerify(signatoryId: string) {
  const res = await fetch('/api/signatories/send-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signatoryId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to send email');
  return json as { ok: boolean };
}

/* ============================
   Types
============================ */

type TaskGroup = {
  ata: string;
  title: string;
  tasks: string[];
};

type TaskStatus = 'pending' | 'signed' | 'na';

type SignatoryStatus = 'DRAFT' | 'VERIFIED' | 'PENDING';

type Signatory = {
  id: string;
  slotNumber: number; // 1..15
  name: string;
  email: string; // UI only (not printed)
  licenceNumber: string;
  initials: string;
  signatureSvg: string; // stored + printed preview
  dateSigned: string; // yyyy-mm-dd
  status: SignatoryStatus;
};

type SignatoryCopyFile = {
  signatoryIndex: number; // 0..14
  file: File;
  url: string; // object URL (images only)
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const LOGO_SRC = '/ame-one-logo.png'; // put in /public

const TASK_GROUPS: TaskGroup[] = [
  {
    ata: '05',
    title: 'Time limits Mtce Checks',
    tasks: [
      '100 hour check (general aviation aircraft)',
      'Involvement in A,B or C check (transport category aircraft)',
      'Review records for compliance with airworthiness directives',
      'Review records for compliance with component life limits',
      'Inspection following heavy landing',
      'Inspection following lightning strike',
    ],
  },
  {
    ata: '06',
    title: 'Dimensions/Areas',
    tasks: ['Locate components by station number', 'Perform symmetry check'],
  },
  {
    ata: '07',
    title: 'Lifting/Shoring',
    tasks: [
      'Jack aircraft nose or tail wheel',
      'Jack complete aircraft',
      'Sling or trestle major component',
    ],
  },
];

const GROUP_RANGES = (() => {
  const ranges: { start: number; end: number }[] = [];
  let idx = 0;
  TASK_GROUPS.forEach((g) => {
    const start = idx;
    const end = idx + g.tasks.length - 1;
    ranges.push({ start, end });
    idx = end + 1;
  });
  return ranges;
})();

const TOTAL_ROWS =
  GROUP_RANGES.length > 0 ? GROUP_RANGES[GROUP_RANGES.length - 1].end + 1 : 0;

const signatoryRows = Array.from({ length: 15 }, (_, i) => i);

function storageKey(logbookId: string, suffix: string) {
  return `ameone_logbook_${logbookId}_${suffix}`;
}

export default function LogbookUI({ logbookId }: { logbookId: string }) {
  const [applicantName, setApplicantName] = useState('');
  const [fileNumber, setFileNumber] = useState('');

  // ✅ normalized licenceType for cover
  const [licenceType, setLicenceType] = useState<'M' | 'E' | 'S' | 'B'>('M');

  const generatedDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [signatories, setSignatories] = useState<Signatory[]>(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: '',
        slotNumber: i + 1,
        name: '',
        email: '',
        licenceNumber: '',
        initials: '',
        signatureSvg: '',
        dateSigned: '',
        status: 'DRAFT' as SignatoryStatus,
      })) as Signatory[],
  );

  const [copies, setCopies] = useState<SignatoryCopyFile[]>([]);

  const [taskStatus, setTaskStatus] = useState<TaskStatus[]>(() =>
    Array(TOTAL_ROWS).fill('pending'),
  );
  const [dateCompleted, setDateCompleted] = useState<string[]>(() =>
    Array(TOTAL_ROWS).fill(''),
  );
  const [aircraftOrComponent, setAircraftOrComponent] = useState<string[]>(() =>
    Array(TOTAL_ROWS).fill(''),
  );
  const [regOrSerial, setRegOrSerial] = useState<string[]>(() =>
    Array(TOTAL_ROWS).fill(''),
  );
  const [initialsField, setInitialsField] = useState<string[]>(() =>
    Array(TOTAL_ROWS).fill(''),
  );

  const [selectedSignatoryIndex, setSelectedSignatoryIndex] = useState<
    number[]
  >(() => Array(TOTAL_ROWS).fill(-1));
  const [signedBySignatoryIndex, setSignedBySignatoryIndex] = useState<
    number[]
  >(() => Array(TOTAL_ROWS).fill(-1));

  const [expandedGroups, setExpandedGroups] = useState<boolean[]>(() =>
    TASK_GROUPS.map(() => false),
  );

  const [signWarningRow, setSignWarningRow] = useState<number | null>(null);
  const signWarnTimer = useRef<number | null>(null);

  const clearSignWarning = () => {
    setSignWarningRow(null);
    if (signWarnTimer.current) window.clearTimeout(signWarnTimer.current);
    signWarnTimer.current = null;
  };

  const showSignWarning = (rowIndex: number) => {
    setSignWarningRow(rowIndex);
    if (signWarnTimer.current) window.clearTimeout(signWarnTimer.current);
    signWarnTimer.current = window.setTimeout(() => {
      setSignWarningRow(null);
      signWarnTimer.current = null;
    }, 2000);
  };

  /** ---- Persistence (localStorage) ---- */
  useEffect(() => {
    // load
    try {
      const saved = localStorage.getItem(storageKey(logbookId, 'ui_v1'));
      if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed?.applicantName !== undefined)
          setApplicantName(parsed.applicantName);
        if (parsed?.fileNumber !== undefined) setFileNumber(parsed.fileNumber);

        // ✅ allow loading older values safely
        if (parsed?.licenceType) {
          const t = String(parsed.licenceType).toUpperCase();
          if (t === 'M' || t === 'E' || t === 'S' || t === 'B') {
            setLicenceType(t as 'M' | 'E' | 'S' | 'B');
          } else if (t === 'M1/M2' || t === 'M1M2') {
            setLicenceType('M'); // previous value -> new
          }
        }

        // compatibility for old shapes ("licence"/"date" etc)
        if (Array.isArray(parsed?.signatories)) {
          const incoming = parsed.signatories as any[];
          const normalized: Signatory[] = Array.from({ length: 15 }, (_, i) => {
            const s = incoming[i] || {};
            return {
              id: String(s.id || ''),
              slotNumber: Number(s.slotNumber || i + 1),
              name: String(s.name || ''),
              email: String(s.email || ''),
              licenceNumber: String(s.licenceNumber || s.licence || ''),
              initials: String(s.initials || ''),
              signatureSvg: String(s.signatureSvg || ''),
              dateSigned: String(s.dateSigned || s.date || ''),
              status: (s.status as SignatoryStatus) || 'DRAFT',
            };
          });
          setSignatories(normalized);
        }

        if (Array.isArray(parsed?.taskStatus)) setTaskStatus(parsed.taskStatus);
        if (Array.isArray(parsed?.dateCompleted))
          setDateCompleted(parsed.dateCompleted);
        if (Array.isArray(parsed?.aircraftOrComponent))
          setAircraftOrComponent(parsed.aircraftOrComponent);
        if (Array.isArray(parsed?.regOrSerial)) setRegOrSerial(parsed.regOrSerial);
        if (Array.isArray(parsed?.initialsField))
          setInitialsField(parsed.initialsField);
        if (Array.isArray(parsed?.selectedSignatoryIndex))
          setSelectedSignatoryIndex(parsed.selectedSignatoryIndex);
        if (Array.isArray(parsed?.signedBySignatoryIndex))
          setSignedBySignatoryIndex(parsed.signedBySignatoryIndex);

        if (Array.isArray(parsed?.expandedGroups))
          setExpandedGroups(parsed.expandedGroups);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logbookId]);

  useEffect(() => {
    // save
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey(logbookId, 'ui_v1'),
          JSON.stringify({
            applicantName,
            fileNumber,
            licenceType,
            signatories,
            taskStatus,
            dateCompleted,
            aircraftOrComponent,
            regOrSerial,
            initialsField,
            selectedSignatoryIndex,
            signedBySignatoryIndex,
            expandedGroups,
          }),
        );
      } catch {
        // ignore
      }
    }, 250);

    return () => window.clearTimeout(t);
  }, [
    logbookId,
    applicantName,
    fileNumber,
    licenceType,
    signatories,
    taskStatus,
    dateCompleted,
    aircraftOrComponent,
    regOrSerial,
    initialsField,
    selectedSignatoryIndex,
    signedBySignatoryIndex,
    expandedGroups,
  ]);

  useEffect(() => {
    const onBeforePrint = () => setExpandedGroups(TASK_GROUPS.map(() => true));
    window.addEventListener('beforeprint', onBeforePrint);
    return () => window.removeEventListener('beforeprint', onBeforePrint);
  }, []);

  useEffect(() => {
    return () => {
      copies.forEach((c) => URL.revokeObjectURL(c.url));
      if (signWarnTimer.current) window.clearTimeout(signWarnTimer.current);
    };
  }, [copies]);

  /** =========================================================
   * Step 4.3 — Load signatories from DB on open
   * ======================================================= */
  useEffect(() => {
    (async () => {
      try {
        const { signatories: dbRows } = await apiListSignatories(logbookId);

        const next: Signatory[] = Array.from({ length: 15 }, (_, i) => ({
          id: '',
          slotNumber: i + 1,
          name: '',
          email: '',
          licenceNumber: '',
          initials: '',
          signatureSvg: '',
          dateSigned: '',
          status: 'DRAFT',
        }));

        for (const s of dbRows || []) {
          const idx = (s.slotNumber || 1) - 1;
          if (idx >= 0 && idx < 15) {
            next[idx] = {
              id: String(s.id || ''),
              slotNumber: Number(s.slotNumber || idx + 1),
              name: String(s.name || ''),
              email: String(s.email || ''),
              licenceNumber: String(s.licenceNumber || ''),
              initials: String(s.initials || ''),
              signatureSvg: String(s.signatureSvg || ''),
              dateSigned: String(s.dateSigned || ''),
              status: (s.status as SignatoryStatus) || 'DRAFT',
            };
          }
        }

        setSignatories(next);
      } catch {
        // if it fails, keep local state
      }
    })();
  }, [logbookId]);

  const totalApplicable = useMemo(
    () => taskStatus.filter((s) => s !== 'na').length,
    [taskStatus],
  );
  const signedCount = useMemo(
    () => taskStatus.filter((s) => s === 'signed').length,
    [taskStatus],
  );
  const progressPercent =
    totalApplicable === 0
      ? 0
      : Math.round((signedCount / totalApplicable) * 100);

  const isRowLocked = (status: TaskStatus) => status === 'signed' || status === 'na';

  const toggleGroup = (groupIndex: number) => {
    setExpandedGroups((prev) => prev.map((v, i) => (i === groupIndex ? !v : v)));
  };

  const expandAll = () => setExpandedGroups(TASK_GROUPS.map(() => true));
  const collapseAll = () => setExpandedGroups(TASK_GROUPS.map(() => false));

  const setRowStatus = (rowIndex: number, next: TaskStatus) => {
    setTaskStatus((prev) => prev.map((s, i) => (i === rowIndex ? next : s)));
  };

  const markGroupNA = (groupIndex: number) => {
    const { start, end } = GROUP_RANGES[groupIndex];
    setTaskStatus((prev) =>
      prev.map((s, i) => (i >= start && i <= end ? 'na' : s)),
    );
  };

  const undoGroupNA = (groupIndex: number) => {
    const { start, end } = GROUP_RANGES[groupIndex];
    setTaskStatus((prev) =>
      prev.map((s, i) =>
        i >= start && i <= end && s === 'na' ? 'pending' : s,
      ),
    );
  };

  const getStatusLabel = (status: TaskStatus) => {
    if (status === 'signed') return 'Signed';
    if (status === 'na') return 'Marked N/A';
    return 'Pending';
  };

  const updateSignatory = (index: number, patch: Partial<Signatory>) => {
    setSignatories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const saveSignatoryRow = async (idx: number) => {
    const s = signatories[idx];
    const payload = {
      logbookId,
      slotNumber: idx + 1,
      name: s.name,
      email: s.email,
      licenceNumber: s.licenceNumber,
      initials: s.initials,
      dateSigned: s.dateSigned,
      // NOTE: signatureSvg/status are not editable here; signatory provides signature via verification flow
    };
    const saved = await apiUpsertSignatory(payload);
    updateSignatory(idx, saved.signatory);
    return saved.signatory;
  };

  const signatoryOptions = useMemo(() => {
    return signatories
      .map((s, idx) => ({ idx, ...s }))
      .filter(
        (s) =>
          (s.name?.trim() ?? '') !== '' || (s.initials?.trim() ?? '') !== '',
      )
      .map((s) => ({
        value: s.idx,
        label: `${s.idx + 1} — ${
          s.initials?.trim()
            ? s.initials.trim()
            : s.name?.trim() || 'Signatory'
        }`,
      }));
  }, [signatories]);

  const handleSelectSignatory = (rowIndex: number, signIdx: number) => {
    setSelectedSignatoryIndex((prev) => {
      const next = [...prev];
      next[rowIndex] = signIdx;
      return next;
    });

    const autoInitials =
      signIdx >= 0 ? (signatories[signIdx]?.initials ?? '').trim() : '';
    if (autoInitials && !initialsField[rowIndex]) {
      setInitialsField((prev) => {
        const next = [...prev];
        next[rowIndex] = autoInitials;
        return next;
      });
    }
  };

  const addCertifiedCopies = (signatoryIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((f) =>
      /^image\/(png|jpe?g|webp)$/i.test(f.type),
    );

    const toAdd: SignatoryCopyFile[] = imageFiles.map((file) => ({
      signatoryIndex,
      file,
      url: URL.createObjectURL(file),
    }));

    setCopies((prev) => [...prev, ...toAdd]);
  };

  const removeCopy = (copyIndex: number) => {
    setCopies((prev) => {
      const target = prev[copyIndex];
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== copyIndex);
    });
  };

  const copiesBySignatory = useMemo(() => {
    const map = new Map<number, SignatoryCopyFile[]>();
    copies.forEach((c) => {
      const arr = map.get(c.signatoryIndex) ?? [];
      arr.push(c);
      map.set(c.signatoryIndex, arr);
    });
    return map;
  }, [copies]);

  const btnBase = 'px-2 py-[2px] text-[10px] rounded border transition-colors';
  const btnInactive = 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100';
  const btnActive = 'border-gray-500 bg-gray-300 text-gray-900';
  const btnDisabled =
    'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed';

  const uploadBtn =
    'inline-flex items-center gap-2 px-3 py-1 rounded border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 text-[11px] cursor-pointer';

  const licenceSubtitle =
    licenceType === 'M'
      ? 'Airplane & Helicopter'
      : licenceType === 'E'
        ? 'Avionics'
        : licenceType === 'S'
          ? 'Structures'
          : 'Balloon';

  // Header for content pages (not shown on covers)
  const PrintContentHeader = () => (
    <div className="print-only border border-black px-3 py-2 mb-2">
      <div className="flex items-center justify-between text-[11px]">
        <div>
          <span className="font-semibold">Applicant name:</span>{' '}
          <span>{applicantName || '—'}</span>
        </div>
        <div>
          <span className="font-semibold">File Number:</span>{' '}
          <span>{fileNumber || '—'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-5xl bg-white text-[11px] leading-snug border border-black">
        <style jsx global>{`
          @media print {
            .screen-only {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            .break-after-page {
              break-after: page;
              page-break-after: always;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          @media screen {
            .print-only {
              display: none;
            }
          }
        `}</style>

        {/* TOOLBAR (screen-only) */}
        <div className="screen-only sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-3 py-2">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
            >
              ← Return
            </button>

            <div className="flex items-center gap-2">
              <select
                className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-800"
                value={licenceType}
                onChange={(e) =>
                  setLicenceType(e.target.value as 'M' | 'E' | 'S' | 'B')
                }
                title="Licence type (cover)"
              >
                <option value="M">M</option>
                <option value="E">E</option>
                <option value="S">S</option>
                <option value="B">B</option>
              </select>

              <button
                type="button"
                onClick={expandAll}
                className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
              >
                Collapse all
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1 rounded border border-gray-500 bg-gray-800 text-white hover:bg-gray-900"
              >
                Print logbook
              </button>
            </div>
          </div>

          {/* Progress bar (screen-only) */}
          <div className="px-3 pb-2">
            <div className="flex items-center justify-between text-[11px] text-gray-700">
              <div>
                Progress: <strong>{signedCount}</strong> signed out of{' '}
                <strong>{totalApplicable}</strong> applicable
              </div>
              <div>
                <strong>{progressPercent}%</strong>
              </div>
            </div>
            <div className="mt-1 h-2 w-full rounded bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-gray-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* COVER (PRINT ONLY) — no Applicant/File */}
        <div className="print-only break-after-page">
          <div className="border border-black min-h-[1050px] p-10 relative overflow-hidden">
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ transform: 'rotate(-25deg)' }}
            >
              <div className="text-[120px] font-black tracking-widest opacity-10">
                AME ONE
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-center mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO_SRC} alt="" className="w-40 opacity-95" />
              </div>

              <div className="text-[14px] font-semibold text-center">
                Transport Canada – Maintenance Task Log
              </div>

              <div className="text-[42px] font-black mt-3 text-center">
                LOGBOOK
              </div>

              <div className="mt-3 text-[16px] text-center">
                Licence: <span className="font-semibold">{licenceType}</span>{' '}
                <span className="text-gray-700">— {licenceSubtitle}</span>
              </div>

              <div className="mt-10 text-center text-[12px] text-gray-700">
                Generated on {generatedDate}
              </div>

              <div className="absolute left-10 right-10 bottom-10 text-[11px] text-gray-700 text-center">
                AME ONE — Logbook Module (Print edition)
              </div>
            </div>
          </div>
        </div>

        {/* From here on: content pages show applicant/file */}
        <PrintContentHeader />

        {/* Applicant name / File number */}
        <table className="w-full border-b border-black border-collapse">
          <tbody>
            <tr>
              <td className="border-r border-black px-2 py-1 font-semibold w-3/4">
                Applicant name
                <div className="mt-1">
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full h-6 border border-gray-300 bg-blue-100"
                  />
                </div>
              </td>
              <td className="px-2 py-1 font-semibold">
                File Number
                <div className="mt-1">
                  <input
                    type="text"
                    value={fileNumber}
                    onChange={(e) => setFileNumber(e.target.value)}
                    className="w-full h-6 border border-gray-300 bg-blue-100"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Instructions */}
        <div className="px-2 py-2 border-b border-black">
          <div className="font-semibold mb-1">Instructions</div>
          <p>
            The Maintenance Task List below is based on paragraph 566.03(4)(e) and
            Appendix B of Chapter 566 of the Airworthiness. Applicants utilizing
            this document, including persons authorized to certify the completion
            of tasks, should be familiar with these requirements to properly
            complete this document as a means for an applicant to establish proof
            of skill.
          </p>
          <p className="mt-1">
            Applicants cannot sign for their own maintenance tasks regardless of
            whether they hold a rating, foreign licence, or authority within an
            organization to sign a maintenance release or equivalent release.
          </p>
          <p className="mt-1">
            Only tasks completed which have been subject to a maintenance release
            or equivalent are acceptable. Tasks completed are to be initialled by
            the holder of an AME licence or equivalent person attesting to its
            completion by the applicant, and that the person has observed the work
            to the extent necessary and confirm that the applicant has completed
            the tasks in accordance with the standards of airworthiness.
          </p>
          <p className="mt-1">
            The applicant is responsible to ensure that the tasks performed are
            applicable to the rating sought and to the aircraft, systems or
            components for which the experience is being claimed.
          </p>
          <p className="mt-1">
            Where a maintenance task has been initialled by a foreign AME licence
            holder or by an equivalent person holding an authority such as a Shop
            Certification Authority (SCA), the applicant is to provide certified
            true copies of the person’s foreign licence or authority along with
            this document for review.
          </p>
          <p className="mt-1">
            Each signatory is required to complete the information below (limit of
            15 signatories):
          </p>
        </div>

        {/* Signatory title */}
        <div className="px-2 pt-2 border-b border-black">
          <div className="font-semibold mb-1">Signatory Information</div>
        </div>

        {/* Signatory table */}
        <table className="w-full border-b border-black border-collapse">
          <thead>
            <tr>
              <th className="border-t border-b border-black px-1 py-1 w-[5%]">
                #
              </th>
              <th className="border-t border-b border-l border-black px-1 py-1 text-left">
                Name (print)
              </th>
              <th className="border-t border-b border-l border-black px-1 py-1 text-left w-[22%]">
                Licence or Authority Number
              </th>
              <th className="border-t border-b border-l border-black px-1 py-1 text-left w-[10%]">
                Initials
              </th>
              <th className="border-t border-b border-l border-black px-1 py-1 text-left w-[23%]">
                Signature
              </th>
              <th className="border-t border-b border-l border-black px-1 py-1 text-left w-[15%]">
                Date (yyyy-mm-dd)
              </th>
            </tr>
          </thead>

          <tbody>
            {signatoryRows.map((idx) => {
              const items = copiesBySignatory.get(idx) ?? [];
              const s = signatories[idx];

              return (
                <tr key={idx}>
                  <td className="border-t border-black px-1 py-1 text-center">
                    {idx + 1}
                  </td>

                  <td className="border-t border-l border-black px-1 py-1">
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) =>
                        updateSignatory(idx, { name: e.target.value })
                      }
                      onBlur={async () => {
                        try {
                          await saveSignatoryRow(idx);
                        } catch {
                          // ignore
                        }
                      }}
                      className="w-full h-6 border border-gray-300 bg-blue-100"
                    />

                    {/* UI-only: email + verify */}
                    <div className="screen-only mt-1 flex items-center gap-2">
                      <input
                        type="email"
                        value={s.email}
                        onChange={(e) =>
                          updateSignatory(idx, { email: e.target.value })
                        }
                        onBlur={async () => {
                          try {
                            await saveSignatoryRow(idx);
                          } catch {}
                        }}
                        placeholder="Email (for verification)"
                        className="flex-1 h-6 border border-gray-300 rounded px-2 text-[10px]"
                      />

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const saved = await saveSignatoryRow(idx);

                            if (!saved?.email?.trim()) {
                              alert('Email missing');
                              return;
                            }

                            await apiSendVerify(saved.id);

                            updateSignatory(idx, { status: 'PENDING' });
                          } catch (e: any) {
                            alert(e?.message || 'Failed to send email');
                          }
                        }}
                        className={cx(
                          'px-2 py-[2px] rounded border text-[10px]',
                          s.status === 'VERIFIED'
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : s.status === 'PENDING'
                              ? 'border-amber-600 bg-amber-50 text-amber-700'
                              : 'border-gray-300 bg-white hover:bg-gray-100',
                        )}
                        title="Send verification link to signatory"
                      >
                        {s.status === 'VERIFIED'
                          ? 'Verified'
                          : s.status === 'PENDING'
                            ? 'Pending'
                            : 'Verify (email)'}
                      </button>

                      <span
                        className={cx(
                          'text-[10px] px-2 py-[1px] rounded border',
                          s.status === 'VERIFIED'
                            ? 'border-green-300 text-green-700 bg-green-50'
                            : s.status === 'PENDING'
                              ? 'border-amber-300 text-amber-700 bg-amber-50'
                              : 'border-gray-300 text-gray-600 bg-gray-50',
                        )}
                        title="Signatory status"
                      >
                        {s.status}
                      </span>
                    </div>

                    {/* Supporting docs upload */}
                    <div className="screen-only mt-2">
                      <label
                        className={uploadBtn}
                        title="Upload supporting documentation (images)"
                      >
                        <span className="font-semibold">Upload</span>
                        <span className="text-gray-600">(supporting docs)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            addCertifiedCopies(idx, e.target.files);
                            e.currentTarget.value = '';
                          }}
                          className="hidden"
                        />
                      </label>

                      {items.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {items.map((c, i) => {
                            const globalIndex = copies.findIndex((x) => x === c);
                            return (
                              <div
                                key={`${c.file.name}-${i}`}
                                className="flex items-center justify-between gap-2 p-1 border border-gray-200 rounded"
                              >
                                <span className="text-[10px] text-gray-700 truncate">
                                  {c.file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeCopy(globalIndex)}
                                  className="px-2 py-[1px] rounded border border-gray-300 text-[10px] hover:bg-gray-100"
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="border-t border-l border-black px-1 py-1">
                    <input
                      type="text"
                      value={s.licenceNumber}
                      onChange={(e) =>
                        updateSignatory(idx, { licenceNumber: e.target.value })
                      }
                      onBlur={async () => {
                        try {
                          await saveSignatoryRow(idx);
                        } catch {}
                      }}
                      className="w-full h-6 border border-gray-300 bg-blue-100"
                    />
                  </td>

                  <td className="border-t border-l border-black px-1 py-1">
                    <input
                      type="text"
                      value={s.initials}
                      onChange={(e) =>
                        updateSignatory(idx, { initials: e.target.value })
                      }
                      onBlur={async () => {
                        try {
                          await saveSignatoryRow(idx);
                        } catch {}
                      }}
                      className="w-full h-6 border border-gray-300 bg-blue-100"
                    />
                  </td>

                  <td className="border-t border-l border-black px-1 py-1">
                    {/* Signature preview (prints) */}
                    <div className="w-full min-h-[24px] border border-gray-300 bg-blue-50 flex items-center">
                      {s.signatureSvg ? (
                        <div
                          className="w-full h-[24px] overflow-hidden"
                          style={{ padding: '2px' }}
                          dangerouslySetInnerHTML={{ __html: s.signatureSvg }}
                        />
                      ) : (
                        <div className="w-full h-[24px]" />
                      )}
                    </div>

                    <div className="screen-only mt-1 text-[10px] text-gray-500">
                      Signature appears after verification.
                    </div>
                  </td>

                  <td className="border-t border-l border-black px-1 py-1">
                    <input
                      type="date"
                      value={s.dateSigned}
                      onChange={(e) =>
                        updateSignatory(idx, { dateSigned: e.target.value })
                      }
                      onBlur={async () => {
                        try {
                          await saveSignatoryRow(idx);
                        } catch {}
                      }}
                      className="w-full h-6 border border-gray-300 bg-blue-100 text-[10px]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Supporting documentation (PRINT ONLY) */}
        <div className="print-only px-2 pt-3">
          {signatoryRows.map((idx) => {
            const items = copiesBySignatory.get(idx) ?? [];
            if (items.length === 0) return null;

            return (
              <div key={`support-${idx}`} className="break-after-page">
                <PrintContentHeader />
                <div className="font-semibold mb-2">
                  Supporting documentation — Signatory #{idx + 1}
                </div>

                {items.map((c, i) => (
                  <div key={`${c.file.name}-${i}`} className="break-after-page">
                    <div className="text-[10px] mb-1">{c.file.name}</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.url}
                      alt={c.file.name}
                      className="w-full border border-black"
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Instructions to complete */}
        <div className="px-2 py-2 border-b border-black">
          <div className="font-semibold mb-1">
            Instructions to complete the maintenance task list:
          </div>
          <ul className="list-disc pl-5">
            <li>
              <strong>Date completed</strong> – year, month, day, e.g., YYYY-MM-DD.
            </li>
            <li>
              <strong>Aircraft type</strong> – model based on aircraft Type Certificate
              Data Sheet (TCDS).
            </li>
            <li>
              <strong>Component</strong> – e.g., starter generator.
            </li>
            <li>
              <strong>Aircraft registration</strong> – aircraft marks e.g., C-GCFJ.
            </li>
            <li>
              <strong>Component serial number</strong> – serial number from the
              component data plate.
            </li>
            <li>
              <strong>Initials of AME or equivalent person</strong> – initials of a
              person listed in signatory table.
            </li>
          </ul>
        </div>

        {/* Maintenance Task Log */}
        <div className="px-2 pt-2">
          <div className="font-semibold mb-1">MAINTENANCE TASK LIST</div>
        </div>

        <table className="w-full border-t border-black border-collapse">
          <thead>
            <tr>
              <th className="border-b border-black px-2 py-1 w-[10%]">ATA</th>
              <th className="border-b border-l border-black px-2 py-1 text-left">
                Maintenance Tasks
              </th>
              <th className="border-b border-l border-black px-2 py-1 w-[14%]">
                Date Completed
              </th>
              <th className="border-b border-l border-black px-2 py-1 w-[18%]">
                Aircraft Type or Component
              </th>
              <th className="border-b border-l border-black px-2 py-1 w-[22%]">
                Aircraft Registration or Component Serial Number
              </th>
              <th className="border-b border-l border-black px-2 py-1 w-[16%]">
                Initials of AME or equivalent person
              </th>
            </tr>
          </thead>

          <tbody>
            {TASK_GROUPS.map((group, groupIndex) => {
              const isExpanded = expandedGroups[groupIndex];
              const start = GROUP_RANGES[groupIndex]?.start ?? 0;

              return (
                <React.Fragment key={`${group.ata}-${groupIndex}`}>
                  <tr>
                    <td
                      className={cx(
                        'border-t border-black px-2 font-semibold align-middle cursor-pointer select-none',
                        isExpanded ? 'py-2' : 'py-1',
                      )}
                      onClick={() => toggleGroup(groupIndex)}
                    >
                      <div
                        className={cx(
                          'relative pr-10',
                          isExpanded ? 'leading-snug' : 'leading-tight',
                        )}
                      >
                        <div>ATA {group.ata}</div>
                        <div
                          className={cx(
                            'font-normal',
                            isExpanded ? 'text-[11px]' : 'text-[10px]',
                          )}
                        >
                          {group.title}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(groupIndex);
                          }}
                          className="screen-only absolute right-0 top-1/2 -translate-y-1/2 w-9 h-8 rounded border border-gray-300 text-lg leading-none hover:bg-gray-100"
                          aria-label={isExpanded ? 'Collapse ATA' : 'Expand ATA'}
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      </div>
                    </td>

                    <td
                      className={cx(
                        'border-t border-l border-black px-2',
                        isExpanded ? 'py-2' : 'py-1',
                      )}
                    >
                      {isExpanded && (
                        <div className="screen-only flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => undoGroupNA(groupIndex)}
                            className={cx(btnBase, btnInactive)}
                          >
                            Reset N/A
                          </button>
                          <button
                            type="button"
                            onClick={() => markGroupNA(groupIndex)}
                            className={cx(btnBase, btnInactive)}
                          >
                            N/A Chapter
                          </button>
                        </div>
                      )}
                    </td>

                    <td
                      className={cx(
                        'border-t border-l border-black px-2',
                        isExpanded ? 'py-2' : 'py-1',
                      )}
                    />
                    <td
                      className={cx(
                        'border-t border-l border-black px-2',
                        isExpanded ? 'py-2' : 'py-1',
                      )}
                    />
                    <td
                      className={cx(
                        'border-t border-l border-black px-2',
                        isExpanded ? 'py-2' : 'py-1',
                      )}
                    />
                    <td
                      className={cx(
                        'border-t border-l border-black px-2',
                        isExpanded ? 'py-2' : 'py-1',
                      )}
                    />
                  </tr>

                  {isExpanded &&
                    group.tasks.map((task, index) => {
                      const rowIndex = start + index;
                      const status = taskStatus[rowIndex];
                      const locked = isRowLocked(status);

                      const signActive = status === 'signed';
                      const naActive = status === 'na';

                      const signedIdx = signedBySignatoryIndex[rowIndex];
                      const signedSigSvg =
                        signedIdx >= 0
                          ? signatories[signedIdx]?.signatureSvg ?? ''
                          : '';

                      return (
                        <tr key={`${group.ata}-${index}`}>
                          <td className="border-t border-black px-2 py-1" />

                          <td className="border-t border-l border-black px-2 py-1">
                            <div className="flex items-start justify-between gap-2">
                              <span>• {task}</span>
                              <span className="screen-only text-[10px] text-gray-500">
                                {getStatusLabel(status)}
                              </span>
                            </div>
                          </td>

                          <td className="border-t border-l border-black px-1 py-1">
                            <input
                              type="date"
                              value={dateCompleted[rowIndex]}
                              onChange={(e) =>
                                setDateCompleted((prev) => {
                                  const next = [...prev];
                                  next[rowIndex] = e.target.value;
                                  return next;
                                })
                              }
                              disabled={locked}
                              className={cx(
                                'w-full h-6 border border-gray-300 bg-blue-100 text-[10px]',
                                locked && 'bg-gray-200 text-gray-700',
                              )}
                            />
                          </td>

                          <td className="border-t border-l border-black px-1 py-1">
                            <input
                              type="text"
                              value={aircraftOrComponent[rowIndex]}
                              onChange={(e) =>
                                setAircraftOrComponent((prev) => {
                                  const next = [...prev];
                                  next[rowIndex] = e.target.value;
                                  return next;
                                })
                              }
                              readOnly={locked}
                              className={cx(
                                'w-full h-6 border border-gray-300 bg-blue-100',
                                locked && 'bg-gray-200 text-gray-700',
                              )}
                            />
                          </td>

                          <td className="border-t border-l border-black px-1 py-1">
                            <input
                              type="text"
                              value={regOrSerial[rowIndex]}
                              onChange={(e) =>
                                setRegOrSerial((prev) => {
                                  const next = [...prev];
                                  next[rowIndex] = e.target.value;
                                  return next;
                                })
                              }
                              readOnly={locked}
                              className={cx(
                                'w-full h-6 border border-gray-300 bg-blue-100',
                                locked && 'bg-gray-200 text-gray-700',
                              )}
                            />
                          </td>

                          {/* Initials + signature preview when signed */}
                          <td className="border-t border-l border-black px-1 py-1">
                            <input
                              type="text"
                              value={initialsField[rowIndex]}
                              onChange={(e) =>
                                setInitialsField((prev) => {
                                  const next = [...prev];
                                  next[rowIndex] = e.target.value;
                                  return next;
                                })
                              }
                              readOnly={locked}
                              className={cx(
                                'w-full h-6 border border-gray-300 bg-blue-100',
                                locked && 'bg-gray-200 text-gray-700',
                              )}
                            />

                            {signActive && signedSigSvg && (
                              <div
                                className="mt-1 border border-gray-300 bg-white h-10 overflow-hidden"
                                style={{ padding: '2px' }}
                              >
                                <div
                                  className="w-full h-full"
                                  dangerouslySetInnerHTML={{ __html: signedSigSvg }}
                                />
                              </div>
                            )}

                            <div className="screen-only mt-1 flex flex-col gap-1">
                              <div className="flex gap-1">
                                <select
                                  disabled={locked}
                                  className={cx(
                                    'flex-1 h-6 border border-gray-300 rounded text-[10px]',
                                    locked && 'bg-gray-100 text-gray-500',
                                  )}
                                  value={selectedSignatoryIndex[rowIndex] ?? -1}
                                  onChange={(e) =>
                                    handleSelectSignatory(
                                      rowIndex,
                                      Number(e.target.value),
                                    )
                                  }
                                >
                                  <option value={-1}>Choose signatory…</option>
                                  {signatoryOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  disabled={locked && !signActive}
                                  onClick={() => {
                                    if (locked) return;

                                    const sigIdx = selectedSignatoryIndex[rowIndex];
                                    if (sigIdx < 0) {
                                      showSignWarning(rowIndex);
                                      return;
                                    }

                                    // Only allow "Sign" if VERIFIED
                                    if (
                                      (signatories[sigIdx]?.status || 'DRAFT') !==
                                      'VERIFIED'
                                    ) {
                                      showSignWarning(rowIndex);
                                      return;
                                    }

                                    const autoInitials = (
                                      signatories[sigIdx]?.initials ?? ''
                                    ).trim();
                                    if (autoInitials && !initialsField[rowIndex]) {
                                      setInitialsField((prev) => {
                                        const next = [...prev];
                                        next[rowIndex] = autoInitials;
                                        return next;
                                      });
                                    }

                                    clearSignWarning();

                                    setSignedBySignatoryIndex((prev) => {
                                      const next = [...prev];
                                      next[rowIndex] = sigIdx;
                                      return next;
                                    });
                                    setRowStatus(rowIndex, 'signed');
                                  }}
                                  className={cx(
                                    btnBase,
                                    signActive ? btnActive : btnInactive,
                                    locked && !signActive && btnDisabled,
                                  )}
                                  aria-pressed={signActive}
                                >
                                  Sign
                                </button>

                                <button
                                  type="button"
                                  disabled={locked && !naActive}
                                  onClick={() => {
                                    clearSignWarning();
                                    setSignedBySignatoryIndex((prev) => {
                                      const next = [...prev];
                                      next[rowIndex] = -1;
                                      return next;
                                    });
                                    setRowStatus(rowIndex, 'na');
                                  }}
                                  className={cx(
                                    btnBase,
                                    naActive ? btnActive : btnInactive,
                                    locked && !naActive && btnDisabled,
                                  )}
                                  aria-pressed={naActive}
                                >
                                  Mark N/A
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    clearSignWarning();
                                    setSignedBySignatoryIndex((prev) => {
                                      const next = [...prev];
                                      next[rowIndex] = -1;
                                      return next;
                                    });
                                    setRowStatus(rowIndex, 'pending');
                                  }}
                                  className={cx(btnBase, btnInactive)}
                                >
                                  Undo
                                </button>
                              </div>

                              {signWarningRow === rowIndex && (
                                <div className="text-[10px] text-red-600">
                                  {(() => {
                                    const sigIdx =
                                      selectedSignatoryIndex[rowIndex];
                                    if (sigIdx < 0) return 'Choose signatory first.';
                                    if (
                                      (signatories[sigIdx]?.status || 'DRAFT') !==
                                      'VERIFIED'
                                    )
                                      return 'Signatory must be VERIFIED first.';
                                    return 'Choose signatory first.';
                                  })()}
                                </div>
                              )}

                              <div className="text-[10px] text-gray-500">
                                Status: {getStatusLabel(status)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* BACK COVER (PRINT ONLY) — no Applicant/File */}
        <div className="print-only">
          <div className="border border-black min-h-[1050px] p-10 relative flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_SRC} alt="" className="w-80 opacity-90" />
            </div>

            <div className="text-center text-[11px] text-gray-600 mt-6">
              AME ONE — Aircraft Maintenance Engineer Platform
              <br />
              Logbook module · Generated on {generatedDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
