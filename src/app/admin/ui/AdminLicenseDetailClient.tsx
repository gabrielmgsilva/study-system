'use client';

import Link from 'next/link';
import React from 'react';
import { ChevronRight, FileUp, Layers3, LibraryBig, Network, Pencil, Plus, Trash2 } from 'lucide-react';

import {
  AdminDialogBody,
  AdminDialogContent,
  AdminDialogFooter,
  AdminDialogHeader,
} from '@/components/admin/AdminDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type TopicItem = {
  id: number;
  code: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  questionCount: number;
};

type SubjectItem = {
  id: number;
  code: string;
  name: string;
  shortTitle: string | null;
  subtitle: string | null;
  weight: number;
  displayOrder: number;
  isActive: boolean;
  topicCount: number;
  questionCount: number;
  topics: TopicItem[];
};

type ModuleItem = {
  id: number;
  slug: string;
  moduleKey: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  subjectCount: number;
  topicCount: number;
  questionCount: number;
  subjects: SubjectItem[];
};

type LicenseDetail = {
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
  modules: ModuleItem[];
};

type LicenseDetailResponse = {
  ok: true;
  item: LicenseDetail;
};

type ModuleFormState = {
  name: string;
  slug: string;
  moduleKey: string;
  description: string;
  displayOrder: string;
  isActive: boolean;
};

type SubjectFormState = {
  code: string;
  name: string;
  shortTitle: string;
  subtitle: string;
  weight: string;
  displayOrder: string;
  isActive: boolean;
};

type TopicFormState = {
  code: string;
  name: string;
  displayOrder: string;
  isActive: boolean;
};

type ImportedQuestion = {
  id: string;
  questionType: string;
  stem: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  references?: Array<{ doc?: string; area?: string; topic?: string; locator?: string; note?: string }>;
  explanation?: {
    correct?: string;
    whyOthersAreWrong?: Record<string, string>;
  };
  tcSectionCode: string;
  tcSectionTitle: string;
  tcTopicCode: string;
  tcTopicTitle: string;
  difficulty?: number;
  tags?: string[];
  status?: string;
  version?: number;
};

type ImportFormState = {
  locale: 'en' | 'pt';
  moduleMode: 'selected' | 'new';
  moduleId: string;
  moduleName: string;
  moduleSlug: string;
  fileName: string;
  items: ImportedQuestion[];
};

const EMPTY_MODULE_FORM: ModuleFormState = {
  name: '',
  slug: '',
  moduleKey: '',
  description: '',
  displayOrder: '0',
  isActive: true,
};

const EMPTY_SUBJECT_FORM: SubjectFormState = {
  code: '',
  name: '',
  shortTitle: '',
  subtitle: '',
  weight: '1',
  displayOrder: '0',
  isActive: true,
};

const EMPTY_TOPIC_FORM: TopicFormState = {
  code: '',
  name: '',
  displayOrder: '0',
  isActive: true,
};

const EMPTY_IMPORT_FORM: ImportFormState = {
  locale: 'en',
  moduleMode: 'selected',
  moduleId: '',
  moduleName: '',
  moduleSlug: '',
  fileName: '',
  items: [],
};

