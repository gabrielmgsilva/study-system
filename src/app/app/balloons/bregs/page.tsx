'use client';

import React from 'react';

import BalloonsBregsPage from './page';

// Legacy route kept for backward compatibility.
// This page simply renders the new BREGS page.
export default function BalloonsStudyRegsLegacyPage() {
  return <BalloonsBregsPage />;
}
