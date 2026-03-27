// src/lib/entitlementsClient.ts

import type { LicenseExperience } from '@/lib/planEntitlements';

export type LicenseUsageCaps = {
  flashcardsPerDay: number | null;
  practicePerDay: number | null;
  testsPerWeek: number | null;
};

export type LicenseUsageSummary = {
  flashcardsToday: number;
  flashcardsRemaining: number | null;
  practiceToday: number;
  practiceRemaining: number | null;
  testsThisWeek: number;
  testsRemaining: number | null;
};

export type LicensePlanOverrides = {
  flashcardsPerDay: number | null;
  practicePerDay: number | null;
  testsPerWeek: number | null;
};

export type LicenseExperienceSnapshot = LicenseExperience & {
  caps?: LicenseUsageCaps;
  usage?: LicenseUsageSummary;
  overrides?: LicensePlanOverrides;
};

/**
 * Client-side student snapshot
 *
 * Backend returns:
 * - credits: number
 * - entitlements: flat list of moduleKeys ("m.powerplant", "regs.core"...)
 * - licenseEntitlements: map by licenseId -> experience object
 */
export type StudentState = {
  credits: number;
  entitlements: string[];
  licenseEntitlements: Record<string, LicenseExperienceSnapshot>;
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
  return { credits: 0, entitlements: [], licenseEntitlements: {} };
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

      const entRaw = data?.entitlements;
      const entitlements: string[] = Array.isArray(entRaw)
        ? entRaw.map(normalizeModuleKey).filter(Boolean)
        : [];

      const leRaw = data?.licenseEntitlements;
      const licenseEntitlements: Record<string, LicenseExperienceSnapshot> =
        leRaw && typeof leRaw === 'object' ? leRaw : {};

      const next: StudentState = {
        credits: Number(data?.credits ?? 0),
        entitlements,
        licenseEntitlements,
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

export function hasModuleFromState(state: StudentState | null, moduleKey: string): boolean {
  if (!state) return false;
  if (!Array.isArray(state.entitlements)) return false;

  return state.entitlements.includes(normalizeModuleKey(moduleKey));
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

  // Everything else is unlocked by owning the licence plan.
  return true;
}

export async function hasModule(moduleKey: string): Promise<boolean> {
  const s = await getStudentState({ force: true });
  return hasModuleFromState(s, moduleKey);
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
