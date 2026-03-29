'use client';

import React from 'react';
import type { LandingLocale } from '@/lib/i18n/landing';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getAppDictionary } from '@/lib/i18n/app';

type UserPlan = {
  id: number;
  name: string;
  slug: string;
  maxLicenses: number;
  isActive: boolean;
};

type EntitlementRow = {
  licenseId: string;
  exists: boolean;
  isActive: boolean;
  enrolledAt: string | null;
  countsAgainstLimit: boolean;
};

type TargetUser = {
  id: number;
  email: string;
  name: string | null;
  plan: UserPlan | null;
};

function humanizeLicenseId(licenseId: string, locale: LandingLocale) {
  if (licenseId === 'regs') return 'REGS';
  if (licenseId === 'm') return 'M';
  if (licenseId === 'e') return 'E';
  if (licenseId === 's') return 'S';
  if (licenseId === 'balloons') return locale === 'pt' ? 'Balões' : 'Balloons';
  return licenseId;
}

function formatCertificationLimit(limit: number) {
  if (limit < 0) return 'Unlimited';
  if (limit === 0) return 'None';
  return String(limit);
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

  async function toggleRow(row: EntitlementRow) {
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
          isActive: !row.isActive,
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
          <CardDescription className="text-slate-500">{admin.findUserDescription}</CardDescription>
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

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {user ? (
        <Card className="border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">{admin.user}</CardTitle>
            <CardDescription className="text-slate-500">
              {user.name || admin.noName} · {user.email} · ID {user.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Plan: {user.plan?.name ?? 'No plan selected'} · Limit: {user.plan ? formatCertificationLimit(user.plan.maxLicenses) : 'N/A'}
          </CardContent>
        </Card>
      ) : null}

      {rows.map((row) => (
        <Card key={row.licenseId} className="border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">{humanizeLicenseId(row.licenseId, locale)}</CardTitle>
            <CardDescription className="text-slate-500">
              {row.countsAgainstLimit ? 'Counts toward certification limit.' : 'Always included and excluded from the certification limit.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              Status: {row.isActive ? 'Enrolled' : 'Not enrolled'}
              {row.enrolledAt ? ` · Since ${new Date(row.enrolledAt).toLocaleDateString()}` : ''}
            </div>

            <Button
              onClick={() => void toggleRow(row)}
              disabled={savingLicenseId === row.licenseId}
              className={row.isActive ? 'rounded-xl bg-slate-800 text-white hover:bg-slate-700' : 'rounded-xl bg-[#2d4bb3] text-white hover:bg-[#243d93]'}
            >
              {savingLicenseId === row.licenseId ? admin.savingLicense : row.isActive ? 'Remove enrollment' : 'Enroll'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}