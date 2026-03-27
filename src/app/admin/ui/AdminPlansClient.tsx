'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Plus, RotateCcw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { LandingLocale } from '@/lib/i18n/landing';

type OptionLicense = { id: string; name: string };
type OptionModule = { id: number; licenseId: string; name: string; slug: string; moduleKey: string };
type PlanCatalogItem = {
  id: number;
  tier: 'basic' | 'standard' | 'premium';
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
};

type PlanRule = {
  id: number;
  planId: number;
  licenseId: string;
  moduleId: number | null;
  flashcardsPerDay: number | null;
  practicePerDay: number | null;
  testsPerWeek: number | null;
  maxQuestionsPerSession: number | null;
  logbookAccess: boolean | null;
  updatedAt: string;
  plan: { id: number; tier: 'basic' | 'standard' | 'premium'; name: string; slug: string; isActive: boolean };
  license: { id: string; name: string };
  module: { id: number; name: string; slug: string; moduleKey: string } | null;
};

type PlansResponse = {
  ok: true;
  items: PlanRule[];
  options: { plans: PlanCatalogItem[]; licenses: OptionLicense[]; modules: OptionModule[] };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type Filters = {
  q: string;
  planId: string;
  licenseId: string;
  moduleId: string;
  page: number;
};

type FormState = {
  planId: string;
  licenseId: string;
  moduleId: string;
  flashcardsPerDay: string;
  practicePerDay: string;
  testsPerWeek: string;
  maxQuestionsPerSession: string;
  logbookAccess: boolean;
};

type PlanFormState = {
  name: string;
  description: string;
  isActive: boolean;
};

const DEFAULT_FILTERS: Filters = {
  q: '',
  planId: 'all',
  licenseId: 'all',
  moduleId: 'all',
  page: 1,
};

const EMPTY_FORM: FormState = {
  planId: '',
  licenseId: '',
  moduleId: 'license',
  flashcardsPerDay: '',
  practicePerDay: '',
  testsPerWeek: '',
  maxQuestionsPerSession: '',
  logbookAccess: false,
};

const EMPTY_PLAN_FORM: PlanFormState = {
  name: '',
  description: '',
  isActive: true,
};

function scopeLabel(rule: PlanRule) {
  return rule.module ? rule.module.name : 'License-wide';
}

function planBadgeClass(planTier: PlanCatalogItem['tier']) {
  if (planTier === 'premium') return 'bg-[#ede9fe] text-[#7c3aed]';
  if (planTier === 'standard') return 'bg-[#dbeafe] text-[#2563eb]';
  return 'bg-slate-100 text-slate-600';
}

function formatTier(planTier: PlanCatalogItem['tier']) {
  return planTier[0].toUpperCase() + planTier.slice(1);
}

function inputValue(value: number | null) {
  return value === null ? '' : String(value);
}

export default function AdminPlansClient({ locale }: { locale: LandingLocale }) {
  void locale;

  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [rows, setRows] = React.useState<PlanRule[]>([]);
  const [plans, setPlans] = React.useState<PlanCatalogItem[]>([]);
  const [licenses, setLicenses] = React.useState<OptionLicense[]>([]);
  const [modules, setModules] = React.useState<OptionModule[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({ page: 1, pageSize: 8, total: 0, totalPages: 1 });
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<PlanRule | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formState, setFormState] = React.useState<FormState>(EMPTY_FORM);
  const [planDialogOpen, setPlanDialogOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<PlanCatalogItem | null>(null);
  const [planFormState, setPlanFormState] = React.useState<PlanFormState>(EMPTY_PLAN_FORM);
  const [savingPlan, setSavingPlan] = React.useState(false);

  const filteredModules = React.useMemo(
    () => modules.filter((module) => module.licenseId === formState.licenseId),
    [formState.licenseId, modules],
  );

  const fetchRules = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: String(filters.page), pageSize: '8' });
      if (filters.q.trim()) params.set('q', filters.q.trim());
      if (filters.planId !== 'all') params.set('planId', filters.planId);
      if (filters.licenseId !== 'all') params.set('licenseId', filters.licenseId);
      if (filters.moduleId !== 'all') params.set('moduleId', filters.moduleId);

      const response = await fetch(`/api/admin/plans?${params.toString()}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as PlansResponse | { error?: string } | null;
      if (!response.ok || !data || !('ok' in data)) {
        throw new Error((data as { error?: string } | null)?.error || 'Unable to load plan rules.');
      }

      setRows(data.items);
      setPlans(data.options.plans);
      setLicenses(data.options.licenses);
      setModules(data.options.modules);
      setPagination(data.pagination);
    } catch (nextError) {
      setRows([]);
      setPlans([]);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load plan rules.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function openCreateDialog() {
    setEditingRule(null);
    setFormState({
      ...EMPTY_FORM,
      planId: plans[0] ? String(plans[0].id) : '',
    });
    setDialogOpen(true);
  }

  function openPlanDialog(plan: PlanCatalogItem) {
    setEditingPlan(plan);
    setPlanFormState({
      name: plan.name,
      description: plan.description ?? '',
      isActive: plan.isActive,
    });
    setPlanDialogOpen(true);
  }

  function openEditDialog(rule: PlanRule) {
    setEditingRule(rule);
    setFormState({
      planId: String(rule.planId),
      licenseId: rule.licenseId,
      moduleId: rule.moduleId ? String(rule.moduleId) : 'license',
      flashcardsPerDay: inputValue(rule.flashcardsPerDay),
      practicePerDay: inputValue(rule.practicePerDay),
      testsPerWeek: inputValue(rule.testsPerWeek),
      maxQuestionsPerSession: inputValue(rule.maxQuestionsPerSession),
      logbookAccess: Boolean(rule.logbookAccess),
    });
    setDialogOpen(true);
  }

  async function saveRule() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        planId: Number(formState.planId),
        licenseId: formState.licenseId,
        moduleId: formState.moduleId === 'license' ? null : Number(formState.moduleId),
        flashcardsPerDay: formState.flashcardsPerDay || null,
        practicePerDay: formState.practicePerDay || null,
        testsPerWeek: formState.testsPerWeek || null,
        maxQuestionsPerSession: formState.maxQuestionsPerSession || null,
        logbookAccess: formState.logbookAccess,
      };

      const response = await fetch(
        editingRule ? `/api/admin/plans/${editingRule.id}` : '/api/admin/plans',
        {
          method: editingRule ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to save plan rule.');
      }

      setDialogOpen(false);
      await fetchRules();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save plan rule.');
    } finally {
      setSaving(false);
    }
  }

  async function savePlan() {
    if (!editingPlan) return;

    setSavingPlan(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/plans/catalog/${editingPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planFormState.name,
          description: planFormState.description || null,
          isActive: planFormState.isActive,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to save plan.');
      }

      setPlanDialogOpen(false);
      await fetchRules();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save plan.');
    } finally {
      setSavingPlan(false);
    }
  }

  async function deleteRule(rule: PlanRule) {
    setError(null);

    try {
      const response = await fetch(`/api/admin/plans/${rule.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to delete plan rule.');
      }

      await fetchRules();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete plan rule.');
    }
  }

  const showingFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const showingTo = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900">License and Plan Management</h1>
          <p className="mt-1 text-[14px] text-slate-500">Keep the plan catalog, display names, status, and per-license usage limits aligned in one place.</p>
        </div>

        <Button onClick={openCreateDialog} className="h-10 rounded-xl bg-[#2f55d4] px-4 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(47,85,212,0.18)] hover:bg-[#2448be]">
          <Plus className="mr-2 h-4 w-4" />
          New Rule
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-semibold text-slate-900">Plan Catalog</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-600">{plans.length.toLocaleString()} plans</span>
          </div>
          <div className="text-[13px] text-slate-500">Each plan keeps the operational tier but now has its own display name and description.</div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-semibold text-slate-900">{plan.name}</h3>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${planBadgeClass(plan.tier)}`}>{formatTier(plan.tier)}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">{plan.description || 'No description configured yet.'}</p>
                </div>
                <span className={[
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                  plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                ].join(' ')}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-[12px] text-slate-500">
                <span>Slug: {plan.slug}</span>
                <Button variant="outline" onClick={() => openPlanDialog(plan)} className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  Edit details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-slate-900">Filters</h2>
          <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2f55d4] transition hover:text-[#2448be]">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[12px] font-medium text-slate-600">Search Rules</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={filters.q} onChange={(event) => updateFilter('q', event.target.value)} placeholder="Search by plan, license, module, or module key..." className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-[13px]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Plan</label>
            <Select value={filters.planId} onValueChange={(value) => updateFilter('planId', value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={String(plan.id)}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">License</label>
            <Select value={filters.licenseId} onValueChange={(value) => updateFilter('licenseId', value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Licenses</SelectItem>
                {licenses.map((license) => (
                  <SelectItem key={license.id} value={license.id}>{license.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-semibold text-slate-900">Plan Rules</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-600">{pagination.total.toLocaleString()} rules</span>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Plan</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">License</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Scope</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Flashcards/Day</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Practice/Day</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Tests/Week</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Session Max</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Logbook</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-[0.08em] text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index}><TableCell colSpan={9} className="py-5 text-sm text-slate-400">Loading plan rules...</TableCell></TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-slate-500">No plan rules found.</TableCell></TableRow>
              ) : rows.map((rule) => (
                <TableRow key={rule.id} className="bg-white hover:bg-slate-50/80">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px] font-semibold text-slate-800">{rule.plan.name}</span>
                      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${planBadgeClass(rule.plan.tier)}`}>{formatTier(rule.plan.tier)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] font-medium text-slate-800">{rule.license.name}</TableCell>
                  <TableCell className="text-[13px] text-slate-600">{scopeLabel(rule)}</TableCell>
                  <TableCell className="text-[13px] text-slate-600">{rule.flashcardsPerDay ?? 'Unlimited'}</TableCell>
                  <TableCell className="text-[13px] text-slate-600">{rule.practicePerDay ?? 'Unlimited'}</TableCell>
                  <TableCell className="text-[13px] text-slate-600">{rule.testsPerWeek ?? 'Unlimited'}</TableCell>
                  <TableCell className="text-[13px] text-slate-600">{rule.maxQuestionsPerSession ?? 'Default'}</TableCell>
                  <TableCell className="text-[13px] text-slate-600">{rule.logbookAccess ? 'Enabled' : 'Disabled'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"><MoreVertical className="h-4 w-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-slate-200 bg-white">
                        <DropdownMenuItem onSelect={() => openEditDialog(rule)}>Edit rule</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void deleteRule(rule)}>Delete rule</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-[13px] text-slate-500">Showing {showingFrom}-{showingTo} of {pagination.total.toLocaleString()} rules</div>
          <div className="flex items-center gap-1.5">
            <button type="button" disabled={pagination.page <= 1} onClick={() => updateFilter('page', Math.max(pagination.page - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: Math.min(pagination.totalPages, 3) }).map((_, index) => {
              const page = index + 1;
              const isActive = page === pagination.page;
              return <button key={page} type="button" onClick={() => updateFilter('page', page)} className={['flex h-8 w-8 items-center justify-center rounded-lg border text-[12px] font-semibold transition', isActive ? 'border-[#2f55d4] bg-[#2f55d4] text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'].join(' ')}>{page}</button>;
            })}
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => updateFilter('page', Math.min(pagination.page + 1, pagination.totalPages))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-slate-900">{editingRule ? 'Edit Plan Rule' : 'New Plan Rule'}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Configure limits and access for a named plan at license or module scope.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600">Plan</label>
              <Select value={formState.planId || 'none'} onValueChange={(value) => setFormState((current) => ({ ...current, planId: value === 'none' ? '' : value }))}>
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select plan</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600">License</label>
              <Select value={formState.licenseId || 'none'} onValueChange={(value) => setFormState((current) => ({ ...current, licenseId: value === 'none' ? '' : value, moduleId: 'license' }))}>
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue placeholder="Select license" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select license</SelectItem>
                  {licenses.map((license) => <SelectItem key={license.id} value={license.id}>{license.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[12px] font-medium text-slate-600">Scope</label>
              <Select value={formState.moduleId} onValueChange={(value) => setFormState((current) => ({ ...current, moduleId: value }))}>
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="license">License-wide</SelectItem>
                  {filteredModules.map((module) => <SelectItem key={module.id} value={String(module.id)}>{module.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Flashcards / Day</label><Input value={formState.flashcardsPerDay} onChange={(event) => setFormState((current) => ({ ...current, flashcardsPerDay: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Practice / Day</label><Input value={formState.practicePerDay} onChange={(event) => setFormState((current) => ({ ...current, practicePerDay: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Tests / Week</label><Input value={formState.testsPerWeek} onChange={(event) => setFormState((current) => ({ ...current, testsPerWeek: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Max Questions / Session</label><Input value={formState.maxQuestionsPerSession} onChange={(event) => setFormState((current) => ({ ...current, maxQuestionsPerSession: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 md:col-span-2">
              <div>
                <div className="text-[13px] font-medium text-slate-800">Logbook Access</div>
                <div className="text-[12px] text-slate-500">Toggle whether this scope explicitly enables logbook access.</div>
              </div>
              <Switch checked={formState.logbookAccess} onCheckedChange={(checked) => setFormState((current) => ({ ...current, logbookAccess: checked }))} />
            </div>
          </div>
          <DialogFooter className="border-t border-slate-200 px-6 py-4 sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">Cancel</Button>
            <Button onClick={() => void saveRule()} disabled={saving || !formState.planId || !formState.licenseId} className="rounded-xl bg-[#2f55d4] text-white hover:bg-[#2448be]">{saving ? 'Saving...' : editingRule ? 'Save Changes' : 'Create Rule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-slate-900">Edit Plan Details</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">This controls the plan name shown in admin and any public surfaces that read the plan catalog later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
              Tier base: <span className="font-semibold text-slate-800">{editingPlan ? formatTier(editingPlan.tier) : '-'}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600">Plan Name</label>
              <Input value={planFormState.name} onChange={(event) => setPlanFormState((current) => ({ ...current, name: event.target.value }))} className="h-11 rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600">Description</label>
              <Textarea value={planFormState.description} onChange={(event) => setPlanFormState((current) => ({ ...current, description: event.target.value }))} className="min-h-[120px] rounded-xl border-slate-200" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <div className="text-[13px] font-medium text-slate-800">Plan Active</div>
                <div className="text-[12px] text-slate-500">Inactive plans stay registered but can be visually flagged in the catalog.</div>
              </div>
              <Switch checked={planFormState.isActive} onCheckedChange={(checked) => setPlanFormState((current) => ({ ...current, isActive: checked }))} />
            </div>
          </div>
          <DialogFooter className="border-t border-slate-200 px-6 py-4 sm:justify-end">
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)} className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">Cancel</Button>
            <Button onClick={() => void savePlan()} disabled={savingPlan || !planFormState.name.trim()} className="rounded-xl bg-[#2f55d4] text-white hover:bg-[#2448be]">{savingPlan ? 'Saving...' : 'Save Plan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
