'use client';

import React from 'react';
import EntitlementGuard from '@/components/EntitlementGuard';

import AdvancedEngine, {
  DeckSection,
  RawQuestion,
} from '@/components/study/AdvancedEngine';

import metadata from '../../../../data/regs/metadata.json';

import carsAll from '../../../../data/regs/CARs.json';
import standardsAll from '../../../../data/regs/Standards.json';

type SetMeta = {
  id: string;
  name: string;         // ex: "20.0 – Maintenance Release..."
  shortTitle?: string;  // ex: "20.0"
  subtitle?: string;
  file: 'CARs.json' | 'Standards.json';
  weight?: number;
};

type ModuleMetadata = {
  module: string;
  moduleTitle?: string;
  moduleDescription?: string;
  submodules?: { id: string; name: string; folder?: string; sets: SetMeta[] }[];
};

function extractSectionCode(setName: string, fallback?: string) {
  // pega "20.0" do começo do name
  const m = setName.match(/^(\d{1,2}\.0)\b/);
  return m?.[1] ?? fallback ?? '';
}

function filterBySectionCode(all: RawQuestion[], sectionCode: string) {
  if (!sectionCode) return [];
  return (all as any[]).filter((q) => (q?.tcSectionCode ?? '') === sectionCode) as RawQuestion[];
}

const m = metadata as unknown as ModuleMetadata;
const sub = m.submodules?.[0];

const carsQ = carsAll as unknown as RawQuestion[];
const stdQ = standardsAll as unknown as RawQuestion[];

const sections: DeckSection[] =
  sub?.sets?.map((set) => {
    const all = set.file === 'CARs.json' ? carsQ : stdQ;
    const sectionCode = extractSectionCode(set.name, set.shortTitle);

    const questions = filterBySectionCode(all, sectionCode);

    return {
      id: set.id,
      title: set.name,
      shortTitle: set.shortTitle ?? set.id,
      subtitle: set.subtitle ?? '',
      weight: set.weight ?? 1,
      questions,
    };
  }) ?? [];

export default function RegsPage() {
  const title = m.moduleTitle ?? 'Regulatory Requirements – M';
  const desc =
    m.moduleDescription ??
    'Transport Canada CARs and Standards applicable to the M rating (based on the TC guide).';

  return (
    <EntitlementGuard moduleKey="regs.core" title={title}>
      <AdvancedEngine
        licenseId="m"
        moduleId="regs"
        moduleTitle={title}
        moduleDescription={desc}
        sections={sections}
        enableCredits={false}
        examCost={0}
        defaultTestQuestionCount={50}
      />
    </EntitlementGuard>
  );
}
