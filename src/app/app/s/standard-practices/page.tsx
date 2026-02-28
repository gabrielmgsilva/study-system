'use client';

import React from 'react';
import EntitlementGuard from '@/components/EntitlementGuard';

import AdvancedEngine, {
  DeckSection,
  RawQuestion,
} from '@/components/study/AdvancedEngine';

// metadata do módulo Structures
import metadata from '../../../../../data/structures/metadata.json';

// imports estáticos dos JSONs (necessário pro bundler do Next)
import st01 from '../../../../../data/structures/standardPractices/01_standard_practices.json';
import st02 from '../../../../../data/structures/standardPractices/02_aerodynamics_structures.json';
import st03 from '../../../../../data/structures/standardPractices/03_math_physics.json';
import st04 from '../../../../../data/structures/standardPractices/04_hardware.json';
import st05 from '../../../../../data/structures/standardPractices/05_drawings.json';
import st06 from '../../../../../data/structures/standardPractices/06_weight_balance.json';
import st07 from '../../../../../data/structures/standardPractices/07_corrosion_metalurgy.json';
import st08 from '../../../../../data/structures/standardPractices/08_ndt.json';
import st09 from '../../../../../data/structures/standardPractices/09_servicing.json';
import st10 from '../../../../../data/structures/standardPractices/10_tools.json';
import st11 from '../../../../../data/structures/standardPractices/11_basic_structures.json';
import st12 from '../../../../../data/structures/standardPractices/12_maintenance_procedures.json';

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
