// src/lib/entitlementsClient.ts

import type { LicenseExperience } from '@/lib/planEntitlements';

export type LicenseUsageCaps = {
  flashcards: { limit: number | null; unit: 'day' | 'week' | 'month' };
  practice: { limit: number | null; unit: 'day' | 'week' | 'month' };
  test: { limit: number | null; unit: 'day' | 'week' | 'month' };
  maxQuestionsPerSession: number | null;
};

export type LicenseUsageSummary = {
  flashcardsUsed: number;
  flashcardsRemaining: number | null;
  practiceUsed: number;
  practiceRemaining: number | null;
  testsUsed: number;
  testsRemaining: number | null;
};

export type LicenseExperienceSnapshot = LicenseExperience & {
  caps?: LicenseUsageCaps;
  usage?: LicenseUsageSummary;
  enrollment?: {
    licenseId: string;
    enrolledAt: string;
    isActive: boolean;
  };
};

/**
 * Client-side student snapshot
 *
 * Backend returns:
 * - licenseEntitlements: map by licenseId -> experience object
 */
export type StudentState = {
  plan: LicenseExperience['plan'] | null;
  enrollmentSummary: {
    count: number;
    max: number;
  };
  licenseEntitlements: Record<string, LicenseExperienceSnapshot>;
  subscription?: {
    status: string | null;
    expiresAt: string | null;
    active: boolean;
  };
};

let _cache: StudentState | null = null;
let _inflight: Promise<StudentState | null> | null = null;

function normKey(s: string) {
  return String(s ?? '').trim().toLowerCase().replace(/_/g, '-');
}

export function normalizeModuleKey(moduleKey: string): string {
  const raw = String(moduleKey ?? '').trim();
  if (!raw.includes('.')) return normKey(raw);

  const [licenseRaw, modRaw] = raw.split('.');
  return `${normKey(licenseRaw)}.${normKey(modRaw)}`;
}

function emptyState(): StudentState {
  return {
    plan: null,
    enrollmentSummary: { count: 0, max: 0 },
    licenseEntitlements: {},
  };
}

export async function getStudentState(opts?: { force?: boolean }): Promise<StudentState | null> {
  const force = !!opts?.force;

  if (!force && _cache) return _cache;
  if (!force && _inflight) return _inflight;

  _inflight = (async () => {
    try {
      const res = await fetch('/api/me/student', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) return null;

      const data = await res.json().catch(() => null);

      const leRaw = data?.licenseEntitlements;
      const licenseEntitlements: Record<string, LicenseExperienceSnapshot> =
        leRaw && typeof leRaw === 'object' ? leRaw : {};

      const next: StudentState = {
        plan: data?.plan && typeof data.plan === 'object' ? data.plan : null,
        enrollmentSummary: {
          count: Number(data?.enrollmentSummary?.count ?? 0),
          max: Number(data?.enrollmentSummary?.max ?? 0),
        },
        licenseEntitlements,
        subscription: data?.subscription ?? undefined,
      };

      _cache = next;
      return next;
    } catch {
      return null;
    } finally {
      _inflight = null;
    }
  })();

  return _inflight;
}

/**
 * License-first access check.
 *
 * AME ONE sells access per LICENCE (product). A user "has access" to a module
 * when they own a plan for that licence.
 *
 * Logbook is special: only accessible when the licence experience includes logbook.
 */
export function hasLicenseFromState(state: StudentState | null, licenseId: string): boolean {
  if (!state) return false;
  const id = normKey(licenseId);
  return !!state.licenseEntitlements?.[id];
}

export function canAccessModuleFromState(state: StudentState | null, moduleKey: string): boolean {
  if (!state) return false;

  const key = normalizeModuleKey(moduleKey);
  const [licenseId, moduleId] = key.includes('.') ? key.split('.') : [key, ''];

  const exp = state.licenseEntitlements?.[licenseId];
  if (!exp) return false;

  // Logbook requires the logbook flag in the plan.
  if (moduleId === 'logbook') return !!exp.logbook;

  return true;
}

export function clearStudentCache() {
  _cache = null;
  _inflight = null;
}

export function primeStudentCache(state: StudentState) {
  _cache = state;
  _inflight = null;
}

export function getLicenseExperience(state: StudentState | null, licenseId: string) {
  if (!state) return null;
  return state.licenseEntitlements?.[licenseId] ?? null;
}
