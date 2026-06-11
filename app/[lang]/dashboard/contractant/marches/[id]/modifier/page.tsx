'use client';

import { useParams } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import AOWizard from '@/components/contractant/AOWizard';

export default function ModifierAOPage() {
  const { id } = useParams() as { id: string };
  return (
    <Guard anyOf={['marche:update']}>
      <AOWizard appelId={id} />
    </Guard>
  );
}
