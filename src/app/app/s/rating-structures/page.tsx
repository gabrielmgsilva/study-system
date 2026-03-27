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
import st13 from '../../../../../data/s/s-rating/13_sheet_metal.json';
import st14 from '../../../../../data/s/s-rating/14_tubular.json';
import st15 from '../../../../../data/s/s-rating/15_wood_fabric.json';
import st16 from '../../../../../data/s/s-rating/16_composites.json';
import st17 from '../../../../../data/s/s-rating/17_corrosion.json';
import st18 from '../../../../../data/s/s-rating/18_ndt.json';
import st19 from '../../../../../data/s/s-rating/19_fluid_lines.json';
import st20 from '../../../../../data/s/s-rating/20_thermoplastics.json';

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

// Mapa de arquivos -> dados carregados (APENAS Rating/Systems 13–20)
const fileMap: Record<string, RawQuestion[]> = {
  'systems/13_sheet_metal.json': st13 as RawQuestion[],
  'systems/14_tubular.json': st14 as RawQuestion[],
  'systems/15_wood_fabric.json': st15 as RawQuestion[],
  'systems/16_composites.json': st16 as RawQuestion[],
  'systems/17_corrosion.json': st17 as RawQuestion[],
  'systems/18_ndt.json': st18 as RawQuestion[],
  'systems/19_fluid_lines.json': st19 as RawQuestion[],
  'systems/20_thermoplastics.json': st20 as RawQuestion[],
};

// Filtra sets do metadata por prefixo "systems/"
const allSets = structuresMetadata.submodules?.[0]?.sets ?? [];
const sets = allSets.filter((s) => s.file?.startsWith('systems/'));

const sections: DeckSection[] = sets.map((set) => ({
  id: set.id,
  title: set.name,
  shortTitle: set.shortTitle,
  subtitle: set.subtitle,
  weight: set.weight ?? 1,
  questions: fileMap[set.file] ?? [],
}));

export default function SRatingStructuresPage() {
  const title = 'S Rating – Structures';

  return (
    <EntitlementGuard
      moduleKey="s.rating-structures"
      title={title}
    >
      <AdvancedEngine
        licenseId="s"
        moduleId="rating-structures"
        moduleKey="s.rating-structures"
        moduleTitle={title}
        moduleDescription="Select one or more Structures rating sections (13–20) and study them in Flashcard, Practice, or Test mode."
        sections={sections}
        enableCredits={false}
        examCost={0}
        defaultTestQuestionCount={50}
      />
    </EntitlementGuard>
  );
}
