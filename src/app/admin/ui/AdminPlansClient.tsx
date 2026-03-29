'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import {
  AdminDialogBody,
  AdminDialogContent,
  AdminDialogFooter,
  AdminDialogHeader,
} from '@/components/admin/AdminDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { LandingLocale } from '@/lib/i18n/landing';

type LimitUnit = 'day' | 'week' | 'month';

type PlanListItem = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price: string | null;
  maxLicenses: number;
  flashcardsLimit: number;
  flashcardsUnit: LimitUnit;
  practiceLimit: number;
  practiceUnit: LimitUnit;
  testsLimit: number;
  testsUnit: LimitUnit;
  maxQuestionsPerSession: number | null;
  logbookAccess: boolean;
  displayOrder: number;
  isActive: boolean;
  stripeProductId: string | null;
  stripePriceMonthly: string | null;
  stripePriceAnnual: string | null;
  trialDays: number;
  createdAt: string;
  updatedAt: string;
  userCount: number;
};

type PlansResponse = {
  ok: true;
  items: PlanListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type Filters = {
  q: string;
  status: 'all' | 'active' | 'inactive';
  page: number;
  pageSize: number;
};

type PlanFormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  maxLicenses: string;
  flashcardsLimit: string;
  flashcardsUnit: LimitUnit;
  practiceLimit: string;
  practiceUnit: LimitUnit;
  testsLimit: string;
  testsUnit: LimitUnit;
  maxQuestionsPerSession: string;
  logbookAccess: boolean;
  displayOrder: string;
  isActive: boolean;
  stripeProductId: string;
  stripePriceMonthly: string;
  stripePriceAnnual: string;
  trialDays: string;
};

const DEFAULT_FILTERS: Filters = {
  q: '',
  status: 'all',
  page: 1,
  pageSize: 10,
};

