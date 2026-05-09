'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Approbation {
  id: string;
  operateurNom: string;
  numeroSerie: string;
}

interface Permission {
  id_permission: number;
  nom_permission: string;
}

interface Props {
  operateur: Approbation;
  onBack: () => void;
  onSuccess: (operateur: Approbation) => void;
}

export default function CreateOperateurAccountView({ operateur, onBack, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permissions spécifiques à pré-cocher si elles existent
  const TARGET_PERMISSIONS = ['responsable_operateur_economique', 'soumitter_offre', 'faire_recours'];

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data } = await api.get('/permissions');
        setPermissions(data);
        // Pré-sélectionner les permissions cibles si elles existent
        const targetIds = data
          .filter((p: Permission) => TARGET_PERMISSIONS.includes(p.nom_permission))
          .map((p: Permission) => p.id_permission);
        setSelectedPerms(targetIds);
      } catch (err) {
        console.error('Erreur chargement permissions', err);
        setError('Impossible de charger les permissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const handleTogglePermission = (permId: number) => {
    setSelectedPerms(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Créer l'utilisateur avec le rôle "Opérateur Économique"
      //    Note: l'ID du rôle est à récupérer dynamiquement ou via une constante
      const roleOperateurId = 3; // À adapter selon votre base
      const userPayload = {
        email,
        nom,
        prenom,
        id_role: roleOperateurId,
        is_active: true,
      };

      const { data: user } = await api.post('/users', userPayload);

      // 2. Assigner les permissions sélectionnées à cet utilisateur
      if (selectedPerms.length > 0) {
        await api.post(`/users/${user.id_utilisateur}/permissions`, {
          permission_ids: selectedPerms,
        });
      }

      // 3. Notifier le succès
      onSuccess(operateur);
    } catch (err: any) {
      console.error('Erreur création compte', err);
      setError(err?.response?.data?.message || 'Erreur lors de la création du compte.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-500">Chargement des permissions...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête avec retour */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-[#00738C] hover:text-[#1C4532] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Retour à la liste
        </button>
        <h2 className="text-2xl font-black text-gray-900">
          Créer le compte responsable
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm text-gray-500 mb-6">
          Opérateur : <strong>{operateur.operateurNom}</strong> ({operateur.numeroSerie})
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations du compte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#00738C]"
                placeholder="responsable@operateur.dz"
              />
            </div>
            <div></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                required
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#00738C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                required
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#00738C]"
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Permissions</h3>
            {permissions.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune permission disponible.</p>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {permissions.map(perm => (
                  <label key={perm.id_permission} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(perm.id_permission)}
                      onChange={() => handleTogglePermission(perm.id_permission)}
                      className="rounded border-gray-300 text-[#00738C] focus:ring-[#00738C]"
                    />
                    <span className="text-sm text-gray-700">{perm.nom_permission}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Les permissions <strong>{TARGET_PERMISSIONS.join(', ')}</strong> sont pré-sélectionnées si elles existent.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#00738C] hover:bg-[#005f75] text-white font-medium rounded-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}