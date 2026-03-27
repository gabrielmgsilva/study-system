'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Plus, RotateCcw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { LandingLocale } from '@/lib/i18n/landing';

type LicenseOption = { id: string; name: string };
type ModuleOption = { id: number; licenseId: string; name: string; moduleKey: string };
type SubjectOption = { id: number; moduleId: number; code: string; name: string };
type TopicOption = { id: number; subjectId: number; code: string; name: string };

type QuestionListItem = {
  id: number;
  externalId: string;
  locale: 'en' | 'pt';
  stem: string;
  difficulty: number | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  tags: string[];
  updatedAt: string;
  topic: {
    id: number;
    code: string;
    name: string;
    subject: {
      id: number;
      code: string;
      name: string;
      module: {
        id: number;
        name: string;
        moduleKey: string;
        license: { id: string; name: string };
      };
    };
  };
};

type QuestionDetail = {
  id: number;
  externalId: string;
  topicId: number;
  locale: 'en' | 'pt';
  stem: string;
  difficulty: number | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  tags: string[];
  sourceFile: string | null;
  topic: {
    id: number;
    subject: {
      id: number;
      module: {
        id: number;
        license: { id: string };
      };
    };
  };
  options: Array<{ optionKey: string; text: string; isCorrect: boolean }>;
  explanation: { correctExplanation: string | null } | null;
  references: Array<{ document: string | null; area: string | null; topicRef: string | null; locator: string | null; note: string | null }>;
};

