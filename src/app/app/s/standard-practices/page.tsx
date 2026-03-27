'use client';

import React from 'react';
import EntitlementGuard from '@/components/EntitlementGuard';

import AdvancedEngine, {
  DeckSection,
  RawQuestion,
} from '@/components/study/AdvancedEngine';

// metadata do módulo Structures
import metadata from '../../../../../data/s/metadata.json';

// imports estáticos dos JSONs (necessário pro bundler do Next)
import st01 from '../../../../../data/s/standardpractices/1.json';
import st02 from '../../../../../data/s/standardpractices/2.json';
import st03 from '../../../../../data/s/standardpractices/3.json';
import st04 from '../../../../../data/s/standardpractices/4.json';
import st05 from '../../../../../data/s/standardpractices/5.json';
import st06 from '../../../../../data/s/standardpractices/6.json';
import st07 from '../../../../../data/s/standardpractices/7.json';
import st08 from '../../../../../data/s/standardpractices/8.json';
import st09 from '../../../../../data/s/standardpractices/9.json';
import st10 from '../../../../../data/s/standardpractices/10.json';
import st11 from '../../../../../data/s/standardpractices/11.json';
import st12 from '../../../../../data/s/standardpractices/12.json';

// Tipos para o metadata
type StructuresSetMeta = {
  id: string;
  name: string;
  shortTitle: string;
  subtitle: string;
  file: string;
  weight?: number;
};

type StructuresMetadata = {
  module: string;
  moduleTitle?: string;
  moduleDescription?: string;
  submodules: {
    id: string;
    name: string;
    folder: string;
    sets: StructuresSetMeta[];
  }[];
};

const structuresMetadata = metadata as StructuresMetadata;

// Mapa de arquivos -> dados carregados (APENAS Standard Practices 01–12)
const fileMap: Record<string, RawQuestion[]> = {
  'standardPractices/01_standard_practices.json': st01 as RawQuestion[],
  'standardPractices/02_aerodynamics_structures.json': st02 as RawQuestion[],
  'standardPractices/03_math_physics.json': st03 as RawQuestion[],
  'standardPractices/04_hardware.json': st04 as RawQuestion[],
  'standardPractices/05_drawings.json': st05 as RawQuestion[],
  'standardPractices/06_weight_balance.json': st06 as RawQuestion[],
  'standardPractices/07_corrosion_metalurgy.json': st07 as RawQuestion[],
  'standardPractices/08_ndt.json': st08 as RawQuestion[],
  'standardPractices/09_servicing.json': st09 as RawQuestion[],
  'standardPractices/10_tools.json': st10 as RawQuestion[],
  'standardPractices/11_basic_structures.json': st11 as RawQuestion[],
  'standardPractices/12_maintenance_procedures.json': st12 as RawQuestion[],
};

// Filtra sets do metadata por prefixo "standardPractices/"
const allSets = structuresMetadata.submodules?.[0]?.sets ?? [];
const sets = allSets.filter((s) => s.file?.startsWith('standardPractices/'));

const sections: DeckSection[] = sets.map((set) => ({
  id: set.id,
  title: set.name,
  shortTitle: set.shortTitle,
  subtitle: set.subtitle,
  weight: set.weight ?? 1,
  questions: fileMap[set.file] ?? [],
}));

export default function SStandardPracticesPage() {
  const title = 'S – Standard Practices';

  return (
    <EntitlementGuard
      moduleKey="s.standard-practices"
      title={title}
    >
      <AdvancedEngine
        licenseId="s"
        moduleId="standard-practices-structures"
        moduleKey="s.standard-practices"
        moduleTitle={title}
        moduleDescription="Select one or more Standard Practices sections (01–12) and study them in Flashcard, Practice, or Test mode."
        sections={sections}
        enableCredits={false}
        examCost={0}
        defaultTestQuestionCount={50}
      />
    </EntitlementGuard>
  );
}
