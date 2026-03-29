'use client';

import React from 'react';
import EntitlementGuard from '@/components/EntitlementGuard';

import AdvancedEngine, {
  DeckSection,
  RawQuestion,
} from '@/components/study/AdvancedEngine';

// --- IMPORTS ALINHADOS COM OS ARQUIVOS DA PASTA --- //
import scienceMathData from '../../../../../data/e/standardpractices/1.json';
import wiringPracticesData from '../../../../../data/e/standardpractices/2.json';
import hardwareData from '../../../../../data/e/standardpractices/3.json';
import toolsData from '../../../../../data/e/standardpractices/4.json';
import basicSystemsData from '../../../../../data/e/standardpractices/5.json';
import basicElectricityData from '../../../../../data/e/standardpractices/6.json';
import basicElectronicsData from '../../../../../data/e/standardpractices/7.json';
import corrosionData from '../../../../../data/e/standardpractices/8.json';
import ndtData from '../../../../../data/e/standardpractices/9.json';

// --- SECTIONS PARA O ADVANCEDENGINE --- //
const sections: DeckSection[] = [
  {
    id: 'sp01',
    title: '01 – Science & Math',
    shortTitle: 'Science/Math',
    subtitle: 'Basic physics and math for avionics standard practices.',
    weight: 1,
    questions: scienceMathData as RawQuestion[],
  },
  {
    id: 'sp02',
    title: '02 – Wiring Practices',
    shortTitle: 'Wiring',
    subtitle: 'Wiring installation, routing, protection and terminations.',
    weight: 1,
    questions: wiringPracticesData as RawQuestion[],
  },
  {
    id: 'sp03',
    title: '03 – Hardware',
    shortTitle: 'Hardware',
    subtitle: 'Fasteners, connectors and other avionics hardware.',
    weight: 1,
    questions: hardwareData as RawQuestion[],
  },
  {
    id: 'sp04',
    title: '04 – Tools & Measuring Devices',
    shortTitle: 'Tools',
    subtitle: 'Hand tools, measuring devices and proper use.',
    weight: 1,
    questions: toolsData as RawQuestion[],
  },
  {
    id: 'sp05',
    title: '05 – Basic Aircraft Systems',
    shortTitle: 'Systems',
    subtitle: 'Overview of aircraft systems relevant to avionics.',
    weight: 1,
    questions: basicSystemsData as RawQuestion[],
  },
  {
    id: 'sp06',
    title: '06 – Basic Electricity',
    shortTitle: 'Electricity',
    subtitle: 'Basic electrical concepts, laws and circuit theory.',
    weight: 1,
    questions: basicElectricityData as RawQuestion[],
  },
  {
    id: 'sp07',
    title: '07 – Basic Electronics',
    shortTitle: 'Electronics',
    subtitle: 'Semiconductors, logic and basic electronic circuits.',
    weight: 1,
    questions: basicElectronicsData as RawQuestion[],
  },
  {
    id: 'sp08',
    title: '08 – Corrosion & Prevention',
    shortTitle: 'Corrosion',
    subtitle: 'Corrosion theory, detection and protection methods.',
    weight: 1,
    questions: corrosionData as RawQuestion[],
  },
  {
    id: 'sp09',
    title: '09 – NDT – Non-Destructive Testing',
    shortTitle: 'NDT',
    subtitle: 'Non-destructive inspection methods applicable to avionics.',
    weight: 1,
    questions: ndtData as RawQuestion[],
  },
];

export default function EStandardPracticesPage() {
  return (
    <EntitlementGuard
      // compat: atual + futuro (durante migração)
      moduleKey={[
        'avionics.stdp',
        'avionics.standard-practices',
        'e.standard-practices',
      ]}
      title="Standard Practices – Avionics (E)"
    >
      <AdvancedEngine
        licenseId="e"
        moduleId="standard-practices-avionics"
        moduleKey="e.standard-practices"
        moduleTitle="Standard Practices – Avionics (E)"
        moduleDescription="Build a deck by selecting Standard Practices subjects and study in Flashcard, Practice, or Test mode."
        sections={sections}
        defaultTestQuestionCount={50}
      />
    </EntitlementGuard>
  );
}
