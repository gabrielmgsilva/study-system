'use client';

import React from 'react';
import EntitlementGuard from '@/components/EntitlementGuard';

import AdvancedEngine, {
  DeckSection,
  RawQuestion,
} from '@/components/study/AdvancedEngine';

// metadata do módulo Airframe
import metadata from '../../../../../data/m/airframe/metadata.json';

// imports estáticos (necessário pro bundler)
import q11 from '../../../../../data/m/airframe/11.json';
import q12 from '../../../../../data/m/airframe/12.json';
import q13 from '../../../../../data/m/airframe/13.json';
import q14 from '../../../../../data/m/airframe/14.json';
import q15 from '../../../../../data/m/airframe/15.json';
import q16 from '../../../../../data/m/airframe/16.json';
import q17 from '../../../../../data/m/airframe/17.json';
import q18 from '../../../../../data/m/airframe/18.json';
import q19 from '../../../../../data/m/airframe/19.json';
import q20 from '../../../../../data/m/airframe/20.json';
import q21 from '../../../../../data/m/airframe/21.json';
import q22 from '../../../../../data/m/airframe/22.json';
import q23 from '../../../../../data/m/airframe/23.json';
import q24 from '../../../../../data/m/airframe/24.json';
import q25 from '../../../../../data/m/airframe/25.json';
import q26 from '../../../../../data/m/airframe/26.json';
import q27 from '../../../../../data/m/airframe/27.json';
import q28 from '../../../../../data/m/airframe/28.json';
import q29 from '../../../../../data/m/airframe/29.json';
import q30 from '../../../../../data/m/airframe/30.json';

type SetMeta = {
  id: string;
  name: string;
  shortTitle?: string;
  subtitle?: string;
  topics?: string[];
  file: string; // ex: "12.json"
  weight?: number;
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
  '11.json': q11 as unknown as RawQuestion[],
  '12.json': q12 as unknown as RawQuestion[],
  '13.json': q13 as unknown as RawQuestion[],
  '14.json': q14 as unknown as RawQuestion[],
  '15.json': q15 as unknown as RawQuestion[],
  '16.json': q16 as unknown as RawQuestion[],
  '17.json': q17 as unknown as RawQuestion[],
  '18.json': q18 as unknown as RawQuestion[],
  '19.json': q19 as unknown as RawQuestion[],
  '20.json': q20 as unknown as RawQuestion[],
  '21.json': q21 as unknown as RawQuestion[],
  '22.json': q22 as unknown as RawQuestion[],
  '23.json': q23 as unknown as RawQuestion[],
  '24.json': q24 as unknown as RawQuestion[],
  '25.json': q25 as unknown as RawQuestion[],
  '26.json': q26 as unknown as RawQuestion[],
  '27.json': q27 as unknown as RawQuestion[],
  '28.json': q28 as unknown as RawQuestion[],
  '29.json': q29 as unknown as RawQuestion[],
  '30.json': q30 as unknown as RawQuestion[],
};

const m = metadata as ModuleMetadata;
const sub = m.submodules?.[0];

// ✅ Monta sections a partir do metadata (agora com topics)
const sections: DeckSection[] =
  sub?.sets?.map((set) => ({
    id: set.id,
    title: set.name,
    shortTitle: set.shortTitle ?? set.id,
    subtitle: set.subtitle ?? '',
    topics: set.topics ?? [],
    weight: set.weight ?? 1,
    questions: fileMap[set.file] ?? [],
  })) ?? [];

export default function AirframePage() {
  const title = m.moduleTitle ?? 'Airframe – M';
  const desc =
    m.moduleDescription ??
    'Structures, aerodynamics, systems and repairs for AME M.';

  return (
    <EntitlementGuard moduleKey="m.airframe" title={title}>
      <AdvancedEngine
        licenseId="m"
        moduleId="airframe"
        moduleKey="m.airframe"
        moduleTitle={title}
        moduleDescription={desc}
        sections={sections}
        defaultTestQuestionCount={50}
      />
    </EntitlementGuard>
  );
}
