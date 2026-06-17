'use client';

import { useState } from 'react';
import { DemandeOE, Organisation } from '@/lib/types';
import { api } from '@/lib/api';

interface Props {
  demande: DemandeOE;
  onBack: () => void;
  onApproved: (org: Organisation) => void;
}

export default function DemandeReviewPage({ demande, onBack, onApproved }: Props) {
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [motifRefus, setMotifRefus]     = useState('');
  const [showRefusForm, setShowRefusForm] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/admin/demandes/${demande.id}/approuver/`);
      // The endpoint returns 204 No Content – build organisation from demande data
      const org: Organisation = {
        id_organisation: demande.id,
        nom_officiel:    demande.nom_organisation,
        email_contact:   demande.email_contact,
      };
      onApproved(org);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'approbation.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefuse = () => {
    // TODO: POST /admin/demandes/{id}/refuser/ when endpoint exists
    onBack();
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800">← Retour</button>
        <div className="h-4 w-px bg-gray-300" />
        <h1 className="text-lg font-bold text-gray-800">Examen de la demande</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white border rounded-xl p-6 space-y-3 mb-4">
        <h2 className="font-bold text-gray-700 mb-2">Informations de l'organisation</h2>
        {[
          ["Nom de l'organisation", demande.nom_organisation],
          ["Email de contact", demande.email_contact],
          ["Téléphone", demande.telephone],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">{label}</span>
            <span className="text-gray-800">{val}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-6 space-y-3 mb-4">
        <h2 className="font-bold text-gray-700 mb-2">Données opérateur économique</h2>
        {[
          ["NIF", demande.nif],
          ["Registre de commerce", demande.num_registre_commerce],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">{label}</span>
            <span className="text-gray-800 font-mono text-xs">{val}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="font-bold text-gray-700 mb-3">Documents joints</h2>
        <div className="space-y-2">
          {demande.documents.length === 0 && (
            <p className="text-sm text-gray-400">Aucun document joint.</p>
          )}
          {demande.documents.map((doc) => (
            <span key={doc.id} className="flex items-center gap-2 text-sm text-gray-700">
              📄 {doc.type_document} <span className="text-xs text-gray-400">(ID: {doc.document_id})</span>
            </span>
          ))}
        </div>
      </div>

      {!showRefusForm ? (
        <div className="flex gap-3">
          <button onClick={() => setShowRefusForm(true)}
            className="flex-1 py-2.5 border border-red-300 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors">
            Refuser
          </button>
          <button onClick={handleApprove} disabled={loading}
            className="flex-1 py-2.5 bg-[#00738C] text-white font-bold rounded-lg disabled:opacity-50 hover:bg-[#005f75] transition-colors">
            {loading ? 'Création...' : "Approuver et créer l'organisation"}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-red-200 rounded-xl p-6 space-y-3">
          <h2 className="font-bold text-red-600">Motif de refus</h2>
          <textarea value={motifRefus} onChange={e => setMotifRefus(e.target.value)}
            placeholder="Expliquez le motif du refus..." rows={3}
            className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-red-400" />
          <div className="flex gap-3">
            <button onClick={() => setShowRefusForm(false)} className="flex-1 py-2 border rounded-lg text-sm">Annuler</button>
            <button onClick={handleRefuse} disabled={!motifRefus}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-bold disabled:opacity-50">
              Confirmer le refus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}