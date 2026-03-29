'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, Plane, Target } from 'lucide-react';
import { Sora } from 'next/font/google';

import { clearStudentCache } from '@/lib/entitlementsClient';
import {
  onboardingLicenseOptions,
  onboardingStudyGoals,
  onboardingStudyLevels,
  type OnboardingStudyGoal,
  type OnboardingStudyLevel,
} from '@/lib/onboarding';
import type { LicenseId } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type OnboardingPageProps = {
  userName: string;
  initialLicenseId?: LicenseId | null;
  initialSelectedLicenses?: LicenseId[];
  initialStudyLevel?: OnboardingStudyLevel | null;
  initialStudyGoal?: OnboardingStudyGoal | null;
  maxSelectableLicenses: number;
};

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const surfaceCard = 'rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]';
const outlineBtn = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
const primaryBtn = 'bg-[#2d4bb3] text-white hover:bg-[#243d99]';
const finishBtn = 'bg-[#ff6d3a] text-white hover:bg-[#f2612e]';

function dedupeLicenses(values: Array<LicenseId | null | undefined>) {
  const seen = new Set<LicenseId>();
  const unique: LicenseId[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }

  return unique;
}

function countSelectedCertifications(values: LicenseId[]) {
  return values.filter((value) => value !== 'regs').length;
}

