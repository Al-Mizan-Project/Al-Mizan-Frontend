'use client';

import { useState, useEffect } from 'react';
import { Organisation, OrgType, Membre } from '@/lib/types';
import { api } from '@/lib/api';
import CreateOrganisationForm from './CreateOrganisationForm';
import OrganisationDetailPage from './OrganisationDetailPage';

interface Props {
  orgType: OrgType;
  title: string;
  initialOrg?: Organisation;
  onInitialOrgConsumed?: () => void;
}

export default function OrganisationsListPage({ orgType, title, initialOrg, onInitialOrgConsumed }: Props) {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);

  useEffect(() => {
    const endpointMap: Record<OrgType, string> = {
      operateur_economique: '/admin/organisations/operateurs/',
      tutelle:              '/admin/organisations/tutelle/',
      service_contractant:  '/admin/organisations/service-contractant/',
      commission_externe:   '/admin/organisations/commission-externe/',
    };
    api.get(endpointMap[orgType])
.then(({ data }) => setOrganisations(Array.isArray(data) ? data : data.results ?? data.data ?? []))      .catch(() => setError('Erreur lors du chargement des organisations.'))
      .finally(() => setLoading(false));
  }, [orgType]);

  useEffect(() => {
    if (initialOrg) {
      setSelectedOrg(initialOrg);
      setView('detail');
      onInitialOrgConsumed?.();
    }
  }, [initialOrg, onInitialOrgConsumed]);

  // membresForOrg now uses string (UUID) comparison
  const membresForOrg = (orgId: string) => membres.filter(m => m.id_organisation === orgId);

  if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;
  if (error)   return <div className="p-6 text-center text-red-600">{error}</div>;

  if (view === 'create') {
    return (
      <CreateOrganisationForm
        orgType={orgType}
        onBack={() => setView('list')}
        onSuccess={(org) => {
          setOrganisations(prev => [...prev, org]);
          setView('list');
        }}
      />
    );
  }

  if (view === 'detail' && selectedOrg) {
    return (
      <OrganisationDetailPage
        organisation={selectedOrg}
        orgType={orgType}
        membres={membresForOrg(selectedOrg.id_organisation)}
        onBack={() => setView('list')}
        onMemberCreated={(m) => setMembres(prev => [...prev, m])}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        <button
          onClick={() => setView('create')}
          className="px-4 py-2 bg-[#00738C] text-white text-sm font-bold rounded-lg hover:bg-[#005f75] transition-colors"
        >
          + Créer une organisation
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {organisations.length === 0 ? (
          <p className="px-6 py-12 text-sm text-gray-400 text-center">Aucune organisation créée.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nom officiel</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Responsable</th>
                <th className="px-4 py-3 text-left">Membres</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {organisations.map(org => (
                <tr key={org.id_organisation}
                  onClick={() => { setSelectedOrg(org); setView('detail'); }}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{org.nom_officiel}</td>
                  <td className="px-4 py-3 text-gray-500">{org.email_contact || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{org.responsable_nom || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{membresForOrg(org.id_organisation).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}