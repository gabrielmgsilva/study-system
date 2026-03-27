'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Download, MoreVertical, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LandingLocale } from '@/lib/i18n/landing';

type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  role: 'user' | 'admin';
  primaryLicenseId: string | null;
  studyLevel: string | null;
  studyGoal: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creditBalance: number;
  licenseEntitlements: Array<{ licenseId: string; plan: 'basic' | 'standard' | 'premium' }>;
  studySnapshot: {
    questionsTotal: number;
    questionsCorrect: number;
    lastStudiedAt: string | null;
  };
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
  planTier: string;
  activityStatus: string;
  primaryLicenseId: string;
  riskLevel: string;
  q: string;
  lastLoginWindow: string;
  page: number;
};

const DEFAULT_FILTERS: Filters = {
  planTier: 'all',
  activityStatus: 'all',
  primaryLicenseId: 'all',
  riskLevel: 'all',
  q: '',
  lastLoginWindow: 'any',
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

function getHighestPlan(user: AdminUser) {
  const order = { basic: 1, standard: 2, premium: 3 } as const;
  return user.licenseEntitlements.reduce<'basic' | 'standard' | 'premium'>(
    (best, current) => (order[current.plan] > order[best] ? current.plan : best),
    'basic',
  );
}

function getPlanBadgeClass(plan: 'basic' | 'standard' | 'premium') {
  if (plan === 'premium') return 'bg-[#f3e8ff] text-[#9333ea]';
  if (plan === 'standard') return 'bg-[#dbeafe] text-[#2563eb]';
  return 'bg-slate-100 text-slate-600';
}

function getProgress(user: AdminUser) {
  const total = user.studySnapshot.questionsTotal;
  const correct = user.studySnapshot.questionsCorrect;

  if (total <= 0) {
    return user.onboardingCompletedAt ? 24 : 12;
  }

  return Math.max(Math.min(Math.round((correct / Math.max(total, 1)) * 100), 100), 1);
}

function getRisk(user: AdminUser) {
  const updatedAt = new Date(user.updatedAt).getTime();
  const diffDays = (Date.now() - updatedAt) / (24 * 60 * 60 * 1000);

  if (!user.onboardingCompletedAt || diffDays > 30) {
    return { label: 'High', className: 'bg-[#fee2e2] text-[#dc2626]' };
  }

  if (diffDays > 7) {
    return { label: 'Medium', className: 'bg-[#fef3c7] text-[#b45309]' };
  }

  return { label: 'Low', className: 'bg-[#dcfce7] text-[#16a34a]' };
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
        pageSize: '5',
      });

      if (filters.planTier !== 'all') params.set('planTier', filters.planTier);
      if (filters.activityStatus !== 'all') params.set('activityStatus', filters.activityStatus);
      if (filters.primaryLicenseId !== 'all') params.set('primaryLicenseId', filters.primaryLicenseId);
      if (filters.riskLevel !== 'all') params.set('riskLevel', filters.riskLevel);
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

        <div className="mt-5 grid gap-4 md:grid-cols-4">
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
            <label className="text-[12px] font-medium text-slate-600">Activity Status</label>
            <Select value={filters.activityStatus} onValueChange={(value) => updateFilter('activityStatus', value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-left text-[13px]">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
            <label className="text-[12px] font-medium text-slate-600">Churn Risk</label>
            <Select value={filters.riskLevel} onValueChange={(value) => updateFilter('riskLevel', value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-left text-[13px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
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
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Plan</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Course</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Progress</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Last Login</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Risk</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-[0.08em] text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
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
                  const plan = getHighestPlan(user);
                  const progress = getProgress(user);
                  const risk = getRisk(user);

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
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPlanBadgeClass(plan)}`}>
                          {plan[0].toUpperCase() + plan.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700">{LICENSE_LABELS[user.primaryLicenseId || 'regs'] || 'Not set'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-[82px]">
                            <Progress value={progress} className="h-1.5 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-[#22c55e]" />
                          </div>
                          <span className="text-[12px] font-medium text-slate-600">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-600">{formatTimeAgo(user.studySnapshot.lastStudiedAt || user.updatedAt)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${risk.className}`}>
                          {risk.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-slate-200 bg-white">
                            <DropdownMenuItem onSelect={() => openEdit(user)}>Edit user</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => updateFilter('q', user.email)}>Filter by email</DropdownMenuItem>
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

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-slate-900">Edit User</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Update admin-facing profile fields and role assignment.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
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
          </div>

          <DialogFooter className="border-t border-slate-200 px-6 py-4 sm:justify-between">
            <div className="text-xs text-slate-500">User ID {editingUser?.id}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)} className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">Cancel</Button>
              <Button onClick={() => void saveUser()} disabled={saving} className="rounded-xl bg-[#2f55d4] text-white hover:bg-[#2448be]">{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