function StepBlock({
  active,
  done,
  index,
  title,
  description,
}: {
  active: boolean;
  done: boolean;
  index: number;
  title: string;
  description: string;
}) {
  return (
    <div
      className={[
        'flex items-start gap-3 rounded-[18px] border px-4 py-4 transition',
        active || done
          ? 'border-[#c9d4f4] bg-[#f5f8ff] text-slate-900'
          : 'border-slate-200 bg-white text-slate-600',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
          done || active
            ? 'border-[#2d4bb3] bg-[#2d4bb3] text-white'
            : 'border-slate-200 bg-slate-50 text-slate-600',
        ].join(' ')}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : index}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function OnboardingPage({
  userName,
  initialLicenseId,
  initialSelectedLicenses,
  initialStudyLevel,
  initialStudyGoal,
  maxSelectableLicenses,
}: OnboardingPageProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialLicenseId ? 2 : 1);
  const [selectedLicenses, setSelectedLicenses] = useState<LicenseId[]>(() =>
    dedupeLicenses(['regs', ...(initialSelectedLicenses ?? []), initialLicenseId ?? undefined]),
  );
  const [primaryLicenseId, setPrimaryLicenseId] = useState<LicenseId | ''>(initialLicenseId ?? '');
  const [studyLevel, setStudyLevel] = useState<OnboardingStudyLevel | ''>(initialStudyLevel ?? '');
  const [studyGoal, setStudyGoal] = useState<OnboardingStudyGoal | ''>(initialStudyGoal ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedCertificationCount = countSelectedCertifications(selectedLicenses);

  function setPrimaryFocus(licenseId: LicenseId) {
    if (!selectedLicenses.includes(licenseId)) {
      setSelectedLicenses((current) => dedupeLicenses([...current, licenseId]));
    }

    setPrimaryLicenseId(licenseId);
    setError(null);
  }

  function toggleLicense(licenseId: LicenseId) {
    if (licenseId === 'regs') {
      setPrimaryFocus('regs');
      return;
    }

    const isSelected = selectedLicenses.includes(licenseId);

    if (isSelected) {
      const nextSelected = selectedLicenses.filter((current) => current !== licenseId);
      setSelectedLicenses(nextSelected);

      if (primaryLicenseId === licenseId) {
        setPrimaryLicenseId(nextSelected.find((current) => current !== 'regs') ?? 'regs');
      }

      setError(null);
      return;
    }

    if (selectedCertificationCount >= maxSelectableLicenses) {
      setError(
        maxSelectableLicenses > 0
          ? `Your plan allows up to ${maxSelectableLicenses} certifications at this step.`
          : 'Your current plan does not unlock extra certifications yet.',
      );
      return;
    }

    const nextSelected = dedupeLicenses([...selectedLicenses, licenseId]);
    setSelectedLicenses(nextSelected);

    if (!primaryLicenseId || primaryLicenseId === 'regs') {
      setPrimaryLicenseId(licenseId);
    }

    setError(null);
  }

  async function finishOnboarding() {
    if (!primaryLicenseId) {
      setError('Choose the certification you want the platform to prioritize first.');
      setStep(1);
      return;
    }

    if (!studyLevel) {
      setError('Choose your current study level.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch('/api/me/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primaryLicenseId,
        selectedLicenses,
        studyLevel,
        studyGoal: studyGoal || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? 'Unable to save your onboarding preferences.');
      return;
    }

    const data = await res.json().catch(() => ({}));
    clearStudentCache();
    router.push(data?.redirectTo ?? '/app');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-[980px]">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d4bb3] text-white shadow-[0_12px_25px_rgba(45,75,179,0.22)]">
            <Plane className="h-5 w-5" />
          </div>
          <h1 className={`${sora.className} mt-5 text-4xl font-semibold tracking-tight text-slate-900`}>
            AME Canada Study Pro
          </h1>
          <p className="mt-2 text-base text-slate-500">Transport Canada AME Certification Platform</p>
        </div>

        <div className="grid w-full gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className={surfaceCard}>
          <CardHeader className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <span>Onboarding</span>
              <span className="text-slate-300">•</span>
              <span>{step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}</span>
            </div>

            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#2d4bb3]">
              <Compass className="h-5 w-5" />
            </div>

            <div className="space-y-2">
              <CardTitle className={`${sora.className} text-2xl text-slate-900 md:text-3xl`}>
                Welcome, {userName}.
              </CardTitle>
              <CardDescription className="max-w-md text-sm leading-6 text-slate-500">
                Two short steps and we will configure your first study paths right away. The certifications you pick here become available in the logged-in area as soon as onboarding finishes.
              </CardDescription>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <p className="font-semibold text-slate-900">Recommended flow</p>
              <p className="mt-2">1. Select the certifications you want to activate now.</p>
              <p>2. Tell us your current level and, if useful, your main goal.</p>
              <p>3. We enroll the selected certifications automatically. REGS stays included and does not consume a certification slot.</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <StepBlock
              index={1}
              active={step === 1}
              done={step === 2 && !!primaryLicenseId}
              title="Certifications"
              description="Choose one or more certifications and define which one should lead the experience first."
            />
            <StepBlock
              index={2}
              active={step === 2}
              done={!!studyLevel}
              title="Level and goal"
              description="Tune the first recommendations, pacing, and practice intensity."
            />

            <div className="rounded-[18px] border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">What this affects</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">App home</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Shortcuts and suggested study routes can be prioritized by your primary certification.</p>
                </div>
                <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Study guidance</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Selected certifications are enrolled automatically and appear in the sidebar right after onboarding.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={surfaceCard}>
          <CardHeader className="space-y-2">
            <CardTitle className={`${sora.className} text-2xl text-slate-900`}>
              {step === 1 ? 'Choose your certifications' : 'Set your current study profile'}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-500">
              {step === 1
                ? 'Select the certifications you want active now. REGS is already included, and your primary choice becomes the first path we emphasize.'
                : 'Keep it practical. These choices are used to shape recommendations, not lock the account.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-slate-900">
                      {maxSelectableLicenses > 0
                        ? `${selectedCertificationCount} / ${maxSelectableLicenses} certifications selected`
                        : 'REGS is included with your account'}
                    </p>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      {primaryLicenseId ? `Primary: ${primaryLicenseId.toUpperCase()}` : 'Choose a primary focus'}
                    </p>
                  </div>
                  <p className="mt-2 leading-6">
                    REGS is always available and does not consume a certification slot. Add the paid certifications you want in the sidebar immediately after onboarding.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                {onboardingLicenseOptions.map((option) => {
                  const isSelected = selectedLicenses.includes(option.value);
                  const isPrimary = primaryLicenseId === option.value;
                  const isIncluded = option.value === 'regs';
                  const limitReached =
                    !isSelected && !isIncluded && selectedCertificationCount >= maxSelectableLicenses;

                  return (
                    <div
                      key={option.value}
                      className={[
                        'rounded-[18px] border p-4 transition',
                        isSelected
                          ? 'border-[#c9d4f4] bg-[#f5f8ff] text-slate-900 shadow-[0_16px_35px_rgba(45,75,179,0.10)]'
                          : 'border-slate-200 bg-white text-slate-900',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => toggleLicense(option.value)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold">{option.title}</p>
                            {isIncluded ? (
                              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2d4bb3] ring-1 ring-[#c9d4f4]">
                                Included
                              </span>
                            ) : null}
                            {isPrimary ? (
                              <span className="rounded-full bg-[#2d4bb3] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                                Focus
                              </span>
                            ) : null}
                          </div>
                          <p className={isSelected ? 'mt-2 text-sm leading-6 text-slate-600' : 'mt-2 text-sm leading-6 text-slate-500'}>
                            {option.description}
                          </p>
                        </button>
                        {isSelected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2d4bb3]" /> : null}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {isSelected && !isPrimary ? (
                          <Button
                            type="button"
                            variant="outline"
                            className={outlineBtn}
                            onClick={() => setPrimaryFocus(option.value)}
                          >
                            Make primary
                          </Button>
                        ) : null}

                        {isIncluded ? (
                          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                            Always active
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant={isSelected ? 'outline' : 'default'}
                            className={isSelected ? outlineBtn : primaryBtn}
                            onClick={() => toggleLicense(option.value)}
                            disabled={limitReached}
                          >
                            {isSelected ? 'Remove' : 'Add certification'}
                          </Button>
                        )}

                        {limitReached ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                            Plan limit reached
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Current level</Label>
                  <RadioGroup
                    value={studyLevel}
                    onValueChange={(value) => {
                      setStudyLevel(value as OnboardingStudyLevel);
                      setError(null);
                    }}
                    className="mt-3 gap-3"
                  >
                    {onboardingStudyLevels.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-start gap-3 rounded-[18px] border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <RadioGroupItem value={option.value} className="mt-1" />
                        <div>
                          <p className="font-semibold text-slate-900">{option.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700">Main goal (optional)</Label>
                  <RadioGroup
                    value={studyGoal}
                    onValueChange={(value) => setStudyGoal(value as OnboardingStudyGoal)}
                    className="mt-3 gap-3"
                  >
                    {onboardingStudyGoals.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-start gap-3 rounded-[18px] border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <RadioGroupItem value={option.value} className="mt-1" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{option.title}</p>
                            <Target className="h-4 w-4 text-slate-400" />
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>

                  <button
                    type="button"
                    onClick={() => setStudyGoal('')}
                    className="mt-3 text-sm font-medium text-[#2d4bb3] hover:text-[#22398a]"
                  >
                    Skip goal for now
                  </button>
                </div>
              </div>
            )}

            {error ? (
              <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              {step === 2 ? (
                <Button
                  type="button"
                  variant="outline"
                  className={outlineBtn}
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step === 1 ? (
                <Button
                  type="button"
                  className={primaryBtn}
                  onClick={() => {
                    if (!primaryLicenseId) {
                      setError('Choose the certification you want the platform to prioritize first.');
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  className={finishBtn}
                  onClick={finishOnboarding}
                  disabled={loading}
                >
                  {loading ? 'Saving your setup...' : 'Finish onboarding'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}