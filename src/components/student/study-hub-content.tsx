'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type License = { id: string; name: string };
type Module = { id: number; moduleKey: string; name: string; licenseId: string };
type ProgressRow = {
  moduleKey: string;
  mode: string;
  questionsTotal: number;
  questionsCorrect: number;
};

interface StudyHubContentProps {
  licenses: License[];
  modules: Module[];
  progress: ProgressRow[];
  entitlements: Record<
    string,
    {
      flashcardsRemaining: number | null;
      practiceRemaining: number | null;
      testsRemaining: number | null;
    }
  >;
}

const modes = [
  { key: 'flashcard', path: 'flashcard', label: 'Cards', icon: BookOpen },
  { key: 'practice', path: 'practice', label: 'Practice', icon: GraduationCap },
  { key: 'test', path: 'test', label: 'Test', icon: FileCheck },
] as const;

export function StudyHubContent({
  licenses,
  modules,
  progress,
  entitlements,
}: StudyHubContentProps) {
  const [activeLicense, setActiveLicense] = useState(licenses[0]?.id ?? '');

  const filteredModules = modules.filter((m) => m.licenseId === activeLicense);

  function getModuleProgress(moduleKey: string) {
    const rows = progress.filter((p) => p.moduleKey === moduleKey);
    const total = rows.reduce((s, r) => s + r.questionsTotal, 0);
    const correct = rows.reduce((s, r) => s + r.questionsCorrect, 0);
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }

  function getRemaining(
    licenseId: string,
    mode: 'flashcard' | 'practice' | 'test',
  ): string {
    const ent = entitlements[licenseId];
    if (!ent) return '0';
    const val =
      mode === 'flashcard'
        ? ent.flashcardsRemaining
        : mode === 'practice'
          ? ent.practiceRemaining
          : ent.testsRemaining;
    return val === null ? '∞' : String(val);
  }

  return (
    <>
      {licenses.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {licenses.map((lic) => (
            <button
              key={lic.id}
              onClick={() => setActiveLicense(lic.id)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                'min-h-[44px]',
                activeLicense === lic.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {lic.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filteredModules.map((mod) => {
          const pct = getModuleProgress(mod.moduleKey);
          return (
            <Card key={mod.moduleKey}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{mod.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-2">
                  {modes.map((mode) => {
                    const remaining = getRemaining(activeLicense, mode.key);
                    const Icon = mode.icon;
                    return (
                      <Link
                        key={mode.key}
                        href={`/study/${activeLicense}/${mode.path}?module=${mod.moduleKey}`}
                        className={cn(
                          'flex h-[44px] items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors',
                          'active:bg-muted',
                          remaining === '0'
                            ? 'pointer-events-none opacity-40'
                            : 'hover:bg-muted/50',
                        )}
                      >
                        <Icon className="size-4" />
                        {mode.label}
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-2 text-center">
                  {modes.map((mode) => (
                    <span
                      key={mode.key}
                      className="text-xs text-muted-foreground"
                    >
                      {getRemaining(activeLicense, mode.key)} left
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredModules.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            No modules available for this license.
          </p>
        )}
      </div>
    </>
  );
}
