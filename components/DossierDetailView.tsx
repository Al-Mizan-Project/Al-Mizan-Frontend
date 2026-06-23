'use client';

import type { Dossier } from '@/lib/dossiers-data';

export default function DossierDetailView({
  dossier,
  onBack,
}: {
  dossier: Dossier;
  onBack: () => void;
}) {
  return (
    <div className="p-6">
      <button onClick={onBack} className="mb-4 text-sm text-[#00738C] hover:underline">
        ← Retour
      </button>
      <h2 className="text-lg font-bold mb-4">Dossier {dossier.reference}</h2>
      <p className="text-gray-600">Détail du dossier en cours de développement.</p>
    </div>
  );
}
