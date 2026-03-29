'use client';

import React from 'react';
import EntitlementGuard from '@/components/EntitlementGuard';

import AdvancedEngine, {
  DeckSection,
  RawQuestion,
} from '@/components/study/AdvancedEngine';

// ✅ IMPORTS ALINHADOS COM A PASTA data/e/e-rating (GUIA TC)
import sec24 from '../../../../../data/e/e-rating/24.json';
import sec25 from '../../../../../data/e/e-rating/25.json';
import sec26 from '../../../../../data/e/e-rating/26.json';
import sec27 from '../../../../../data/e/e-rating/27.json';
import sec28 from '../../../../../data/e/e-rating/28.json';

// ✅ SECTIONS PARA O ADVANCEDENGINE (GUIA OFICIAL TC)
const sections: DeckSection[] = [
  {
    id: '24',
    title: '24.0 – Navigation and Communication Systems',
    shortTitle: '24',
    subtitle:
      'Radio waves/signals, antennas, communications, radio-nav, radio altimeter, weather radar, RMI, GPWS, compass, TCAS.',
    weight: 1,
    questions: sec24 as RawQuestion[],
  },
  {
    id: '25',
    title: '25.0 – Autoflight Systems',
    shortTitle: '25',
    subtitle:
      'Autopilot, flight management, autothrottle/thrust management, automatic landing, mach trim.',
    weight: 1,
    questions: sec25 as RawQuestion[],
  },
  {
    id: '26',
    title: '26.0 – Electrical Systems',
    shortTitle: '26',
    subtitle:
      'Safety procedures, DC/AC generation, batteries, distribution, digital ICs, troubleshooting, wiring diagrams, starter generator.',
    weight: 1,
    questions: sec26 as RawQuestion[],
  },
  {
    id: '27',
    title: '27.0 – Recording and Emergency Systems',
    shortTitle: '27',
    subtitle:
      'CVR, FDR, ELT, underwater location device (ULD) – theory, components, inspection/test.',
    weight: 1,
    questions: sec27 as RawQuestion[],
  },
  {
    id: '28',
    title: '28.0 – Instrument Systems',
    shortTitle: '28',
    subtitle:
      'Flight instruments and Air Data Computer – theory, construction and inspection.',
    weight: 1,
    questions: sec28 as RawQuestion[],
  },
];

export default function ERatingAvionicsPage() {
  return (
    <EntitlementGuard
      moduleKey="e.rating-avionics"
      title="E Rating – Avionics (Systems & Theory)"
    >
      <AdvancedEngine
        licenseId="e"
        moduleId="rating-avionics"
        moduleKey="e.rating-avionics"
        moduleTitle="E Rating – Avionics (Systems & Theory)"
        moduleDescription="Select one or more TC sections (24–28) and study them in Flashcard, Practice, or Test mode."
        sections={sections}
        defaultTestQuestionCount={50}
      />
    </EntitlementGuard>
  );
}
