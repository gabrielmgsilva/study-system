'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import {
  AdminDialogBody,
  AdminDialogContent,
  AdminDialogFooter,
  AdminDialogHeader,
} from '@/components/admin/AdminDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { LandingLocale } from '@/lib/i18n/landing';
import { localizeAppHref } from '@/lib/i18n/app';
import { ROUTES } from '@/lib/routes';

type LicenseListItem = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  moduleCount: number;
  subjectCount: number;
  topicCount: number;
  questionCount: number;
};

type LicensesResponse = {
  ok: true;
  items: LicenseListItem[];
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

type LicenseFormState = {
  id: string;
  name: string;
  description: string;
  displayOrder: string;
  isActive: boolean;
};

const DEFAULT_FILTERS: Filters = {
  q: '',
  status: 'all',
  page: 1,
  pageSize: 12,
};

const EMPTY_FORM: LicenseFormState = {
  id: '',
  name: '',
  description: '',
  displayOrder: '0',
  isActive: true,
};

function normalizeLicenseId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function badgeClass(isActive: boolean) {
  return isActive
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-100 text-slate-500';
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value));
}

export default function AdminLicensesClient({ locale }: { locale: LandingLocale }) {
  const router = useRouter();
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [rows, setRows] = React.useState<LicenseListItem[]>([]);
  const [pagination, setPagination] = React.useState({ page: 1, pageSize: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingLicense, setEditingLicense] = React.useState<LicenseListItem | null>(null);
  const [formState, setFormState] = React.useState<LicenseFormState>(EMPTY_FORM);

  const fetchLicenses = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(filters.page),
        pageSize: String(filters.pageSize),
      });

      if (filters.q.trim()) params.set('q', filters.q.trim());
      if (filters.status !== 'all') params.set('status', filters.status);

      const response = await fetch(`/api/admin/licenses?${params.toString()}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as LicensesResponse | { error?: string } | null;

      if (!response.ok || !data || !('ok' in data)) {
        throw new Error((data as { error?: string } | null)?.error || 'Unable to load certifications.');
      }

      setRows(data.items);
      setPagination(data.pagination);
    } catch (nextError) {
      setRows([]);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load certifications.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    void fetchLicenses();
  }, [fetchLicenses]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? (value as number) : 1,
    }));
  }

  function openCreateDialog() {
    setEditingLicense(null);
    setFormState(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(license: LicenseListItem) {
    setEditingLicense(license);
    setFormState({
      id: license.id,
      name: license.name,
      description: license.description ?? '',
      displayOrder: String(license.displayOrder),
      isActive: license.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        id: normalizeLicenseId(formState.id),
        name: formState.name.trim(),
        description: formState.description.trim(),
        displayOrder: formState.displayOrder.trim(),
        isActive: formState.isActive,
      };

      const response = await fetch(
        editingLicense ? `/api/admin/licenses/${editingLicense.id}` : '/api/admin/licenses',
        {
          method: editingLicense ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; item?: LicenseListItem } | null;
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to save certification.');
      }

      const createdLicenseId = !editingLicense ? data.item?.id ?? payload.id : null;

      setDialogOpen(false);
      setEditingLicense(null);
      setFormState(EMPTY_FORM);
      await fetchLicenses();

      if (createdLicenseId && window.confirm('Certification created. Open its module structure now?')) {
        router.push(localizeAppHref(ROUTES.adminContentLicense(createdLicenseId), locale));
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save certification.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(license: LicenseListItem) {
    if (!window.confirm(`Delete certification ${license.name}?`)) return;

    setError(null);

    try {
      const response = await fetch(`/api/admin/licenses/${license.id}`, { method: 'DELETE' });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to delete certification.');
      }

      await fetchLicenses();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete certification.');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2f55d4]">Content administration</p>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Certifications</h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage the certification catalog first, then drill down into modules, subjects, topics, and questions.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-[250px] flex-1 lg:w-[320px] lg:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.q}
                onChange={(event) => updateFilter('q', event.target.value)}
                className="h-10 rounded-xl border-slate-200 pl-9"
                placeholder="Search by slug, name, or description"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value as Filters['status'])}>
              <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 sm:w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button type="button" onClick={openCreateDialog} className="h-10 rounded-xl bg-[#2f55d4] px-4 hover:bg-[#2448be]">
              <Plus className="mr-2 h-4 w-4" />
              New certification
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[250px] animate-pulse rounded-[24px] border border-slate-200 bg-white" />
              ))
            : rows.map((license) => (
                <Card key={license.id} className="gap-4 rounded-[24px] border-slate-200 py-0 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                  <CardHeader className="space-y-4 px-5 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-lg text-slate-900">{license.name}</CardTitle>
                          <Badge variant="outline" className={badgeClass(license.isActive)}>
                            {license.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{license.id}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100" onClick={() => openEditDialog(license)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={() => void handleDelete(license)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 px-5">
                    <p className="min-h-[44px] text-sm leading-6 text-slate-500">
                      {license.description?.trim() || 'No description configured for this certification yet.'}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Modules</div>
                        <div className="mt-2 text-2xl font-semibold text-slate-900">{license.moduleCount}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Questions</div>
                        <div className="mt-2 text-2xl font-semibold text-slate-900">{license.questionCount}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Subjects</div>
                        <div className="mt-2 text-lg font-semibold text-slate-900">{license.subjectCount}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Topics</div>
                        <div className="mt-2 text-lg font-semibold text-slate-900">{license.topicCount}</div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
                    <span>Updated {formatUpdatedAt(license.updatedAt)}</span>
                    <Link
                      href={localizeAppHref(ROUTES.adminContentLicense(license.id), locale)}
                      className="inline-flex items-center gap-2 font-semibold text-[#2f55d4] transition hover:text-[#2448be]"
                    >
                      Open structure
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardFooter>
                </Card>
              ))}
        </div>

        {!loading && rows.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
            No certifications found for the current filters.
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Showing {rows.length} of {pagination.total} certifications
          </div>

          <div className="flex items-center justify-end gap-3">
            <Select value={String(filters.pageSize)} onValueChange={(value) => updateFilter('pageSize', Number(value))}>
              <SelectTrigger className="h-9 w-[126px] rounded-xl border-slate-200">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 / page</SelectItem>
                <SelectItem value="12">12 / page</SelectItem>
                <SelectItem value="24">24 / page</SelectItem>
              </SelectContent>
            </Select>

            <button type="button" disabled={pagination.page <= 1} onClick={() => updateFilter('page', Math.max(pagination.page - 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-slate-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => updateFilter('page', Math.min(pagination.page + 1, pagination.totalPages))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AdminDialogContent size="form">
          <AdminDialogHeader>
            <DialogTitle>{editingLicense ? 'Edit certification' : 'Create certification'}</DialogTitle>
            <DialogDescription>
              Certifications are the top-level content containers used for module, subject, topic, and question drill-down.
            </DialogDescription>
          </AdminDialogHeader>

          <AdminDialogBody>
            <form id="license-form" className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Slug</label>
                <Input
                  value={formState.id}
                  onChange={(event) => setFormState((current) => ({ ...current, id: normalizeLicenseId(event.target.value) }))}
                  disabled={Boolean(editingLicense)}
                  placeholder="e"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Display order</label>
                <Input
                  value={formState.displayOrder}
                  onChange={(event) => setFormState((current) => ({ ...current, displayOrder: event.target.value }))}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="E Rating"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea
                value={formState.description}
                onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[110px]"
                placeholder="Describe the certification scope and expected content hierarchy."
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-700">Active</div>
                <div className="text-xs text-slate-500">Inactive certifications remain hidden from normal operational flows.</div>
              </div>
              <Switch checked={formState.isActive} onCheckedChange={(checked) => setFormState((current) => ({ ...current, isActive: checked }))} />
            </div>
            </form>
          </AdminDialogBody>

          <AdminDialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="license-form" disabled={saving} className="bg-[#2f55d4] hover:bg-[#2448be]">
              {saving ? 'Saving...' : editingLicense ? 'Save changes' : 'Create certification'}
            </Button>
          </AdminDialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  );
}