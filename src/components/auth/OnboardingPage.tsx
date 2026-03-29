'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, Plane, Target } from 'lucide-react';
import { Sora } from 'next/font/google';

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
  initialStudyLevel?: OnboardingStudyLevel | null;
  initialStudyGoal?: OnboardingStudyGoal | null;
};

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const surfaceCard = 'rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]';
const outlineBtn = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
const primaryBtn = 'bg-[#2d4bb3] text-white hover:bg-[#243d99]';
const finishBtn = 'bg-[#ff6d3a] text-white hover:bg-[#f2612e]';

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
  initialStudyLevel,
  initialStudyGoal,
}: OnboardingPageProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialLicenseId ? 2 : 1);
  const [primaryLicenseId, setPrimaryLicenseId] = useState<LicenseId | ''>(initialLicenseId ?? '');
  const [studyLevel, setStudyLevel] = useState<OnboardingStudyLevel | ''>(initialStudyLevel ?? '');
  const [studyGoal, setStudyGoal] = useState<OnboardingStudyGoal | ''>(initialStudyGoal ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function finishOnboarding() {
    if (!primaryLicenseId) {
      setError('Choose the license you want to focus on first.');
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
                Two short steps and we will point you to the most relevant study path right away. Choosing a focus does not enroll a certification yet.
              </CardDescription>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <p className="font-semibold text-slate-900">Recommended flow</p>
              <p className="mt-2">1. Choose the license you want to focus on first.</p>
              <p>2. Tell us your current level and, if useful, your main goal.</p>
              <p>3. After onboarding, enroll the first track your current plan should unlock. REGS never consumes a certification slot.</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <StepBlock
              index={1}
              active={step === 1}
              done={step === 2 && !!primaryLicenseId}
              title="License focus"
              description="Pick the first path you want the platform to emphasize. Enrollment happens right after onboarding."
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
                  <p className="mt-1 text-sm leading-6 text-slate-500">Shortcuts and suggested study routes can be prioritized by your selected license.</p>
                </div>
                <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Study guidance</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Practice intensity and onboarding hints can adapt to your current stage.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={surfaceCard}>
          <CardHeader className="space-y-2">
            <CardTitle className={`${sora.className} text-2xl text-slate-900`}>
              {step === 1 ? 'Choose your first license' : 'Set your current study profile'}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-500">
              {step === 1
                ? 'You can access other paths later. This only defines where the product should guide you first and what enrollment step we recommend next.'
                : 'Keep it practical. These choices are used to shape recommendations, not lock the account.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {onboardingLicenseOptions.map((option) => {
                  const isActive = primaryLicenseId === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setPrimaryLicenseId(option.value);
                        setError(null);
                      }}
                      className={[
                        'rounded-[18px] border p-4 text-left transition',
                        isActive
                          ? 'border-[#c9d4f4] bg-[#f5f8ff] text-slate-900 shadow-[0_16px_35px_rgba(45,75,179,0.10)]'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold">{option.title}</p>
                          <p className={isActive ? 'mt-2 text-sm leading-6 text-slate-600' : 'mt-2 text-sm leading-6 text-slate-500'}>
                            {option.description}
                          </p>
                        </div>
                        {isActive ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2d4bb3]" /> : null}
                      </div>
                    </button>
                  );
                })}
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
                      setError('Choose the license you want to focus on first.');
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