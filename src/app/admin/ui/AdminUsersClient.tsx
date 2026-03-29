'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Download, MoreVertical, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';

import {
  AdminDialogBody,
  AdminDialogContent,
  AdminDialogFooter,
  AdminDialogHeader,
} from '@/components/admin/AdminDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LandingLocale } from '@/lib/i18n/landing';

type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  status: 'active' | 'inactive';
  role: 'user' | 'admin';
  primaryLicenseId: string | null;
  studyLevel: string | null;
  studyGoal: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subscriptionStatus: string | null;
  subscriptionExpiresAt: string | null;
  stripeCustomerId: string | null;
  plan: { id: number; slug: string; name: string; isActive: boolean } | null;
  licenseEntitlements: Array<{ licenseId: string }>;
};

type UsersResponse = {
  ok: true;
  items: AdminUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type Filters = {
  status: string;
  planTier: string;
  activityStatus: string;
  primaryLicenseId: string;
  subscription: string;
  q: string;
  lastLoginWindow: string;
  pageSize: number;
  page: number;
};

const DEFAULT_FILTERS: Filters = {
  status: 'active',
  planTier: 'all',
  activityStatus: 'all',
  primaryLicenseId: 'all',
  subscription: 'all',
  q: '',
  lastLoginWindow: 'any',
  pageSize: 5,
  page: 1,
};

const LICENSE_LABELS: Record<string, string> = {
  m: 'M - Mechanics',
  e: 'E - Electronics',
  s: 'S - Systems',
  regs: 'REGS',
  balloons: 'Balloons',
};

function formatTimeAgo(value: string | null) {
  if (!value) return 'Never';

  const diff = Date.now() - new Date(value).getTime();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (diff < hour) {
    const minutes = Math.max(Math.round(diff / (60 * 1000)), 1);
    return `${minutes} min ago`;
  }

  if (diff < day) {
    const hours = Math.max(Math.round(diff / hour), 1);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  const days = Math.max(Math.round(diff / day), 1);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function getUserName(user: AdminUser) {
  return user.name?.trim() || user.username?.trim() || user.email;
}

function getUserInitials(user: AdminUser) {
  return getUserName(user)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getPlanLabel(user: AdminUser) {
  return user.plan?.name ?? 'No plan';
}

function getPlanBadgeClass(plan: AdminUser['plan']) {
  if (!plan) return 'bg-slate-100 text-slate-500';
  if (!plan.isActive) return 'bg-amber-50 text-amber-700';
  return 'bg-[#dbeafe] text-[#2563eb]';
}

function getStatusBadgeClass(status: AdminUser['status']) {
  return status === 'active'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
}

function getAvatarTint(index: number) {
  const palette = [
    'from-[#c7d2fe] to-[#93c5fd]',
    'from-[#fde68a] to-[#fca5a5]',
    'from-[#bbf7d0] to-[#86efac]',
    'from-[#fecdd3] to-[#c4b5fd]',
    'from-[#bfdbfe] to-[#a5f3fc]',
  ];
  return palette[index % palette.length];
}

function getSubscriptionBadge(status: string | null) {
  switch (status) {
    case 'active':
      return { label: 'Active', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' };
    case 'trialing':
      return { label: 'Trialing', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' };
    case 'past_due':
      return { label: 'Past Due', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' };
    case 'canceled':
      return { label: 'Canceled', className: 'bg-red-50 text-red-600 ring-1 ring-red-200' };
    default:
      return { label: 'None', className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' };
  }
}

export default function AdminUsersClient({ locale }: { locale: LandingLocale }) {
  void locale;

  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [rows, setRows] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formState, setFormState] = React.useState({
    name: '',
    username: '',
    role: 'user',
    primaryLicenseId: '',
    studyLevel: '',
    studyGoal: '',
  });

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(filters.page),
        pageSize: String(filters.pageSize),
      });

      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.planTier !== 'all') params.set('planTier', filters.planTier);
      if (filters.activityStatus !== 'all') params.set('activityStatus', filters.activityStatus);
      if (filters.primaryLicenseId !== 'all') params.set('primaryLicenseId', filters.primaryLicenseId);
      if (filters.subscription !== 'all') params.set('subscription', filters.subscription);
      if (filters.lastLoginWindow !== 'any') params.set('lastLoginWindow', filters.lastLoginWindow);
      if (filters.q.trim()) params.set('q', filters.q.trim());

      const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as UsersResponse | { error?: string } | null;

      if (!response.ok || !data || !('ok' in data)) {
        throw new Error((data as { error?: string } | null)?.error || 'Unable to load users.');
      }

      setRows(data.items);
      setPagination(data.pagination);
    } catch (nextError) {
      setRows([]);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function openEdit(user: AdminUser) {
    setEditingUser(user);
    setFormState({
      name: user.name ?? '',
      username: user.username ?? '',
      role: user.role,
      primaryLicenseId: user.primaryLicenseId ?? '',
      studyLevel: user.studyLevel ?? '',
      studyGoal: user.studyGoal ?? '',
    });
  }

  async function toggleUserStatus(user: AdminUser) {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const actionLabel = nextStatus === 'inactive' ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${getUserName(user)}?`)) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || `Unable to ${actionLabel} user.`);
      }

      if (editingUser?.id === user.id && nextStatus === 'inactive') {
        setEditingUser(null);
      }

      await fetchUsers();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : `Unable to ${actionLabel} user.`);
    } finally {
      setSaving(false);
    }
  }

  async function saveUser() {
    if (!editingUser) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name,
          username: formState.username,
          role: formState.role,
          primaryLicenseId: formState.primaryLicenseId || null,
          studyLevel: formState.studyLevel || null,
          studyGoal: formState.studyGoal || null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to save user.');
      }

      setEditingUser(null);
      await fetchUsers();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save user.');
    } finally {
      setSaving(false);
    }
  }

  async function cancelSubscription(user: AdminUser) {
    if (!window.confirm(`Cancel the subscription for ${getUserName(user)}?`)) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionAction: 'cancel' }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Unable to cancel subscription.');
      await fetchUsers();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to cancel subscription.');
    }
  }

  async function extendTrial(user: AdminUser) {
    const daysStr = window.prompt('How many days to extend the trial?', '7');
    if (!daysStr) return;
    const days = Number(daysStr);
    if (!Number.isFinite(days) || days < 1) return;

    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionAction: 'extend_trial', trialDays: days }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Unable to extend trial.');
      await fetchUsers();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to extend trial.');
    }
  }

  const showingFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const showingTo = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900">User Management</h1>
          <p className="mt-1 text-[14px] text-slate-500">Advanced search, filtering, and support tools for student accounts</p>
        </div>

        <Button className="h-10 rounded-xl bg-[#2f55d4] px-4 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(47,85,212,0.18)] hover:bg-[#2448be]">
          Bulk Actions
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-slate-900">Advanced Filters</h2>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2f55d4] transition hover:text-[#2448be]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-5">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Status</label>
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-left text-[13px]">
                <SelectValue placeholder="Active" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Plan Tier</label>
            <Select value={filters.planTier} onValueChange={(value) => updateFilter('planTier', value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-left text-[13px]">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Engagement</label>
            <Select value={filters.activityStatus} onValueChange={(value) => updateFilter('activityStatus', value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-left text-[13px]">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active recently</SelectItem>
                <SelectItem value="inactive">Inactive recently</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Course Focus</label>
            <Select value={filters.primaryLicenseId} onValueChange={(value) => updateFilter('primaryLicenseId', value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-left text-[13px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="m">M - Mechanics</SelectItem>
                <SelectItem value="e">E - Electronics</SelectItem>
                <SelectItem value="s">S - Systems</SelectItem>
                <SelectItem value="regs">REGS</SelectItem>
                <SelectItem value="balloons">Balloons</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Subscription</label>
            <Select value={filters.subscription} onValueChange={(value) => updateFilter('subscription', value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-left text-[13px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_120px]">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Search Users</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.q}
                onChange={(event) => updateFilter('q', event.target.value)}
                placeholder="Search by name, email, or username..."
                className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-[13px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Last Login</label>
            <Select value={filters.lastLoginWindow} onValueChange={(value) => updateFilter('lastLoginWindow', value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-left text-[13px]">
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any time</SelectItem>
                <SelectItem value="24h">24 hours</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="over30d">Over 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-semibold text-slate-900">User Directory</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-600">
              {pagination.total.toLocaleString()} users
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <button type="button" className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-700">
              <Download className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-700">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-10 px-4"><Checkbox /></TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">User</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Plan</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Subscription</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Course</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Last Login</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-[0.08em] text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: filters.pageSize }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4"><Checkbox disabled /></TableCell>
                    <TableCell colSpan={7} className="py-5 text-sm text-slate-400">Loading user records...</TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4"><Checkbox disabled /></TableCell>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">No users found for the current filters.</TableCell>
                </TableRow>
              ) : (
                rows.map((user, index) => {
                  const planLabel = getPlanLabel(user);

                  return (
                    <TableRow key={user.id} className="bg-white hover:bg-slate-50/80">
                      <TableCell className="px-4"><Checkbox /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarTint(index)} text-[12px] font-semibold text-slate-700`}>
                            {getUserInitials(user)}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-slate-900">{getUserName(user)}</div>
                            <div className="text-[11px] text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClass(user.status)}`}>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPlanBadgeClass(user.plan)}`}>
                          {planLabel}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getSubscriptionBadge(user.subscriptionStatus).className}`}>
                          {getSubscriptionBadge(user.subscriptionStatus).label}
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700">{LICENSE_LABELS[user.primaryLicenseId || 'regs'] || 'Not set'}</TableCell>
                      <TableCell className="text-[13px] text-slate-600">{formatTimeAgo(user.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-slate-200 bg-white">
                            <DropdownMenuItem onSelect={() => openEdit(user)}>Edit user</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => void extendTrial(user)}>Extend trial</DropdownMenuItem>
                            {user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing' ? (
                              <DropdownMenuItem
                                onSelect={() => void cancelSubscription(user)}
                                className="text-red-600 focus:text-red-600"
                              >
                                Cancel subscription
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              onSelect={() => void toggleUserStatus(user)}
                              className={user.status === 'active' ? 'text-red-600 focus:text-red-600' : ''}
                            >
                              {user.status === 'active' ? 'Deactivate user' : 'Reactivate user'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-[13px] text-slate-500">
            Showing {showingFrom}-{showingTo} of {pagination.total.toLocaleString()} users
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-[12px] font-medium text-slate-600">Rows</label>
              <Select value={String(filters.pageSize)} onValueChange={(value) => updateFilter('pageSize', Number(value))}>
                <SelectTrigger className="h-9 w-[110px] rounded-xl border-slate-200 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => updateFilter('page', Math.max(pagination.page - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 3) }).map((_, index) => {
              const page = index + 1;
              const isActive = page === pagination.page;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => updateFilter('page', page)}
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-lg border text-[12px] font-semibold transition',
                    isActive
                      ? 'border-[#2f55d4] bg-[#2f55d4] text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {page}
                </button>
              );
            })}
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateFilter('page', Math.min(pagination.page + 1, pagination.totalPages))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <AdminDialogContent size="narrow">
          <AdminDialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Edit User</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Update admin-facing profile fields and role assignment.</DialogDescription>
          </AdminDialogHeader>

          <AdminDialogBody className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600">Name</label>
              <Input value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} className="h-11 rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600">Username</label>
              <Input value={formState.username} onChange={(event) => setFormState((current) => ({ ...current, username: event.target.value }))} className="h-11 rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600">Role</label>
              <Select value={formState.role} onValueChange={(value) => setFormState((current) => ({ ...current, role: value }))}>
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600">Primary License</label>
              <Select value={formState.primaryLicenseId || 'none'} onValueChange={(value) => setFormState((current) => ({ ...current, primaryLicenseId: value === 'none' ? '' : value }))}>
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  <SelectItem value="m">M - Mechanics</SelectItem>
                  <SelectItem value="e">E - Electronics</SelectItem>
                  <SelectItem value="s">S - Systems</SelectItem>
                  <SelectItem value="regs">REGS</SelectItem>
                  <SelectItem value="balloons">Balloons</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600">Study Level</label>
              <Input value={formState.studyLevel} onChange={(event) => setFormState((current) => ({ ...current, studyLevel: event.target.value }))} className="h-11 rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600">Study Goal</label>
              <Input value={formState.studyGoal} onChange={(event) => setFormState((current) => ({ ...current, studyGoal: event.target.value }))} className="h-11 rounded-xl border-slate-200" />
            </div>
          </AdminDialogBody>

          <AdminDialogFooter className="sm:justify-between">
            <div className="text-xs text-slate-500">User ID {editingUser?.id}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)} className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">Cancel</Button>
              <Button onClick={() => void saveUser()} disabled={saving} className="rounded-xl bg-[#2f55d4] text-white hover:bg-[#2448be]">{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </AdminDialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  );
}
