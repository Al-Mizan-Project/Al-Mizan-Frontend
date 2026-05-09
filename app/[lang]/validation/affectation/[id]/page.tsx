'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { soumissionsApi } from '@/lib/api/soumissions';
import { contractantApi } from '@/lib/api/contractant';
import { acteursApi } from '@/lib/api/acteurs';
import { authApi } from '@/lib/api/auth';
import { validationsApi } from '@/lib/api/validation';
import '../../validation.css';

interface AffectationPageProps {
  params: Promise<{ lang: string; id: string }>;
}

export default function AffectationPage({ params }: AffectationPageProps) {
  const { lang, id } = use(params);
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [soumission, setSoumission] = useState<any>(null);
  const [membres, setMembres] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const effectiveToken = token || localStorage.getItem('access_token');
        if (!effectiveToken && !authLoading) {
          router.push(`/${lang}/validation/login`);
          return;
        }

        // 1. Charger la soumission
        const soumDetail = await soumissionsApi.getSoumission(parseInt(id));
        setSoumission(soumDetail);

        // 2. Récupérer les détails du membre connecté pour avoir son organisation_id
        if (!user?.id_membre) throw new Error("ID membre manquant dans la session.");
        const currentMemberProfile = await acteursApi.getMembre(Number.isNaN(Number(user.id_membre)) ? user.id_membre as string : user.id_membre as any);
        const orgId = currentMemberProfile.organisation.id_organisation;

        // 3. Identifier le service et la commission via /my-service
        const myServiceResp = await fetch('/api/proxy/contractant?path=my-service', {
          headers: { 'Authorization': `Bearer ${effectiveToken}` }
        });

        if (!myServiceResp.ok) throw new Error("Impossible d'identifier votre service.");
        const { id_service } = await myServiceResp.json();

        // 4. Charger les données en parallèle
        const [commissionsData, orgMembres, allUsers, allValidations] = await Promise.all([
          contractantApi.getServiceCommissions(id_service),
          fetch(`/api/proxy/acteurs?path=organisations/${orgId}/membres/`, {
            headers: { 'Authorization': `Bearer ${effectiveToken}` }
          }).then(res => res.json()),
          authApi.getUsers(),
          validationsApi.getValidations()
        ]);

        // 5. Trouver la commission interne du responsable
        let currentMemberIdInt: number | null = null;
        if (typeof user.id_membre === 'number') {
          currentMemberIdInt = user.id_membre;
        } else {
          const parts = user.id_membre.toString().split('-');
          currentMemberIdInt = parseInt(parts[parts.length - 1], 16);
        }

        const internalComms = commissionsData.commissions_internes || [];
        let targetCommId: number | null = null;
        let membersInCommission: any[] = [];

        for (const comm of internalComms) {
          const links = await contractantApi.getCommissionInterneMembres(comm.id_comission_interne);
          if (links.some(l => l.id_membre === currentMemberIdInt)) {
            targetCommId = comm.id_comission_interne;
            membersInCommission = links;
            break;
          }
        }

        if (targetCommId) {
          // 6. Enrichir les membres filtrés par la commission
          const processedMembers = membersInCommission.map(link => {
            // Trouver le membre dans la liste de l'organisation
            const acteur = orgMembres.find((m: any) => {
              const m_id_int = parseInt(m.id_membre.split('-').pop() || '0', 16);
              return m_id_int === link.id_membre;
            });

            // Trouver l'id_utilisateur dans les users
            const authUser = allUsers.find(u => {
              const u_id_int = parseInt(u.id_membre?.toString().split('-').pop() || '0', 16);
              return u_id_int === link.id_membre;
            });

            const workload = allValidations.filter(v =>
              v.id_utilisateur === authUser?.id_utilisateur && !v.is_validated
            ).length;

            return {
              id_membre: link.id_membre,
              id_utilisateur: authUser?.id_utilisateur || null,
              nom: acteur ? `${acteur.prenom} ${acteur.nom}` : `Membre #${link.id_membre}`,
              charge_actuelle: workload,
              disponibilite: workload < 3 ? 'Disponible' : 'Chargé'
            };
          });

          // 7. Filtrer pour exclure le responsable lui-même
          const expertsOnly = processedMembers.filter(m => m.id_membre !== currentMemberIdInt);
          setMembres(expertsOnly);
        }

      } catch (err) {
        console.error("Erreur lors du chargement des détails:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) loadAllData();
  }, [id, token, authLoading, router, lang, user]);

  const handleAffecter = async () => {
    if (!selectedMember || !declarationAccepted) return;

    setSubmitting(true);
    try {
      await validationsApi.createValidation({
        id_soumission: parseInt(id),
        id_utilisateur: selectedMember,
        type: 'interne',
        is_validated: false,
        commentaire: "Affecté par le responsable de commission."
      });

      router.push(`/${lang}/validation/dashboard/commission?status=En Cours`);
    } catch (err) {
      console.error("Erreur soumission affectation:", err);
      alert("Erreur lors de l'affectation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Chargement des détails d'affectation...</div>;
  if (!soumission) return <div className="p-10 text-center">Aucune donnée trouvée.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
      {/* ── En-tête / Infos Soumission ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Affectation du Dossier</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Référence Dossier</p>
            <p className="text-lg font-medium text-gray-800">Dossier #{soumission.id_soumission}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Montant</p>
            <p className="text-lg font-medium text-gray-800">{soumission.montant_financier?.toLocaleString()} DZD</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date Soumission</p>
            <p className="text-lg font-medium text-gray-800">
              {soumission.date_soumission ? new Date(soumission.date_soumission).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Délai Imparti</p>
            <p className="text-lg font-medium text-amber-600">7 Jours</p>
          </div>
        </div>
      </div>

      {/* ── Liste des Membres ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Membres de votre Commission</h2>
          <p className="text-sm text-gray-500 mt-1">Sélectionnez l'expert responsable de l'évaluation de ce dossier.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Membre</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Charge actuelle</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Disponibilité</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {membres.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400">Aucun expert trouvé dans votre commission.</td>
                </tr>
              ) : membres.map((membre: any) => (
                <tr
                  key={membre.id_utilisateur || `membre-${membre.id_membre}`}
                  className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${selectedMember === membre.id_utilisateur ? 'bg-blue-50' : ''}`}
                  onClick={() => membre.id_utilisateur && setSelectedMember(membre.id_utilisateur)}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {membre.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{membre.nom}</p>
                        <p className="text-xs text-gray-500">{membre.id_utilisateur ? 'Expert interne' : 'Compte non activé'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(membre.charge_actuelle * 33, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{membre.charge_actuelle} dossiers</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${membre.disponibilite === 'Disponible' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {membre.disponibilite}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-auto ${selectedMember === membre.id_utilisateur ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {selectedMember === membre.id_utilisateur && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Validation et Soumission ── */}
      <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                className="sr-only"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
              />
              <div className={`w-5 h-5 rounded border transition-all ${declarationAccepted ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
                {declarationAccepted && (
                  <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-600 max-w-xl">
              Je déclare que cette affectation respecte les règles d'impartialité et d'absence de conflit d'intérêts conformément au règlement interne d'Al-Mizan.
            </span>
          </label>

          <button
            disabled={!selectedMember || !declarationAccepted || submitting}
            onClick={handleAffecter}
            className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${!selectedMember || !declarationAccepted || submitting
              ? 'bg-gray-300 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'
              }`}
          >
            {submitting ? 'Affectation en cours...' : 'Confirmer l\'affectation'}
          </button>
        </div>
      </div>
    </div>
  );
}