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
import type { LandingLocale } from '@/lib/i18n/landing';

type CouponListItem = {
  id: number;
  code: string;
  stripeId: string;
  percentOff: number;
  annualOnly: boolean;
  maxRedemptions: number | null;
  timesRedeemed: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

type CouponsResponse = {
  ok: true;
  items: CouponListItem[];
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

type CouponFormState = {
  code: string;
  percentOff: string;
  annualOnly: boolean;
  maxRedemptions: string;
  expiresAt: string;
  isActive: boolean;
};

const DEFAULT_FILTERS: Filters = { q: '', status: 'all', page: 1, pageSize: 10 };

const EMPTY_FORM: CouponFormState = {
  code: '',
  percentOff: '',
  annualOnly: true,
  maxRedemptions: '',
  expiresAt: '',
  isActive: true,
};

function badgeClass(isActive: boolean) {
  return isActive
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-100 text-slate-500';
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CA');
}

export default function AdminCouponsClient({ locale }: { locale: LandingLocale }) {
  void locale;

  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [rows, setRows] = React.useState<CouponListItem[]>([]);
  const [pagination, setPagination] = React.useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<CouponListItem | null>(null);
  const [formState, setFormState] = React.useState<CouponFormState>(EMPTY_FORM);

  const fetchCoupons = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(filters.page),
        pageSize: String(filters.pageSize),
      });
      if (filters.q.trim()) params.set('q', filters.q.trim());
      if (filters.status !== 'all') params.set('status', filters.status);

      const response = await fetch(`/api/admin/coupons?${params.toString()}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as CouponsResponse | { error?: string } | null;

      if (!response.ok || !data || !('ok' in data)) {
        throw new Error((data as { error?: string } | null)?.error || 'Unable to load coupons.');
      }

      setRows(data.items);
      setPagination(data.pagination);
    } catch (nextError) {
      setRows([]);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load coupons.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    void fetchCoupons();
  }, [fetchCoupons]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? (value as number) : 1,
    }));
  }

  function openCreateDialog() {
    setEditingCoupon(null);
    setFormState(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(coupon: CouponListItem) {
    setEditingCoupon(coupon);
    setFormState({
      code: coupon.code,
      percentOff: String(coupon.percentOff),
      annualOnly: coupon.annualOnly,
      maxRedemptions: coupon.maxRedemptions === null ? '' : String(coupon.maxRedemptions),
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      isActive: coupon.isActive,
    });
    setDialogOpen(true);
  }

  function updateForm<K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  async function saveCoupon() {
    setSaving(true);
    setError(null);

    try {
      if (editingCoupon) {
        // PATCH — only mutable fields
        const payload = {
          isActive: formState.isActive,
          maxRedemptions: formState.maxRedemptions ? Number(formState.maxRedemptions) : null,
          expiresAt: formState.expiresAt || null,
        };

        const response = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || 'Unable to update coupon.');
        }
      } else {
        // POST — create
        const payload = {
          code: formState.code,
          percentOff: Number(formState.percentOff),
          annualOnly: formState.annualOnly,
          maxRedemptions: formState.maxRedemptions ? Number(formState.maxRedemptions) : null,
          expiresAt: formState.expiresAt || null,
        };

        const response = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || 'Unable to create coupon.');
        }
      }

      setDialogOpen(false);
      setEditingCoupon(null);
      await fetchCoupons();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save coupon.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoupon(coupon: CouponListItem) {
    const confirmed = window.confirm(`Delete the coupon "${coupon.code}"?`);
    if (!confirmed) return;

    setError(null);
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || 'Unable to delete coupon.');
      }
      await fetchCoupons();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete coupon.');
    }
  }

  const showingFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const showingTo = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900">Coupon Management</h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Create, manage, and track discount coupons synced with Stripe.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Search Coupons</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.q}
                onChange={(event) => updateFilter('q', event.target.value)}
                placeholder="Search by code..."
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
            Create Coupon
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-semibold text-slate-900">Coupon List</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-600">
              {pagination.total.toLocaleString()} coupons
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
                <TableHead>Code</TableHead>
                <TableHead>% Off</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Redemptions</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-slate-500">
                    Loading coupons...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-slate-500">
                    No coupons found for the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-medium text-slate-900">{coupon.code}</TableCell>
                    <TableCell className="text-slate-600">{coupon.percentOff}%</TableCell>
                    <TableCell className="text-slate-600">{coupon.annualOnly ? 'Annual only' : 'All intervals'}</TableCell>
                    <TableCell className="text-slate-600">
                      {coupon.timesRedeemed}{coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ''}
                    </TableCell>
                    <TableCell className="text-slate-600">{formatDate(coupon.expiresAt)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-medium ${badgeClass(coupon.isActive)}`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          onClick={() => openEditDialog(coupon)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                          onClick={() => void deleteCoupon(coupon)}
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
        <AdminDialogContent size="compact">
          <AdminDialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            <DialogDescription>
              {editingCoupon
                ? 'Update redemption limit, expiry, and activation. Code and discount cannot be changed after creation.'
                : 'Create a new percentage-off coupon. It will be synced to Stripe automatically.'}
            </DialogDescription>
          </AdminDialogHeader>

          <AdminDialogBody className="grid gap-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">Code</div>
              <Input
                value={formState.code}
                onChange={(event) => updateForm('code', event.target.value.toUpperCase())}
                placeholder="e.g. ANNUAL20"
                disabled={!!editingCoupon}
                className={editingCoupon ? 'opacity-60' : ''}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-600">Percent Off</div>
                <Input
                  inputMode="numeric"
                  value={formState.percentOff}
                  onChange={(event) => updateForm('percentOff', event.target.value)}
                  placeholder="e.g. 20"
                  disabled={!!editingCoupon}
                  className={editingCoupon ? 'opacity-60' : ''}
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-600">Max Redemptions</div>
                <Input
                  inputMode="numeric"
                  value={formState.maxRedemptions}
                  onChange={(event) => updateForm('maxRedemptions', event.target.value)}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">Expires At</div>
              <Input
                type="date"
                value={formState.expiresAt}
                onChange={(event) => updateForm('expiresAt', event.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Annual Only</div>
                <div className="text-xs text-slate-500">When enabled, this coupon can only be applied to annual plans.</div>
              </div>
              <Switch
                checked={formState.annualOnly}
                onCheckedChange={(checked) => updateForm('annualOnly', checked)}
                disabled={!!editingCoupon}
              />
            </div>

            {editingCoupon ? (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">Active</div>
                  <div className="text-xs text-slate-500">Deactivated coupons cannot be used at checkout.</div>
                </div>
                <Switch
                  checked={formState.isActive}
                  onCheckedChange={(checked) => updateForm('isActive', checked)}
                />
              </div>
            ) : null}
          </AdminDialogBody>

          <AdminDialogFooter>
            <Button variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#2f55d4] text-white hover:bg-[#2448be]" onClick={() => void saveCoupon()} disabled={saving}>
              {saving ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </AdminDialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  );
}
