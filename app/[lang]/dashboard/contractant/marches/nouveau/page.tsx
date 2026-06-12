'use client';

import Guard from '@/components/contractant/Guard';
import AOWizard from '@/components/contractant/AOWizard';

export default function NouvelAOPage() {
  return (
    <Guard anyOf={['marche:create']}>
      <AOWizard />
    </Guard>
  );
}
