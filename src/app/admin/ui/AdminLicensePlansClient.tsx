'use client';

import React from 'react';
import type { LandingLocale } from '@/lib/i18n/landing';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getAppDictionary } from '@/lib/i18n/app';

type PlanTier = 'basic' | 'standard' | 'premium';

type EntitlementRow = {
  licenseId: string;
  plan: PlanTier;
  flashcards: string;
  practice: string;
  test: string;
  logbook: boolean;
  flashcardsPerDayOverride: number | null;
  practicePerDayOverride: number | null;
  testsPerWeekOverride: number | null;
  exists: boolean;
};

type TargetUser = {
  id: number;
  email: string;
  name: string | null;
};

const PLAN_OPTIONS: PlanTier[] = ['basic', 'standard', 'premium'];

function humanizeLicenseId(licenseId: string, locale: LandingLocale) {
  if (licenseId === 'regs') return 'REGS';
  if (licenseId === 'm') return 'M';
  if (licenseId === 'e') return 'E';
  if (licenseId === 's') return 'S';
  if (licenseId === 'balloons') return locale === 'pt' ? 'Balões' : 'Balloons';
  return licenseId;
}

function toInputValue(value: number | null) {
  return value === null ? '' : String(value);
}

export default function AdminLicensePlansClient({ locale }: { locale: LandingLocale }) {
  const admin = getAppDictionary(locale).admin;
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<TargetUser | null>(null);
  const [rows, setRows] = React.useState<EntitlementRow[]>([]);
  const [savingLicenseId, setSavingLicenseId] = React.useState<string | null>(null);

  async function loadUserEntitlements() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError(admin.enterUserEmail);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/license-entitlements?email=${encodeURIComponent(normalizedEmail)}`);
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || admin.unableLoadUserEntitlements);
      }

      setUser(data.user as TargetUser);
      setRows(data.entitlements as EntitlementRow[]);
    } catch (fetchError) {
      setUser(null);
      setRows([]);
      setError(fetchError instanceof Error ? fetchError.message : admin.unableLoadUserEntitlements);
    } finally {
      setLoading(false);
    }
  }

  function updateRow(licenseId: string, patch: Partial<EntitlementRow>) {
    setRows((prev) => prev.map((row) => (row.licenseId === licenseId ? { ...row, ...patch } : row)));
  }

  async function saveRow(row: EntitlementRow) {
    if (!user) return;

    setSavingLicenseId(row.licenseId);
    setError(null);

    try {
      const res = await fetch('/api/admin/license-entitlements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          licenseId: row.licenseId,
          plan: row.plan,
          flashcardsPerDayOverride: row.flashcardsPerDayOverride,
          practicePerDayOverride: row.practicePerDayOverride,
          testsPerWeekOverride: row.testsPerWeekOverride,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || admin.unableSavePlanOverrides);
      }

      await loadUserEntitlements();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : admin.unableSavePlanOverrides);
    } finally {
      setSavingLicenseId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">{admin.findUser}</CardTitle>
          <CardDescription className="text-slate-500">
            {admin.findUserDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <div className="text-xs text-slate-500">{admin.userEmail}</div>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
              className="rounded-xl border-slate-200 bg-white"
            />
          </div>

          <Button onClick={loadUserEntitlements} disabled={loading} className="rounded-xl bg-[#2d4bb3] text-white hover:bg-[#243d93]">
            {loading ? admin.loading : admin.load}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {user ? (
        <Card className="border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">{admin.user}</CardTitle>
            <CardDescription className="text-slate-500">
              {user.name || admin.noName} · {user.email} · ID {user.id}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {rows.map((row) => (
        <Card key={row.licenseId} className="border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">{humanizeLicenseId(row.licenseId, locale)}</CardTitle>
            <CardDescription className="text-slate-500">
              {admin.derivedAccess}: {admin.flashcards} {row.flashcards} · {admin.practice} {row.practice} · {admin.test} {row.test} · {admin.logbook} {row.logbook ? admin.yes : admin.no}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="text-xs text-slate-500">{admin.plan}</div>
                <select
                  value={row.plan}
                  onChange={(event) => updateRow(row.licenseId, { plan: event.target.value as PlanTier })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#d8e0fb]"
                >
                  {PLAN_OPTIONS.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-500">{admin.flashcardsPerDayOverride}</div>
                <Input
                  inputMode="numeric"
                  value={toInputValue(row.flashcardsPerDayOverride)}
                  onChange={(event) => updateRow(row.licenseId, { flashcardsPerDayOverride: event.target.value === '' ? null : Number(event.target.value) })}
                  placeholder={admin.defaultValue}
                  className="rounded-xl border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-500">{admin.practicePerDayOverride}</div>
                <Input
                  inputMode="numeric"
                  value={toInputValue(row.practicePerDayOverride)}
                  onChange={(event) => updateRow(row.licenseId, { practicePerDayOverride: event.target.value === '' ? null : Number(event.target.value) })}
                  placeholder={admin.defaultValue}
                  className="rounded-xl border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-500">{admin.testsPerWeekOverride}</div>
                <Input
                  inputMode="numeric"
                  value={toInputValue(row.testsPerWeekOverride)}
                  onChange={(event) => updateRow(row.licenseId, { testsPerWeekOverride: event.target.value === '' ? null : Number(event.target.value) })}
                  placeholder={admin.defaultValue}
                  className="rounded-xl border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => void saveRow(row)}
                disabled={savingLicenseId === row.licenseId || !user}
                className="rounded-xl bg-[#2d4bb3] text-white hover:bg-[#243d93]"
              >
                {savingLicenseId === row.licenseId ? admin.savingLicense : admin.saveLicense}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}