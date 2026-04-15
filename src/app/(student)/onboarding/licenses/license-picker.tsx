'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Info, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

import { saveLicenseSelection } from './actions';

type License = {
  id: string;
  name: string;
  description: string | null;
};

interface LicensePickerProps {
  licenses: License[];
  maxLicenses: number;
  isTrial: boolean;
  isFreeTier?: boolean;
  planName: string;
  currentLicenseIds: string[];
}

const STEPS = ['Plan', 'Certifications', 'Start'] as const;
const CURRENT_STEP = 1;

function StepperDots() {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-xs font-medium',
                i < CURRENT_STEP
                  ? 'bg-primary text-primary-foreground'
                  : i === CURRENT_STEP
                    ? 'border-2 border-primary bg-background text-primary'
                    : 'border border-muted-foreground/30 bg-muted text-muted-foreground',
              )}
            >
              {i < CURRENT_STEP ? (
                <Check className="size-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                'text-xs',
                i === CURRENT_STEP
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                'mb-5 h-px w-8 sm:w-12',
                i < CURRENT_STEP ? 'bg-primary' : 'bg-muted-foreground/30',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function LicensePicker({
  licenses,
  maxLicenses,
  isTrial,
  isFreeTier = false,
  planName,
  currentLicenseIds,
}: LicensePickerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(currentLicenseIds),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleLicense(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxLicenses) {
        next.add(id);
      }
      return next;
    });
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await saveLicenseSelection(Array.from(selected));
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.replace('/app/student');
    });
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl flex-1">
        {/* Stepper */}
        <div className="mb-8">
          <StepperDots />
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Select Your Certifications
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose the certifications you want to study for.
          </p>
        </div>

        {/* Counter chip */}
        <div className="mb-4 flex justify-center">
          <Badge variant="secondary" className="text-sm">
            {selected.size} of {maxLicenses} selected
          </Badge>
        </div>

        {/* Free tier info */}
        {isFreeTier && (
          <Card className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50">
            <CardContent className="flex items-start gap-3 py-3">
              <Info className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Free account
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  You can select 1 certification to explore with limited flashcard access.
                  Upgrade to a paid plan to unlock practice, tests, and more certifications.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trial info */}
        {isTrial && !isFreeTier && (
          <Card className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
            <CardContent className="flex items-start gap-3 py-3">
              <Info className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  7-day Pro trial — {planName}
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  During your trial you can select up to {maxLicenses} certification{maxLicenses !== 1 ? 's' : ''} with full access to all study modes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="mb-4 border-destructive bg-destructive/10">
            <CardContent className="py-3 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {/* License cards */}
        <div className="space-y-3">
          {licenses.map((license) => {
            const isSelected = selected.has(license.id);
            const isDisabled =
              !isSelected && selected.size >= maxLicenses;

            return (
              <Card
                key={license.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  isSelected && 'border-primary bg-primary/5',
                  isDisabled && 'cursor-not-allowed opacity-50',
                )}
                onClick={() => !isDisabled && toggleLicense(license.id)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1">
                    <p className="font-medium">{license.name}</p>
                    {license.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {license.description}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => toggleLicense(license.id)}
                    className="h-6 w-11"
                    onClick={(e) => e.stopPropagation()}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom button */}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t bg-background/80 px-4 py-4 backdrop-blur-md sm:mx-0 sm:border-none sm:bg-transparent sm:py-6 sm:backdrop-blur-none">
        <div className="mx-auto max-w-2xl">
          <Button
            className="h-12 w-full text-base"
            disabled={selected.size === 0 || isPending}
            onClick={handleSubmit}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Start Learning'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