function activeBadgeClass(isActive: boolean) {
  return isActive
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-100 text-slate-500';
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatImportPreview(items: ImportedQuestion[]) {
  return items.slice(0, 3).map((item) => item.id).join(', ');
}

export default function AdminLicenseDetailClient({ locale, licenseId }: { locale: LandingLocale; licenseId: string }) {
  const [detail, setDetail] = React.useState<LicenseDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = React.useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<number | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = React.useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = React.useState(false);
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [isImportDragOver, setIsImportDragOver] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [editingModule, setEditingModule] = React.useState<ModuleItem | null>(null);
  const [editingSubject, setEditingSubject] = React.useState<SubjectItem | null>(null);
  const [editingTopic, setEditingTopic] = React.useState<TopicItem | null>(null);

  const [moduleForm, setModuleForm] = React.useState<ModuleFormState>(EMPTY_MODULE_FORM);
  const [subjectForm, setSubjectForm] = React.useState<SubjectFormState>(EMPTY_SUBJECT_FORM);
  const [topicForm, setTopicForm] = React.useState<TopicFormState>(EMPTY_TOPIC_FORM);
  const [importForm, setImportForm] = React.useState<ImportFormState>(EMPTY_IMPORT_FORM);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/licenses/${licenseId}`, { cache: 'no-store' });
        const data = (await response.json().catch(() => null)) as LicenseDetailResponse | { error?: string } | null;

        if (!response.ok || !data || !('ok' in data)) {
          throw new Error((data as { error?: string } | null)?.error || 'Unable to load certification structure.');
        }

        if (cancelled) return;

        setDetail(data.item);
        const nextModule = data.item.modules.find((item) => item.id === selectedModuleId) ?? data.item.modules[0] ?? null;
        const nextSubject = nextModule?.subjects.find((item) => item.id === selectedSubjectId) ?? nextModule?.subjects[0] ?? null;
        setSelectedModuleId(nextModule?.id ?? null);
        setSelectedSubjectId(nextSubject?.id ?? null);
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load certification structure.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [licenseId, refreshKey]);

  const selectedModule = detail?.modules.find((item) => item.id === selectedModuleId) ?? detail?.modules[0] ?? null;
  const selectedSubject = selectedModule?.subjects.find((item) => item.id === selectedSubjectId) ?? selectedModule?.subjects[0] ?? null;

  function requestRefresh() {
    setRefreshKey((current) => current + 1);
  }

  function openCreateModule() {
    setEditingModule(null);
    setModuleForm(EMPTY_MODULE_FORM);
    setModuleDialogOpen(true);
  }

  function openEditModule(module: ModuleItem) {
    setEditingModule(module);
    setModuleForm({
      name: module.name,
      slug: module.slug,
      moduleKey: module.moduleKey,
      description: module.description ?? '',
      displayOrder: String(module.displayOrder),
      isActive: module.isActive,
    });
    setModuleDialogOpen(true);
  }

  function openCreateSubject() {
    if (!selectedModule) return;
    setEditingSubject(null);
    setSubjectForm(EMPTY_SUBJECT_FORM);
    setSubjectDialogOpen(true);
  }

  function openEditSubject(subject: SubjectItem) {
    setEditingSubject(subject);
    setSubjectForm({
      code: subject.code,
      name: subject.name,
      shortTitle: subject.shortTitle ?? '',
      subtitle: subject.subtitle ?? '',
      weight: String(subject.weight),
      displayOrder: String(subject.displayOrder),
      isActive: subject.isActive,
    });
    setSubjectDialogOpen(true);
  }

  function openCreateTopic() {
    if (!selectedSubject) return;
    setEditingTopic(null);
    setTopicForm(EMPTY_TOPIC_FORM);
    setTopicDialogOpen(true);
  }

  function openEditTopic(topic: TopicItem) {
    setEditingTopic(topic);
    setTopicForm({
      code: topic.code,
      name: topic.name,
      displayOrder: String(topic.displayOrder),
      isActive: topic.isActive,
    });
    setTopicDialogOpen(true);
  }

  function openImportDialog() {
    setImportForm({
      ...EMPTY_IMPORT_FORM,
      moduleMode: selectedModule ? 'selected' : 'new',
      moduleId: selectedModule ? String(selectedModule.id) : '',
      moduleName: selectedModule?.name ?? '',
      moduleSlug: selectedModule?.slug ?? '',
    });
    setIsImportDragOver(false);
    setImportDialogOpen(true);
  }

  async function saveModule() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        licenseId,
        name: moduleForm.name.trim(),
        slug: normalizeSlug(moduleForm.slug || moduleForm.name),
        moduleKey: moduleForm.moduleKey.trim(),
        description: moduleForm.description.trim(),
        displayOrder: moduleForm.displayOrder.trim(),
        isActive: moduleForm.isActive,
      };

      const response = await fetch(editingModule ? `/api/admin/modules/${editingModule.id}` : '/api/admin/modules', {
        method: editingModule ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; item?: { id: number } } | null;
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to save module.');
      }

      setModuleDialogOpen(false);
      setEditingModule(null);
      if (data.item?.id) setSelectedModuleId(data.item.id);
      requestRefresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save module.');
    } finally {
      setSaving(false);
    }
  }

  async function saveSubject() {
    if (!selectedModule) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        moduleId: selectedModule.id,
        code: subjectForm.code.trim(),
        name: subjectForm.name.trim(),
        shortTitle: subjectForm.shortTitle.trim(),
        subtitle: subjectForm.subtitle.trim(),
        weight: subjectForm.weight.trim(),
        displayOrder: subjectForm.displayOrder.trim(),
        isActive: subjectForm.isActive,
      };

      const response = await fetch(editingSubject ? `/api/admin/subjects/${editingSubject.id}` : '/api/admin/subjects', {
        method: editingSubject ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; item?: { id: number } } | null;
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to save subject.');
      }

      setSubjectDialogOpen(false);
      setEditingSubject(null);
      if (data.item?.id) setSelectedSubjectId(data.item.id);
      requestRefresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save subject.');
    } finally {
      setSaving(false);
    }
  }

  async function saveTopic() {
    if (!selectedSubject) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        subjectId: selectedSubject.id,
        code: topicForm.code.trim(),
        name: topicForm.name.trim(),
        displayOrder: topicForm.displayOrder.trim(),
        isActive: topicForm.isActive,
      };

      const response = await fetch(editingTopic ? `/api/admin/topics/${editingTopic.id}` : '/api/admin/topics', {
        method: editingTopic ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to save topic.');
      }

      setTopicDialogOpen(false);
      setEditingTopic(null);
      requestRefresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save topic.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntity(url: string, label: string) {
    if (!window.confirm(`Delete ${label}?`)) return;
    setError(null);

    try {
      const response = await fetch(url, { method: 'DELETE' });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || `Unable to delete ${label}.`);
      }
      requestRefresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : `Unable to delete ${label}.`);
    }
  }

  async function processImportFile(file: File) {
    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error('The uploaded file must contain an array of questions.');
      }

      setImportForm((current) => ({
        ...current,
        fileName: file.name,
        items: parsed as ImportedQuestion[],
      }));
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to parse JSON file.');
    }
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await processImportFile(file);
    } finally {
      event.target.value = '';
    }
  }

  function handleImportDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsImportDragOver(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    void processImportFile(file);
  }

  async function runImport() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        licenseId,
        locale: importForm.locale,
        moduleId: importForm.moduleMode === 'selected' ? Number(importForm.moduleId) : null,
        moduleName: importForm.moduleMode === 'new' ? importForm.moduleName.trim() : null,
        moduleSlug: importForm.moduleMode === 'new' ? normalizeSlug(importForm.moduleSlug || importForm.moduleName) : null,
        items: importForm.items,
      };

      const response = await fetch('/api/admin/content/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; summary?: { created: number; updated: number; skipped: number; errors: string[] } } | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to import questions.');
      }

      setImportDialogOpen(false);
      requestRefresh();
      window.alert(`Import finished. Created: ${data.summary?.created ?? 0}, Updated: ${data.summary?.updated ?? 0}, Skipped: ${data.summary?.skipped ?? 0}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to import questions.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href={localizeAppHref(ROUTES.adminContent, locale)} className="font-medium text-[#2f55d4] hover:text-[#2448be]">
            Content
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>{detail?.name ?? licenseId.toUpperCase()}</span>
        </div>

        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{detail?.name ?? 'Certification'}</h1>
              {detail ? (
                <Badge variant="outline" className={activeBadgeClass(detail.isActive)}>
                  {detail.isActive ? 'Active' : 'Inactive'}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm leading-6 text-slate-500">
              {detail?.description?.trim() || 'Manage modules, subjects, topics and import JSON content for this certification.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={openCreateModule}>
              <Plus className="mr-2 h-4 w-4" />
              New module
            </Button>
            <Button type="button" className="rounded-xl bg-[#2f55d4] hover:bg-[#2448be]" onClick={openImportDialog}>
              <FileUp className="mr-2 h-4 w-4" />
              Import JSON
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 px-4 py-3"><div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Modules</div><div className="mt-2 text-xl font-semibold text-slate-900">{detail?.moduleCount ?? 0}</div></div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3"><div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Subjects</div><div className="mt-2 text-xl font-semibold text-slate-900">{detail?.subjectCount ?? 0}</div></div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3"><div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Topics</div><div className="mt-2 text-xl font-semibold text-slate-900">{detail?.topicCount ?? 0}</div></div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3"><div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Questions</div><div className="mt-2 text-xl font-semibold text-slate-900">{detail?.questionCount ?? 0}</div></div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="rounded-[24px] border-slate-200 py-0 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="border-b border-slate-100 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900"><Layers3 className="h-4 w-4 text-[#2f55d4]" />Modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 py-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)
              : detail?.modules.map((module) => {
                  const isSelected = module.id === selectedModule?.id;

                  return (
                    <div key={module.id} className={['rounded-2xl border p-4 transition', isSelected ? 'border-[#2f55d4] bg-[#eef3ff] shadow-[0_12px_24px_rgba(47,85,212,0.12)]' : 'border-slate-200 bg-white'].join(' ')}>
                      <button type="button" onClick={() => { setSelectedModuleId(module.id); setSelectedSubjectId(module.subjects[0]?.id ?? null); }} className="w-full text-left">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{module.name}</div>
                            <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">{module.slug}</div>
                          </div>
                          <Badge variant="outline" className={activeBadgeClass(module.isActive)}>{module.isActive ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500"><div>{module.subjectCount} subjects</div><div>{module.topicCount} topics</div><div>{module.questionCount} questions</div></div>
                      </button>
                      <div className="mt-3 flex items-center gap-2"><Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => openEditModule(module)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit</Button><Button type="button" variant="outline" size="sm" className="rounded-xl text-red-600" onClick={() => void deleteEntity(`/api/admin/modules/${module.id}`, `module ${module.name}`)}><Trash2 className="mr-2 h-3.5 w-3.5" />Delete</Button></div>
                    </div>
                  );
                })}
            {!loading && !detail?.modules.length ? <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">No modules exist for this certification yet.</div> : null}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-slate-200 py-0 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base text-slate-900"><LibraryBig className="h-4 w-4 text-[#2f55d4]" />Subjects</CardTitle>
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={openCreateSubject} disabled={!selectedModule}><Plus className="mr-2 h-3.5 w-3.5" />New subject</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 py-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)
              : selectedModule?.subjects.map((subject) => {
                  const isSelected = subject.id === selectedSubject?.id;

                  return (
                    <div key={subject.id} className={['rounded-2xl border p-4 transition', isSelected ? 'border-[#2f55d4] bg-[#eef3ff] shadow-[0_12px_24px_rgba(47,85,212,0.12)]' : 'border-slate-200 bg-white'].join(' ')}>
                      <button type="button" onClick={() => setSelectedSubjectId(subject.id)} className="w-full text-left">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{subject.code} · {subject.name}</div>
                            {subject.subtitle ? <div className="mt-1 text-xs text-slate-500">{subject.subtitle}</div> : null}
                          </div>
                          <Badge variant="outline" className={activeBadgeClass(subject.isActive)}>{subject.isActive ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500"><span>{subject.topicCount} topics</span><span>{subject.questionCount} questions</span><span>weight {subject.weight}</span></div>
                      </button>
                      <div className="mt-3 flex items-center gap-2"><Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => openEditSubject(subject)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit</Button><Button type="button" variant="outline" size="sm" className="rounded-xl text-red-600" onClick={() => void deleteEntity(`/api/admin/subjects/${subject.id}`, `subject ${subject.name}`)}><Trash2 className="mr-2 h-3.5 w-3.5" />Delete</Button></div>
                    </div>
                  );
                })}
            {!loading && !selectedModule?.subjects.length ? <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">Select or create a module to continue.</div> : null}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-slate-200 py-0 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base text-slate-900"><Network className="h-4 w-4 text-[#2f55d4]" />Topics</CardTitle>
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={openCreateTopic} disabled={!selectedSubject}><Plus className="mr-2 h-3.5 w-3.5" />New topic</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 py-4">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)
              : selectedSubject?.topics.map((topic) => (
                  <div key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{topic.code} · {topic.name}</div>
                        <div className="mt-2 text-xs text-slate-500">{topic.questionCount} questions linked to this topic</div>
                      </div>
                      <Badge variant="outline" className={activeBadgeClass(topic.isActive)}>{topic.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => openEditTopic(topic)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit</Button><Button type="button" variant="outline" size="sm" className="rounded-xl text-red-600" onClick={() => void deleteEntity(`/api/admin/topics/${topic.id}`, `topic ${topic.name}`)}><Trash2 className="mr-2 h-3.5 w-3.5" />Delete</Button><Button asChild size="sm" className="rounded-xl bg-[#2f55d4] hover:bg-[#2448be]"><Link href={localizeAppHref(ROUTES.adminContentTopic(licenseId, String(topic.id)), locale)}>Manage questions</Link></Button></div>
                  </div>
                ))}
            {!loading && !selectedSubject?.topics.length ? <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">Select or create a subject to continue.</div> : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <AdminDialogContent size="form"><AdminDialogHeader><DialogTitle>{editingModule ? 'Edit module' : 'Create module'}</DialogTitle><DialogDescription>Modules group subjects inside this certification.</DialogDescription></AdminDialogHeader><AdminDialogBody className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Name</label><Input value={moduleForm.name} onChange={(event) => setModuleForm((current) => ({ ...current, name: event.target.value, slug: editingModule ? current.slug : normalizeSlug(event.target.value) }))} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Slug</label><Input value={moduleForm.slug} onChange={(event) => setModuleForm((current) => ({ ...current, slug: normalizeSlug(event.target.value) }))} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Module key</label><Input value={moduleForm.moduleKey} onChange={(event) => setModuleForm((current) => ({ ...current, moduleKey: event.target.value }))} placeholder={`${licenseId}.module-slug`} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Display order</label><Input value={moduleForm.displayOrder} onChange={(event) => setModuleForm((current) => ({ ...current, displayOrder: event.target.value }))} inputMode="numeric" /></div></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Description</label><Textarea value={moduleForm.description} onChange={(event) => setModuleForm((current) => ({ ...current, description: event.target.value }))} className="min-h-[110px]" /></div><div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"><div><div className="text-sm font-medium text-slate-700">Active</div><div className="text-xs text-slate-500">Inactive modules remain visible for curation, but can be hidden downstream.</div></div><Switch checked={moduleForm.isActive} onCheckedChange={(checked) => setModuleForm((current) => ({ ...current, isActive: checked }))} /></div></AdminDialogBody><AdminDialogFooter><Button type="button" variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancel</Button><Button type="button" onClick={() => void saveModule()} disabled={saving} className="bg-[#2f55d4] hover:bg-[#2448be]">{saving ? 'Saving...' : editingModule ? 'Save changes' : 'Create module'}</Button></AdminDialogFooter></AdminDialogContent>
      </Dialog>

      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <AdminDialogContent size="formWide"><AdminDialogHeader><DialogTitle>{editingSubject ? 'Edit subject' : 'Create subject'}</DialogTitle><DialogDescription>Subjects organize topics inside the selected module.</DialogDescription></AdminDialogHeader><AdminDialogBody className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Code</label><Input value={subjectForm.code} onChange={(event) => setSubjectForm((current) => ({ ...current, code: event.target.value }))} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Name</label><Input value={subjectForm.name} onChange={(event) => setSubjectForm((current) => ({ ...current, name: event.target.value }))} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Short title</label><Input value={subjectForm.shortTitle} onChange={(event) => setSubjectForm((current) => ({ ...current, shortTitle: event.target.value }))} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Weight</label><Input value={subjectForm.weight} onChange={(event) => setSubjectForm((current) => ({ ...current, weight: event.target.value }))} inputMode="numeric" /></div><div className="space-y-2 sm:col-span-2"><label className="text-sm font-medium text-slate-700">Subtitle</label><Input value={subjectForm.subtitle} onChange={(event) => setSubjectForm((current) => ({ ...current, subtitle: event.target.value }))} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Display order</label><Input value={subjectForm.displayOrder} onChange={(event) => setSubjectForm((current) => ({ ...current, displayOrder: event.target.value }))} inputMode="numeric" /></div><div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2"><div><div className="text-sm font-medium text-slate-700">Active</div><div className="text-xs text-slate-500">Inactive subjects stay available for editorial maintenance.</div></div><Switch checked={subjectForm.isActive} onCheckedChange={(checked) => setSubjectForm((current) => ({ ...current, isActive: checked }))} /></div></AdminDialogBody><AdminDialogFooter><Button type="button" variant="outline" onClick={() => setSubjectDialogOpen(false)}>Cancel</Button><Button type="button" onClick={() => void saveSubject()} disabled={saving} className="bg-[#2f55d4] hover:bg-[#2448be]">{saving ? 'Saving...' : editingSubject ? 'Save changes' : 'Create subject'}</Button></AdminDialogFooter></AdminDialogContent>
      </Dialog>

      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <AdminDialogContent size="form"><AdminDialogHeader><DialogTitle>{editingTopic ? 'Edit topic' : 'Create topic'}</DialogTitle><DialogDescription>Topics are the leaf nodes used by the question manager.</DialogDescription></AdminDialogHeader><AdminDialogBody className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Code</label><Input value={topicForm.code} onChange={(event) => setTopicForm((current) => ({ ...current, code: event.target.value }))} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Name</label><Input value={topicForm.name} onChange={(event) => setTopicForm((current) => ({ ...current, name: event.target.value }))} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Display order</label><Input value={topicForm.displayOrder} onChange={(event) => setTopicForm((current) => ({ ...current, displayOrder: event.target.value }))} inputMode="numeric" /></div><div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2"><div><div className="text-sm font-medium text-slate-700">Active</div><div className="text-xs text-slate-500">Inactive topics cannot receive new curated content by default.</div></div><Switch checked={topicForm.isActive} onCheckedChange={(checked) => setTopicForm((current) => ({ ...current, isActive: checked }))} /></div></AdminDialogBody><AdminDialogFooter><Button type="button" variant="outline" onClick={() => setTopicDialogOpen(false)}>Cancel</Button><Button type="button" onClick={() => void saveTopic()} disabled={saving} className="bg-[#2f55d4] hover:bg-[#2448be]">{saving ? 'Saving...' : editingTopic ? 'Save changes' : 'Create topic'}</Button></AdminDialogFooter></AdminDialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) {
          setIsImportDragOver(false);
        }
      }}>
        <AdminDialogContent size="formWider"><AdminDialogHeader><DialogTitle>Import questions from JSON</DialogTitle><DialogDescription>Upload a file following the structure of the attached examples and bind it to the selected module or a new module.</DialogDescription></AdminDialogHeader><AdminDialogBody className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Locale</label><Select value={importForm.locale} onValueChange={(value: 'en' | 'pt') => setImportForm((current) => ({ ...current, locale: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">EN</SelectItem><SelectItem value="pt">PT</SelectItem></SelectContent></Select></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Module target</label><Select value={importForm.moduleMode} onValueChange={(value: 'selected' | 'new') => setImportForm((current) => ({ ...current, moduleMode: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="selected">Use existing module</SelectItem><SelectItem value="new">Create module during import</SelectItem></SelectContent></Select></div></div>{importForm.moduleMode === 'selected' ? (<div className="space-y-2"><label className="text-sm font-medium text-slate-700">Module</label><Select value={importForm.moduleId} onValueChange={(value) => setImportForm((current) => ({ ...current, moduleId: value }))}><SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger><SelectContent>{detail?.modules.map((module) => <SelectItem key={module.id} value={String(module.id)}>{module.name}</SelectItem>)}</SelectContent></Select></div>) : (<div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">New module name</label><Input value={importForm.moduleName} onChange={(event) => setImportForm((current) => ({ ...current, moduleName: event.target.value, moduleSlug: normalizeSlug(event.target.value) }))} /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">New module slug</label><Input value={importForm.moduleSlug} onChange={(event) => setImportForm((current) => ({ ...current, moduleSlug: normalizeSlug(event.target.value) }))} /></div></div>)}<div className={`rounded-2xl border border-dashed px-4 py-5 text-sm transition-colors ${isImportDragOver ? 'border-[#2f55d4] bg-[#eef3ff] text-[#2448be]' : 'border-slate-300 bg-slate-50 text-slate-600'}`} onClick={() => fileInputRef.current?.click()} onDragEnter={(event) => {
          event.preventDefault();
          setIsImportDragOver(true);
        }} onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          setIsImportDragOver(true);
        }} onDragLeave={() => setIsImportDragOver(false)} onDrop={handleImportDrop} onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }} role="button" tabIndex={0}><div className="flex flex-wrap items-center justify-between gap-3"><div className="space-y-1"><div className="font-medium text-slate-800">JSON file</div><div className="text-xs text-slate-500">{importForm.fileName || 'Drop a JSON file here or select one manually.'}</div></div><Button type="button" variant="outline" className="rounded-xl" onClick={(event) => {
          event.stopPropagation();
          fileInputRef.current?.click();
        }}>Select file</Button></div><input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void handleImportFile(event)} />{importForm.items.length > 0 ? (<div className="mt-4 rounded-2xl bg-white p-4 text-xs text-slate-600"><div><span className="font-semibold text-slate-800">Questions detected:</span> {importForm.items.length}</div><div className="mt-1"><span className="font-semibold text-slate-800">Preview:</span> {formatImportPreview(importForm.items)}</div></div>) : (<div className="mt-4 flex items-center gap-2 text-xs"><FileUp className="h-4 w-4" /><span>{isImportDragOver ? 'Release to load the file.' : 'Drag and drop a .json file here.'}</span></div>)}</div></AdminDialogBody><AdminDialogFooter><Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button><Button type="button" onClick={() => void runImport()} disabled={saving || importForm.items.length === 0 || (importForm.moduleMode === 'selected' ? !importForm.moduleId : !importForm.moduleName || !importForm.moduleSlug)} className="bg-[#2f55d4] hover:bg-[#2448be]">{saving ? 'Importing...' : 'Run import'}</Button></AdminDialogFooter></AdminDialogContent>
      </Dialog>
    </div>
  );
}