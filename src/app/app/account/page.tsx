'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';

import { getAppDictionary, getAppLocaleFromPathname } from '@/lib/i18n/app';
import { ROUTES } from '@/lib/routes';
import { getStudentState, type StudentState } from '@/lib/entitlementsClient';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LICENSE_LABELS: Record<string, string> = {
  m: 'Mechanical (M)',
  e: 'Avionics (E)',
  s: 'Structures (S)',
  balloons: 'Balloons',
  regs: 'REGS',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SubscriptionStatusBadge({
  status,
  labels,
}: {
  status: string | null;
  labels: Record<string, string>;
}) {
  if (!status) return null;

  const map: Record<string, { label: string; className: string }> = {
    active: {
      label: labels.active,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    trialing: {
      label: labels.trialing,
      className: 'bg-[#eef3ff] text-[#2d4bb3] border-[#c9d4f4]',
    },
    canceled: {
      label: labels.canceled,
      className: 'bg-slate-50 text-slate-600 border-slate-200',
    },
    past_due: {
      label: labels.pastDue,
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  };

  const config = map[status] ?? {
    label: status,
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <Badge variant="outline" className={`text-xs font-semibold ${config.className}`}>
      {config.label}
    </Badge>
  );
}

function StatusIcon({ active, status }: { active: boolean; status: string | null }) {
  if (active) return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === 'past_due') return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-slate-400" />;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MyAccountPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getAppLocaleFromPathname(pathname);
  const d = getAppDictionary(locale);
  const a = d.account;

  // ── Subscription state ────────────────────────────────────────────────────
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<StudentState | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  async function refresh() {
    setReady(false);
    const s = await getStudentState({ force: true });
    setStudent(s);
    setReady(true);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleManageBilling() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch('/api/me/billing-portal', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setPortalError(
          res.status === 400 ? a.noBillingAccount : (data.message ?? a.billingPortalError),
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      setPortalError(a.billingPortalError);
    } finally {
      setPortalLoading(false);
    }
  }

  // ── Password change state ─────────────────────────────────────────────────
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMessage(null);
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdMessage({ ok: false, text: a.passwordMismatch });
      return;
    }
    setPwdLoading(true);
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwdMessage({ ok: false, text: data.message ?? 'Error' });
      } else {
        setPwdMessage({ ok: true, text: a.passwordChanged });
        setPwdForm({ current: '', next: '', confirm: '' });
      }
    } catch {
      setPwdMessage({ ok: false, text: 'Error' });
    } finally {
      setPwdLoading(false);
    }
  }

  // ── Account deletion state ────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/me/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: deleteConfirm }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.message ?? a.deleteAccountError);
        return;
      }
      router.push('/');
    } catch {
      setDeleteError(a.deleteAccountError);
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Derived subscription values ───────────────────────────────────────────
  const sub = student?.subscription ?? null;
  const plan = student?.plan ?? null;
  const enrolledCount = student?.enrollmentSummary?.count ?? 0;
  const maxLicenses = student?.enrollmentSummary?.max ?? 0;
  const enrolledLicenses = Object.keys(student?.licenseEntitlements ?? {});

  const isActive = sub?.active === true;
  const isTrialing = sub?.status === 'trialing';
  const isPastDue = sub?.status === 'past_due';
  const isCanceled = sub?.status === 'canceled';
  const hasSubscription = !!sub?.status && sub.status !== 'none';

  const statusLabels = {
    active: a.statusActive,
    trialing: a.statusTrialing,
    canceled: a.statusCanceled,
    pastDue: a.statusPastDue,
  };

  const dateLabel = isActive ? a.renewsOn : a.expiresOn;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
            {d.shell.profile}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{a.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{a.description}</p>
        </div>

        <Button
          onClick={refresh}
          variant="outline"
          size="sm"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          disabled={!ready}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {a.refresh}
        </Button>
      </div>

      {/* Subscription card */}
      <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <CreditCard className="h-5 w-5 text-[#2d4bb3]" />
            {a.subscriptionLabel}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {!ready ? (
            <div className="space-y-3">
              <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />
            </div>
          ) : !hasSubscription ? (
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-600">
                <XCircle className="h-5 w-5 text-slate-400" />
                <span className="font-medium">{a.noSubscription}</span>
              </div>
              <Button asChild className="bg-[#2d4bb3] text-white hover:bg-[#243d99]">
                <Link href={ROUTES.pricing}>{a.subscribeNow}</Link>
              </Button>
            </div>
          ) : (
            <div
              className={[
                'rounded-2xl border p-4',
                isPastDue
                  ? 'border-amber-200 bg-amber-50'
                  : isCanceled
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-[#c9d4f4] bg-[#eef3ff]',
              ].join(' ')}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StatusIcon active={isActive} status={sub?.status ?? null} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {plan?.name && (
                        <span className="font-semibold text-slate-900">{plan.name}</span>
                      )}
                      <SubscriptionStatusBadge
                        status={sub?.status ?? null}
                        labels={statusLabels}
                      />
                    </div>
                    {sub?.expiresAt && (
                      <p className="mt-1 text-xs text-slate-500">
                        {dateLabel}:{' '}
                        <span className="font-medium text-slate-700">
                          {formatDate(sub.expiresAt)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Upgrade during trial */}
                  {isTrialing && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-[#2d4bb3] text-white hover:bg-[#243d99]"
                    >
                      <Link href={ROUTES.pricing}>{a.upgradeNow}</Link>
                    </Button>
                  )}

                  <Button
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                    size="sm"
                    variant="outline"
                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    {portalLoading ? (
                      <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    )}
                    {a.manageBilling}
                  </Button>

                  {(isCanceled || isPastDue) && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-[#2d4bb3] text-white hover:bg-[#243d99]"
                    >
                      <Link href={ROUTES.pricing}>{a.viewPricing}</Link>
                    </Button>
                  )}
                </div>
              </div>

              {portalError && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {portalError}
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400">{a.note}</p>
        </CardContent>
      </Card>

      {/* Enrolled licenses card */}
      <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <ShieldCheck className="h-5 w-5 text-[#2d4bb3]" />
            {a.enrolledLicenses}
          </CardTitle>
          {maxLicenses > 0 && (
            <CardDescription className="text-slate-500">
              {enrolledCount} {a.ofMax} {maxLicenses}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {!ready ? (
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
            </div>
          ) : enrolledLicenses.length === 0 ? (
            <p className="text-sm text-slate-500">–</p>
          ) : (
            <ul className="space-y-2">
              {enrolledLicenses.map((licenseId) => (
                <li key={licenseId} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-slate-800">
                    {LICENSE_LABELS[licenseId] ?? licenseId.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Security — change password */}
      <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <KeyRound className="h-5 w-5 text-[#2d4bb3]" />
            {a.securityLabel}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-sm text-slate-700">
                {a.currentPassword}
              </Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={pwdForm.current}
                onChange={(e) => setPwdForm((p) => ({ ...p, current: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-sm text-slate-700">
                {a.newPassword}
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={pwdForm.next}
                onChange={(e) => setPwdForm((p) => ({ ...p, next: e.target.value }))}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-sm text-slate-700">
                {a.confirmPassword}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={pwdForm.confirm}
                onChange={(e) => setPwdForm((p) => ({ ...p, confirm: e.target.value }))}
                required
                minLength={8}
              />
            </div>

            {pwdMessage && (
              <p className={`text-xs ${pwdMessage.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                {pwdMessage.text}
              </p>
            )}

            <Button
              type="submit"
              disabled={pwdLoading}
              className="bg-[#2d4bb3] text-white hover:bg-[#243d99]"
            >
              {pwdLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {a.changePassword}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone — delete account */}
      <Card className="rounded-[30px] border-red-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            {a.dangerZoneLabel}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="mb-4 text-sm text-slate-600">{a.deleteAccountWarning}</p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                <Trash2 className="mr-2 h-4 w-4" />
                {a.deleteAccount}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{a.deleteAccount}</AlertDialogTitle>
                <AlertDialogDescription>{a.deleteAccountWarning}</AlertDialogDescription>
              </AlertDialogHeader>

              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={a.deleteAccountConfirmPlaceholder}
                className="my-2"
              />

              {deleteError && (
                <p className="text-xs text-red-600">{deleteError}</p>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setDeleteConfirm(''); setDeleteError(null); }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                  className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {a.deleteAccountConfirmButton}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