type ContentResponse = {
  ok: true;
  items: QuestionListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type MetadataResponse = {
  ok: true;
  licenses: LicenseOption[];
  modules: ModuleOption[];
  subjects: SubjectOption[];
  topics: TopicOption[];
};

type DetailResponse = { ok: true; item: QuestionDetail };

type Filters = {
  q: string;
  licenseId: string;
  moduleId: string;
  subjectId: string;
  topicId: string;
  locale: string;
  status: string;
  page: number;
};

type QuestionForm = {
  externalId: string;
  licenseId: string;
  moduleId: string;
  subjectId: string;
  topicId: string;
  locale: 'en' | 'pt';
  status: 'draft' | 'review' | 'published' | 'archived';
  difficulty: string;
  sourceFile: string;
  stem: string;
  tags: string;
  correctOptionKey: 'A' | 'B' | 'C' | 'D';
  options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
  correctExplanation: string;
  referenceDocument: string;
  referenceArea: string;
  referenceTopicRef: string;
  referenceLocator: string;
  referenceNote: string;
};

const DEFAULT_FILTERS: Filters = {
  q: '',
  licenseId: 'all',
  moduleId: 'all',
  subjectId: 'all',
  topicId: 'all',
  locale: 'all',
  status: 'all',
  page: 1,
};

const EMPTY_FORM: QuestionForm = {
  externalId: '',
  licenseId: '',
  moduleId: '',
  subjectId: '',
  topicId: '',
  locale: 'en',
  status: 'draft',
  difficulty: '',
  sourceFile: '',
  stem: '',
  tags: '',
  correctOptionKey: 'A',
  options: [
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' },
  ],
  correctExplanation: '',
  referenceDocument: '',
  referenceArea: '',
  referenceTopicRef: '',
  referenceLocator: '',
  referenceNote: '',
};

function statusBadgeClass(status: QuestionListItem['status']) {
  if (status === 'published') return 'bg-[#dcfce7] text-[#16a34a]';
  if (status === 'review') return 'bg-[#fef3c7] text-[#b45309]';
  if (status === 'archived') return 'bg-slate-200 text-slate-600';
  return 'bg-[#fee2e2] text-[#dc2626]';
}

function localeBadgeClass(locale: QuestionListItem['locale']) {
  return locale === 'en' ? 'bg-[#dbeafe] text-[#2563eb]' : 'bg-[#ede9fe] text-[#7c3aed]';
}

function trimStem(stem: string) {
  return stem.length > 90 ? `${stem.slice(0, 90)}...` : stem;
}

export default function AdminContentClient({ locale }: { locale: LandingLocale }) {
  void locale;

  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [rows, setRows] = React.useState<QuestionListItem[]>([]);
  const [pagination, setPagination] = React.useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [licenses, setLicenses] = React.useState<LicenseOption[]>([]);
  const [modules, setModules] = React.useState<ModuleOption[]>([]);
  const [subjects, setSubjects] = React.useState<SubjectOption[]>([]);
  const [topics, setTopics] = React.useState<TopicOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingQuestionId, setEditingQuestionId] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formState, setFormState] = React.useState<QuestionForm>(EMPTY_FORM);

  const filteredModules = React.useMemo(() => modules.filter((module) => module.licenseId === formState.licenseId), [formState.licenseId, modules]);
  const filteredSubjects = React.useMemo(() => subjects.filter((subject) => String(subject.moduleId) === formState.moduleId), [formState.moduleId, subjects]);
  const filteredTopics = React.useMemo(() => topics.filter((topic) => String(topic.subjectId) === formState.subjectId), [formState.subjectId, topics]);

  const fetchMetadata = React.useCallback(async (licenseId?: string, moduleId?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (licenseId) params.set('licenseId', licenseId);
    if (moduleId) params.set('moduleId', moduleId);
    if (subjectId) params.set('subjectId', subjectId);

    const response = await fetch(`/api/admin/content/metadata?${params.toString()}`, { cache: 'no-store' });
    const data = (await response.json().catch(() => null)) as MetadataResponse | null;
    if (!response.ok || !data?.ok) throw new Error('Unable to load metadata.');
    return data;
  }, []);

  const fetchQuestions = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: String(filters.page), pageSize: '10' });
      if (filters.q.trim()) params.set('q', filters.q.trim());
      if (filters.licenseId !== 'all') params.set('licenseId', filters.licenseId);
      if (filters.moduleId !== 'all') params.set('moduleId', filters.moduleId);
      if (filters.subjectId !== 'all') params.set('subjectId', filters.subjectId);
      if (filters.topicId !== 'all') params.set('topicId', filters.topicId);
      if (filters.locale !== 'all') params.set('locale', filters.locale);
      if (filters.status !== 'all') params.set('status', filters.status);

      const [metadata, response] = await Promise.all([
        fetchMetadata(filters.licenseId !== 'all' ? filters.licenseId : undefined, filters.moduleId !== 'all' ? filters.moduleId : undefined, filters.subjectId !== 'all' ? filters.subjectId : undefined),
        fetch(`/api/admin/content?${params.toString()}`, { cache: 'no-store' }),
      ]);

      const data = (await response.json().catch(() => null)) as ContentResponse | { error?: string } | null;
      if (!response.ok || !data || !('ok' in data)) {
        throw new Error((data as { error?: string } | null)?.error || 'Unable to load content.');
      }

      setLicenses(metadata.licenses);
      setModules(metadata.modules);
      setSubjects(metadata.subjects);
      setTopics(metadata.topics);
      setRows(data.items);
      setPagination(data.pagination);
    } catch (nextError) {
      setRows([]);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load content.');
    } finally {
      setLoading(false);
    }
  }, [fetchMetadata, filters]);

  React.useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'licenseId' ? { moduleId: 'all', subjectId: 'all', topicId: 'all' } : {}),
      ...(key === 'moduleId' ? { subjectId: 'all', topicId: 'all' } : {}),
      ...(key === 'subjectId' ? { topicId: 'all' } : {}),
      page: key === 'page' ? (value as number) : 1,
    }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  async function openCreateDialog() {
    setEditingQuestionId(null);
    const metadata = await fetchMetadata();
    setLicenses(metadata.licenses);
    setModules(metadata.modules);
    setSubjects([]);
    setTopics([]);
    setFormState(EMPTY_FORM);
    setDialogOpen(true);
  }

  async function openEditDialog(questionId: number) {
    setError(null);

    try {
      const response = await fetch(`/api/admin/content/${questionId}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as DetailResponse | { error?: string } | null;
      if (!response.ok || !data || !('ok' in data)) {
        throw new Error((data as { error?: string } | null)?.error || 'Unable to load question.');
      }

      const detail = data.item;
      const metadata = await fetchMetadata(detail.topic.subject.module.license.id, String(detail.topic.subject.module.id), String(detail.topic.subject.id));
      setLicenses(metadata.licenses);
      setModules(metadata.modules);
      setSubjects(metadata.subjects);
      setTopics(metadata.topics);
      setEditingQuestionId(questionId);
      setFormState({
        externalId: detail.externalId,
        licenseId: detail.topic.subject.module.license.id,
        moduleId: String(detail.topic.subject.module.id),
        subjectId: String(detail.topic.subject.id),
        topicId: String(detail.topicId),
        locale: detail.locale,
        status: detail.status,
        difficulty: detail.difficulty === null ? '' : String(detail.difficulty),
        sourceFile: detail.sourceFile ?? '',
        stem: detail.stem,
        tags: detail.tags.join(', '),
        correctOptionKey: (detail.options.find((option) => option.isCorrect)?.optionKey ?? 'A') as 'A' | 'B' | 'C' | 'D',
        options: (['A', 'B', 'C', 'D'] as const).map((key) => ({
          key,
          text: detail.options.find((option) => option.optionKey === key)?.text ?? '',
        })),
        correctExplanation: detail.explanation?.correctExplanation ?? '',
        referenceDocument: detail.references[0]?.document ?? '',
        referenceArea: detail.references[0]?.area ?? '',
        referenceTopicRef: detail.references[0]?.topicRef ?? '',
        referenceLocator: detail.references[0]?.locator ?? '',
        referenceNote: detail.references[0]?.note ?? '',
      });
      setDialogOpen(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load question.');
    }
  }

  async function handleLicenseChange(value: string) {
    const licenseId = value === 'none' ? '' : value;
    setFormState((current) => ({ ...current, licenseId, moduleId: '', subjectId: '', topicId: '' }));
    if (!licenseId) {
      setSubjects([]);
      setTopics([]);
      return;
    }

    const metadata = await fetchMetadata(licenseId);
    setModules(metadata.modules);
    setSubjects([]);
    setTopics([]);
  }

  async function handleModuleChange(value: string) {
    const moduleId = value === 'none' ? '' : value;
    setFormState((current) => ({ ...current, moduleId, subjectId: '', topicId: '' }));
    if (!moduleId) {
      setSubjects([]);
      setTopics([]);
      return;
    }
    const metadata = await fetchMetadata(formState.licenseId, moduleId);
    setSubjects(metadata.subjects);
    setTopics([]);
  }

  async function handleSubjectChange(value: string) {
    const subjectId = value === 'none' ? '' : value;
    setFormState((current) => ({ ...current, subjectId, topicId: '' }));
    if (!subjectId) {
      setTopics([]);
      return;
    }
    const metadata = await fetchMetadata(formState.licenseId, formState.moduleId, subjectId);
    setTopics(metadata.topics);
  }

  async function saveQuestion() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        externalId: formState.externalId,
        topicId: Number(formState.topicId),
        locale: formState.locale,
        status: formState.status,
        difficulty: formState.difficulty || null,
        sourceFile: formState.sourceFile || null,
        stem: formState.stem,
        tags: formState.tags,
        correctOptionKey: formState.correctOptionKey,
        options: formState.options,
        correctExplanation: formState.correctExplanation || null,
        references: [
          {
            document: formState.referenceDocument || null,
            area: formState.referenceArea || null,
            topicRef: formState.referenceTopicRef || null,
            locator: formState.referenceLocator || null,
            note: formState.referenceNote || null,
          },
        ],
      };

      const response = await fetch(editingQuestionId ? `/api/admin/content/${editingQuestionId}` : '/api/admin/content', {
        method: editingQuestionId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to save question.');
      }

      setDialogOpen(false);
      await fetchQuestions();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save question.');
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
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900">Content Management</h1>
          <p className="mt-1 text-[14px] text-slate-500">Normalized questions and editorial metadata used in flashcards and timed tests.</p>
        </div>

        <Button onClick={() => void openCreateDialog()} className="h-10 rounded-xl bg-[#2f55d4] px-4 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(47,85,212,0.18)] hover:bg-[#2448be]">
          <Plus className="mr-2 h-4 w-4" />
          New Question
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-slate-900">Filters</h2>
          <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2f55d4] transition hover:text-[#2448be]"><RotateCcw className="h-3.5 w-3.5" />Reset</button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[12px] font-medium text-slate-600">Search Questions</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={filters.q} onChange={(event) => updateFilter('q', event.target.value)} placeholder="Search by external id, stem, or source file..." className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-[13px]" />
            </div>
          </div>
          <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">License</label><Select value={filters.licenseId} onValueChange={(value) => updateFilter('licenseId', value)}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Licenses</SelectItem>{licenses.map((license) => <SelectItem key={license.id} value={license.id}>{license.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Module</label><Select value={filters.moduleId} onValueChange={(value) => updateFilter('moduleId', value)}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Modules</SelectItem>{modules.filter((module) => filters.licenseId === 'all' || module.licenseId === filters.licenseId).map((module) => <SelectItem key={module.id} value={String(module.id)}>{module.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Subject</label><Select value={filters.subjectId} onValueChange={(value) => updateFilter('subjectId', value)}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Subjects</SelectItem>{subjects.map((subject) => <SelectItem key={subject.id} value={String(subject.id)}>{subject.code} - {subject.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Topic</label><Select value={filters.topicId} onValueChange={(value) => updateFilter('topicId', value)}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Topics</SelectItem>{topics.map((topic) => <SelectItem key={topic.id} value={String(topic.id)}>{topic.code} - {topic.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Locale</label><Select value={filters.locale} onValueChange={(value) => updateFilter('locale', value)}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Locales</SelectItem><SelectItem value="en">EN</SelectItem><SelectItem value="pt">PT</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Status</label><Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><h2 className="text-[22px] font-semibold text-slate-900">Question Bank</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-600">{pagination.total.toLocaleString()} items</span></div>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Question</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Locale</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Module</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Topic</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Updated</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-[0.08em] text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 10 }).map((_, index) => <TableRow key={index}><TableCell colSpan={7} className="py-5 text-sm text-slate-400">Loading questions...</TableCell></TableRow>) : rows.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">No questions found.</TableCell></TableRow> : rows.map((question) => (
                <TableRow key={question.id} className="bg-white hover:bg-slate-50/80">
                  <TableCell>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-900">{question.externalId}</div>
                      <div className="mt-1 text-[12px] text-slate-500">{trimStem(question.stem)}</div>
                    </div>
                  </TableCell>
                  <TableCell><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${localeBadgeClass(question.locale)}`}>{question.locale.toUpperCase()}</span></TableCell>
                  <TableCell><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(question.status)}`}>{question.status[0].toUpperCase() + question.status.slice(1)}</span></TableCell>
                  <TableCell className="text-[13px] text-slate-700">{question.topic.subject.module.name}</TableCell>
                  <TableCell className="text-[13px] text-slate-600">{question.topic.code} - {question.topic.name}</TableCell>
                  <TableCell className="text-[13px] text-slate-500">{new Date(question.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><button type="button" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"><MoreVertical className="h-4 w-4" /></button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-slate-200 bg-white">
                        <DropdownMenuItem onSelect={() => void openEditDialog(question.id)}>Edit question</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-[13px] text-slate-500">Showing {showingFrom}-{showingTo} of {pagination.total.toLocaleString()} questions</div>
          <div className="flex items-center gap-1.5">
            <button type="button" disabled={pagination.page <= 1} onClick={() => updateFilter('page', Math.max(pagination.page - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: Math.min(pagination.totalPages, 3) }).map((_, index) => { const page = index + 1; const isActive = page === pagination.page; return <button key={page} type="button" onClick={() => updateFilter('page', page)} className={['flex h-8 w-8 items-center justify-center rounded-lg border text-[12px] font-semibold transition', isActive ? 'border-[#2f55d4] bg-[#2f55d4] text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'].join(' ')}>{page}</button>; })}
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => updateFilter('page', Math.min(pagination.page + 1, pagination.totalPages))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-slate-900">{editingQuestionId ? 'Edit Question' : 'New Question'}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Create or update the normalized content surfaced by flashcards and test mode.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">External ID</label><Input value={formState.externalId} onChange={(event) => setFormState((current) => ({ ...current, externalId: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Source File</label><Input value={formState.sourceFile} onChange={(event) => setFormState((current) => ({ ...current, sourceFile: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">License</label><Select value={formState.licenseId || 'none'} onValueChange={(value) => void handleLicenseChange(value)}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue placeholder="Select license" /></SelectTrigger><SelectContent><SelectItem value="none">Select license</SelectItem>{licenses.map((license) => <SelectItem key={license.id} value={license.id}>{license.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Module</label><Select value={formState.moduleId || 'none'} onValueChange={(value) => void handleModuleChange(value)}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue placeholder="Select module" /></SelectTrigger><SelectContent><SelectItem value="none">Select module</SelectItem>{filteredModules.map((module) => <SelectItem key={module.id} value={String(module.id)}>{module.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Subject</label><Select value={formState.subjectId || 'none'} onValueChange={(value) => void handleSubjectChange(value)}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue placeholder="Select subject" /></SelectTrigger><SelectContent><SelectItem value="none">Select subject</SelectItem>{filteredSubjects.map((subject) => <SelectItem key={subject.id} value={String(subject.id)}>{subject.code} - {subject.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Topic</label><Select value={formState.topicId || 'none'} onValueChange={(value) => setFormState((current) => ({ ...current, topicId: value === 'none' ? '' : value }))}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue placeholder="Select topic" /></SelectTrigger><SelectContent><SelectItem value="none">Select topic</SelectItem>{filteredTopics.map((topic) => <SelectItem key={topic.id} value={String(topic.id)}>{topic.code} - {topic.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Locale</label><Select value={formState.locale} onValueChange={(value: 'en' | 'pt') => setFormState((current) => ({ ...current, locale: value }))}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">EN</SelectItem><SelectItem value="pt">PT</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Status</label><Select value={formState.status} onValueChange={(value: 'draft' | 'review' | 'published' | 'archived') => setFormState((current) => ({ ...current, status: value }))}><SelectTrigger className="h-11 w-full rounded-xl border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Difficulty</label><Input value={formState.difficulty} onChange={(event) => setFormState((current) => ({ ...current, difficulty: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5 md:col-span-2"><label className="text-[12px] font-medium text-slate-600">Tags</label><Input value={formState.tags} onChange={(event) => setFormState((current) => ({ ...current, tags: event.target.value }))} placeholder="comma, separated, tags" className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5 md:col-span-2"><label className="text-[12px] font-medium text-slate-600">Stem</label><Textarea value={formState.stem} onChange={(event) => setFormState((current) => ({ ...current, stem: event.target.value }))} className="min-h-[120px] rounded-xl border-slate-200" /></div>
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center justify-between"><label className="text-[12px] font-medium text-slate-600">Options</label><Select value={formState.correctOptionKey} onValueChange={(value: 'A' | 'B' | 'C' | 'D') => setFormState((current) => ({ ...current, correctOptionKey: value }))}><SelectTrigger className="h-9 w-[180px] rounded-xl border-slate-200"><SelectValue /></SelectTrigger><SelectContent>{(['A', 'B', 'C', 'D'] as const).map((key) => <SelectItem key={key} value={key}>Correct: {key}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-3 md:grid-cols-2">{formState.options.map((option, index) => <div key={option.key} className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Option {option.key}</label><Input value={option.text} onChange={(event) => setFormState((current) => ({ ...current, options: current.options.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) }))} className="h-11 rounded-xl border-slate-200" /></div>)}</div>
            </div>
            <div className="space-y-1.5 md:col-span-2"><label className="text-[12px] font-medium text-slate-600">Correct Explanation</label><Textarea value={formState.correctExplanation} onChange={(event) => setFormState((current) => ({ ...current, correctExplanation: event.target.value }))} className="min-h-[100px] rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Reference Document</label><Input value={formState.referenceDocument} onChange={(event) => setFormState((current) => ({ ...current, referenceDocument: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Reference Area</label><Input value={formState.referenceArea} onChange={(event) => setFormState((current) => ({ ...current, referenceArea: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Topic Ref</label><Input value={formState.referenceTopicRef} onChange={(event) => setFormState((current) => ({ ...current, referenceTopicRef: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5"><label className="text-[12px] font-medium text-slate-600">Locator</label><Input value={formState.referenceLocator} onChange={(event) => setFormState((current) => ({ ...current, referenceLocator: event.target.value }))} className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-1.5 md:col-span-2"><label className="text-[12px] font-medium text-slate-600">Reference Note</label><Textarea value={formState.referenceNote} onChange={(event) => setFormState((current) => ({ ...current, referenceNote: event.target.value }))} className="min-h-[90px] rounded-xl border-slate-200" /></div>
          </div>
          <DialogFooter className="border-t border-slate-200 px-6 py-4 sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">Cancel</Button>
            <Button onClick={() => void saveQuestion()} disabled={saving || !formState.topicId} className="rounded-xl bg-[#2f55d4] text-white hover:bg-[#2448be]">{saving ? 'Saving...' : editingQuestionId ? 'Save Changes' : 'Create Question'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
