'use client';

import React from 'react';
import EntitlementGuard from '@/components/EntitlementGuard';

import AdvancedEngine, { DeckSection, RawQuestion } from '@/components/study/AdvancedEngine';

// ✅ modelo novo
import metadata from '../../../../../data/m/standard_practices/metadata.json';

// ✅ TC guide: 1–10
import q1 from '../../../../../data/m/standard_practices/1.json';
import q2 from '../../../../../data/m/standard_practices/2.json';
import q3 from '../../../../../data/m/standard_practices/3.json';
import q4 from '../../../../../data/m/standard_practices/4.json';
import q5 from '../../../../../data/m/standard_practices/5.json';
import q6 from '../../../../../data/m/standard_practices/6.json';
import q7 from '../../../../../data/m/standard_practices/7.json';
import q8 from '../../../../../data/m/standard_practices/8.json';
import q9 from '../../../../../data/m/standard_practices/9.json';
import q10 from '../../../../../data/m/standard_practices/10.json';

type RefItem = { label: string; ref: string };

type SetMeta = {
  id: string;
  name: string;
  shortTitle?: string;
  subtitle?: string;
  file: string; // "1.json"
  weight?: number;
  outline?: string[];
  references?: RefItem[];
};

type ModuleMetadata = {
  module: string;
  moduleTitle?: string;
  moduleDescription?: string;
  submodules?: {
    id: string;
    name: string;
    folder?: string;
    sets: SetMeta[];
  }[];
};

const fileMap: Record<string, RawQuestion[]> = {
  '1.json': q1 as RawQuestion[],
  '2.json': q2 as RawQuestion[],
  '3.json': q3 as RawQuestion[],
  '4.json': q4 as RawQuestion[],
  '5.json': q5 as RawQuestion[],
  '6.json': q6 as RawQuestion[],
  '7.json': q7 as RawQuestion[],
  '8.json': q8 as RawQuestion[],
  '9.json': q9 as RawQuestion[],
  '10.json': q10 as RawQuestion[]
};

const m = metadata as ModuleMetadata;
const sub = m.submodules?.[0];

function buildSubtitle(set: SetMeta) {
  const base = set.subtitle ?? '';
  const bullets =
    set.outline && set.outline.length ? `• ${set.outline.slice(0, 4).join('\n• ')}` : '';
  const refs =
    set.references && set.references.length
      ? `Refs: ${set.references.map((r) => `${r.label} ${r.ref}`).join(' | ')}`
      : '';

  return [base, bullets, refs].filter(Boolean).join('\n');
}

const sections: DeckSection[] =
  sub?.sets?.map((set) => ({
    id: set.id,
    title: set.name,
    shortTitle: set.shortTitle ?? set.id,
    subtitle: buildSubtitle(set),
    weight: set.weight ?? 1,
    questions: fileMap[set.file] ?? []
  })) ?? [];

export default function StandardPracticesPage() {
  const title = (m.moduleTitle ?? 'Standard Practices – M').replace('M1/M2', 'M');
  const desc = (m.moduleDescription ?? '').replace('M1/M2', 'M');

  return (
    <EntitlementGuard moduleKey="m.standard-practices" title={title}>
      <AdvancedEngine
        licenseId="m"
        moduleId="standard-practices"
        moduleKey="m.standard-practices"
        moduleTitle={title}
        moduleDescription={desc}
        sections={sections}
        defaultTestQuestionCount={50}
      />
    </EntitlementGuard>
  );
}
