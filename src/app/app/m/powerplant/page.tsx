'use client';

import React from 'react';
import EntitlementGuard from '@/components/EntitlementGuard';

import AdvancedEngine, { DeckSection, RawQuestion } from '@/components/study/AdvancedEngine';

// ✅ modelo novo: data/m/...
import metadata from '../../../../../data/m/powerplant/metadata.json';

// ✅ imports estáticos (bundler) — TC guide: 31–42
import q31 from '../../../../../data/m/powerplant/31.json';
import q32 from '../../../../../data/m/powerplant/32.json';
import q33 from '../../../../../data/m/powerplant/33.json';
import q34 from '../../../../../data/m/powerplant/34.json';
import q35 from '../../../../../data/m/powerplant/35.json';
import q36 from '../../../../../data/m/powerplant/36.json';
import q37 from '../../../../../data/m/powerplant/37.json';
import q38 from '../../../../../data/m/powerplant/38.json';
import q39 from '../../../../../data/m/powerplant/39.json';
import q40 from '../../../../../data/m/powerplant/40.json';
import q41 from '../../../../../data/m/powerplant/41.json';
import q42 from '../../../../../data/m/powerplant/42.json';

type RefItem = { label: string; ref: string };

type SetMeta = {
  id: string;
  name: string;
  shortTitle?: string;
  subtitle?: string;
  file: string; // "31.json"
  weight?: number;

  // ✅ igual ao Airframe
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

// Mapa de arquivos -> dados carregados
const fileMap: Record<string, RawQuestion[]> = {
  '31.json': q31 as RawQuestion[],
  '32.json': q32 as RawQuestion[],
  '33.json': q33 as RawQuestion[],
  '34.json': q34 as RawQuestion[],
  '35.json': q35 as RawQuestion[],
  '36.json': q36 as RawQuestion[],
  '37.json': q37 as RawQuestion[],
  '38.json': q38 as RawQuestion[],
  '39.json': q39 as RawQuestion[],
  '40.json': q40 as RawQuestion[],
  '41.json': q41 as RawQuestion[],
  '42.json': q42 as RawQuestion[]
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
  sub?.sets?.map((set) => {
    const questions = fileMap[set.file] ?? [];
    return {
      id: set.id,
      title: set.name,
      shortTitle: set.shortTitle ?? set.id,
      subtitle: buildSubtitle(set),
      weight: set.weight ?? 1,
      questions
    };
  }) ?? [];

export default function PowerplantPage() {
  const title = (m.moduleTitle ?? 'Powerplant – M').replace('M1/M2', 'M');
  const desc = (m.moduleDescription ?? '').replace('M1/M2', 'M');

  return (
    <EntitlementGuard moduleKey="m.powerplant" title={title}>
      <AdvancedEngine
        licenseId="m"
        moduleId="powerplant"
        moduleKey="m.powerplant"
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