const EMPTY_FORM: PlanFormState = {
  name: '',
  slug: '',
  description: '',
  price: '',
  maxLicenses: '0',
  flashcardsLimit: '0',
  flashcardsUnit: 'day',
  practiceLimit: '0',
  practiceUnit: 'day',
  testsLimit: '0',
  testsUnit: 'week',
  maxQuestionsPerSession: '',
  logbookAccess: false,
  displayOrder: '0',
  isActive: true,
  stripeProductId: '',
  stripePriceMonthly: '',
  stripePriceAnnual: '',
  trialDays: '7',
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function limitLabel(limit: number, unit: LimitUnit) {
  if (limit < 0) return 'Unlimited';
  if (limit === 0) return 'None';
  const suffix = limit === 1 ? unit : `${unit}s`;
  return `${limit} / ${suffix}`;
}

function formatPrice(value: string | null) {
  if (!value) return 'Not set';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatCertificationLimit(limit: number) {
  if (limit < 0) return 'Unlimited';
  if (limit === 0) return 'None';
  return String(limit);
}

function badgeClass(isActive: boolean) {
  return isActive
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-100 text-slate-500';
}

export default function AdminPlansClient({ locale }: { locale: LandingLocale }) {
  void locale;

  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [rows, setRows] = React.useState<PlanListItem[]>([]);
  const [pagination, setPagination] = React.useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<PlanListItem | null>(null);
  const [formState, setFormState] = React.useState<PlanFormState>(EMPTY_FORM);

  const fetchPlans = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(filters.page),
        pageSize: String(filters.pageSize),
      });

      if (filters.q.trim()) {
        params.set('q', filters.q.trim());
      }

      if (filters.status !== 'all') {
        params.set('status', filters.status);
      }

      const response = await fetch(`/api/admin/plans?${params.toString()}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as PlansResponse | { error?: string } | null;

      if (!response.ok || !data || !('ok' in data)) {
        throw new Error((data as { error?: string } | null)?.error || 'Unable to load plans.');
      }

      setRows(data.items);
      setPagination(data.pagination);
    } catch (nextError) {
      setRows([]);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load plans.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? (value as number) : 1,
    }));
  }

  function openCreateDialog() {
    setEditingPlan(null);
    setFormState(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(plan: PlanListItem) {
    setEditingPlan(plan);
    setFormState({
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? '',
      price: plan.price ?? '',
      maxLicenses: String(plan.maxLicenses),
      flashcardsLimit: String(plan.flashcardsLimit),
      flashcardsUnit: plan.flashcardsUnit,
      practiceLimit: String(plan.practiceLimit),
      practiceUnit: plan.practiceUnit,
      testsLimit: String(plan.testsLimit),
      testsUnit: plan.testsUnit,
      maxQuestionsPerSession: plan.maxQuestionsPerSession === null ? '' : String(plan.maxQuestionsPerSession),
      logbookAccess: plan.logbookAccess,
      displayOrder: String(plan.displayOrder),
      isActive: plan.isActive,
      stripeProductId: plan.stripeProductId ?? '',
      stripePriceMonthly: plan.stripePriceMonthly ?? '',
      stripePriceAnnual: plan.stripePriceAnnual ?? '',
      trialDays: String(plan.trialDays),
    });
    setDialogOpen(true);
  }

  function updateForm<K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) {
    setFormState((current) => {
      const next = { ...current, [key]: value };
      if (key === 'name' && !editingPlan) {
        next.slug = normalizeSlug(String(value));
      }
      return next;
    });
  }

  async function savePlan() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: formState.name,
        slug: normalizeSlug(formState.slug || formState.name),
        description: formState.description,
        price: formState.price,
        maxLicenses: formState.maxLicenses,
        flashcardsLimit: formState.flashcardsLimit,
        flashcardsUnit: formState.flashcardsUnit,
        practiceLimit: formState.practiceLimit,
        practiceUnit: formState.practiceUnit,
        testsLimit: formState.testsLimit,
        testsUnit: formState.testsUnit,
        maxQuestionsPerSession: formState.maxQuestionsPerSession,
        logbookAccess: formState.logbookAccess,
        displayOrder: formState.displayOrder,
        isActive: formState.isActive,
        stripeProductId: formState.stripeProductId,
        stripePriceMonthly: formState.stripePriceMonthly,
        stripePriceAnnual: formState.stripePriceAnnual,
        trialDays: formState.trialDays,
      };

      const response = await fetch(
        editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans',
        {
          method: editingPlan ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to save plan.');
      }

      setDialogOpen(false);
      setEditingPlan(null);
      await fetchPlans();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save plan.');
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(plan: PlanListItem) {
    const confirmed = window.confirm(`Delete the plan "${plan.name}"?`);
    if (!confirmed) return;

    setError(null);

    try {
      const response = await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to delete plan.');
      }

      await fetchPlans();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete plan.');
    }
  }

  const showingFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const showingTo = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900">Plan Management</h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Search, create, and maintain dynamic plans with pricing, limits, and certification caps.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Search Plans</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.q}
                onChange={(event) => updateFilter('q', event.target.value)}
                placeholder="Search by name, slug, or description..."
                className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-[13px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Status</label>
            <Select value={filters.status} onValueChange={(value: Filters['status']) => updateFilter('status', value)}>
              <SelectTrigger className="h-11 w-[140px] rounded-xl border-slate-200 bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={openCreateDialog}
            className="h-11 rounded-xl bg-[#2f55d4] px-4 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(47,85,212,0.18)] hover:bg-[#2448be]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-semibold text-slate-900">Plan List</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-600">
              {pagination.total.toLocaleString()} plans
            </span>
          </div>

          <div className="text-[12px] text-slate-500">
            Showing {showingFrom}-{showingTo} of {pagination.total}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/90">
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Max Licenses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-slate-500">
                    Loading plans...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-slate-500">
                    No plans found for the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">{plan.name}</div>
                        <div className="line-clamp-2 text-[12px] text-slate-500">{plan.description || 'No description'}</div>
                        <div className="text-[11px] text-slate-400">
                          Flashcards {limitLabel(plan.flashcardsLimit, plan.flashcardsUnit)} · Practice {limitLabel(plan.practiceLimit, plan.practiceUnit)} · Tests {limitLabel(plan.testsLimit, plan.testsUnit)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{plan.slug}</TableCell>
                    <TableCell className="text-slate-600">{formatPrice(plan.price)}</TableCell>
                    <TableCell className="text-slate-600">{formatCertificationLimit(plan.maxLicenses)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-medium ${badgeClass(plan.isActive)}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{plan.userCount}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          onClick={() => openEditDialog(plan)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                          onClick={() => void deletePlan(plan)}
                          disabled={plan.userCount > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-[12px] text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-[12px] font-medium text-slate-600">Rows</label>
              <Select value={String(filters.pageSize)} onValueChange={(value) => updateFilter('pageSize', Number(value))}>
                <SelectTrigger className="h-9 w-[110px] rounded-xl border-slate-200 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => updateFilter('page', Math.max(filters.page - 1, 1))}
              disabled={filters.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => updateFilter('page', Math.min(filters.page + 1, pagination.totalPages))}
              disabled={filters.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AdminDialogContent size="wide">
          <AdminDialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            <DialogDescription>
              Configure pricing, certification cap, and study limits directly on the plan.
            </DialogDescription>
          </AdminDialogHeader>

          <AdminDialogBody className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">Name</div>
              <Input value={formState.name} onChange={(event) => updateForm('name', event.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">Slug</div>
              <Input value={formState.slug} onChange={(event) => updateForm('slug', normalizeSlug(event.target.value))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="text-xs font-medium text-slate-600">Description</div>
              <Textarea value={formState.description} onChange={(event) => updateForm('description', event.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">Price</div>
              <Input inputMode="decimal" value={formState.price} onChange={(event) => updateForm('price', event.target.value)} placeholder="29.90" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">Max Licenses</div>
              <Input inputMode="numeric" value={formState.maxLicenses} onChange={(event) => updateForm('maxLicenses', event.target.value)} placeholder="-1 = unlimited, 0 = none" />
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 md:col-span-2">
              <div className="mb-3 text-sm font-medium text-slate-900">Usage Limits</div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-600">Flashcards</div>
                  <Input inputMode="numeric" value={formState.flashcardsLimit} onChange={(event) => updateForm('flashcardsLimit', event.target.value)} placeholder="-1 = unlimited, 0 = none" />
                  <Select value={formState.flashcardsUnit} onValueChange={(value) => updateForm('flashcardsUnit', value as LimitUnit)}>
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-600">Practice</div>
                  <Input inputMode="numeric" value={formState.practiceLimit} onChange={(event) => updateForm('practiceLimit', event.target.value)} placeholder="-1 = unlimited, 0 = none" />
                  <Select value={formState.practiceUnit} onValueChange={(value) => updateForm('practiceUnit', value as LimitUnit)}>
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-600">Tests</div>
                  <Input inputMode="numeric" value={formState.testsLimit} onChange={(event) => updateForm('testsLimit', event.target.value)} placeholder="-1 = unlimited, 0 = none" />
                  <Select value={formState.testsUnit} onValueChange={(value) => updateForm('testsUnit', value as LimitUnit)}>
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">Max Questions Per Session</div>
              <Input inputMode="numeric" value={formState.maxQuestionsPerSession} onChange={(event) => updateForm('maxQuestionsPerSession', event.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">Display Order</div>
              <Input inputMode="numeric" value={formState.displayOrder} onChange={(event) => updateForm('displayOrder', event.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Logbook Access</div>
                <div className="text-xs text-slate-500">Controls access to logbook modules for enrolled licenses.</div>
              </div>
              <Switch checked={formState.logbookAccess} onCheckedChange={(checked) => updateForm('logbookAccess', checked)} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Active Plan</div>
                <div className="text-xs text-slate-500">Inactive plans stay in the catalog but cannot be chosen by users.</div>
              </div>
              <Switch checked={formState.isActive} onCheckedChange={(checked) => updateForm('isActive', checked)} />
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 md:col-span-2">
              <div className="mb-3 text-sm font-medium text-slate-900">Stripe Integration</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-600">Stripe Product ID</div>
                  <Input value={formState.stripeProductId} onChange={(event) => updateForm('stripeProductId', event.target.value)} placeholder="prod_..." />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-600">Trial Days</div>
                  <Input inputMode="numeric" value={formState.trialDays} onChange={(event) => updateForm('trialDays', event.target.value)} placeholder="7" />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-600">Stripe Price ID (Monthly)</div>
                  <Input value={formState.stripePriceMonthly} onChange={(event) => updateForm('stripePriceMonthly', event.target.value)} placeholder="price_..." />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-600">Stripe Price ID (Annual)</div>
                  <Input value={formState.stripePriceAnnual} onChange={(event) => updateForm('stripePriceAnnual', event.target.value)} placeholder="price_..." />
                </div>
              </div>
            </div>
          </AdminDialogBody>

          <AdminDialogFooter>
            <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#2f55d4] text-white hover:bg-[#2448be]" onClick={() => void savePlan()} disabled={saving}>
              {saving ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </AdminDialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  );
}