'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ValidatorList from '../../components/AffectationDossier/ValidatorList';
import { Validator, DossierInfo } from '../../types';
import { contractantApi } from '@/lib/api/contractant';
import { soumissionsApi } from '@/lib/api/soumissions';
import { useAuth } from '@/contexts/AuthContext';
import '../../validation.css';

export default function AffectationDossierPage() {
  const router = useRouter();
  const params = useParams<{ lang?: string; id?: string }>();
  const lang = params?.lang || 'fr';
  const SOUMISSION_ID = params?.id ? parseInt(params.id as string, 10) : 0;

  const [validators, setValidators] = useState<Validator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<number | null>(null);

  const [dossierInfo, setDossierInfo] = useState<DossierInfo>({
    operateurEconomique: `Dossier #${params.id}`,
    operateur: 'Chargement...',
    delaisValidation: '7 jours',
    serviceContractant: 'Chargement...',
    domaine: 'Commission Interne',
    etapeValidation: 'Affectation des experts',
  });

  const { token, isLoading: authLoading, user } = useAuth();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // 1. Récupérer la soumission uniquement
        const soumission = await soumissionsApi.getSoumission(SOUMISSION_ID);

        let currentServiceId: number | null = null;
        try {
          // 1) Try the dashboard endpoint which returns attributions for the current user
          // It includes `service_contractant_id` and is already tailored to the user's role
          const roleParam = user?.role ? encodeURIComponent(String(user.role)) : '';
          const userIdParam = user?.id ? String(user.id) : (user?.id_membre ? String(user.id_membre) : '');
          const membreIdParam = user?.id_membre ? String(user.id_membre) : '';
          const uaPath = `/api/proxy/contrats/user-attributions${
            (roleParam || userIdParam || membreIdParam) ? `?${[
              roleParam ? `role=${roleParam}` : null,
              userIdParam ? `user_id=${encodeURIComponent(userIdParam)}` : null,
              membreIdParam ? `membre_id=${encodeURIComponent(membreIdParam)}` : null,
            ].filter(Boolean).join('&')}` : ''
          }`;

          const uaResp = await fetch(uaPath, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          if (uaResp.ok) {
            const uaJson = await uaResp.json().catch(() => null);
            console.debug('user-attributions response:', uaJson);
            const uAttributions = Array.isArray(uaJson?.attributions) ? uaJson.attributions : [];
            // find attribution corresponding to this soumission
            const matching = uAttributions.find((a: any) => Number(a.soumission_id) === Number(SOUMISSION_ID));
            if (matching && matching.service_contractant_id) {
              currentServiceId = matching.service_contractant_id;
              setServiceId(currentServiceId);
            }
          } else {
            const uaText = await uaResp.text().catch(() => null);
            console.warn('user-attributions fetch failed:', uaResp.status, uaText);
          }

          // 2) Fallback: query attributions-provisoires by soumission_id if we didn't find a match
          if (!currentServiceId) {
            const attsResp = await fetch(`/api/proxy/contrats?path=attributions-provisoires/&soumission_id=${SOUMISSION_ID}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!attsResp.ok) {
              const errorText = await attsResp.text();
              console.warn(`Erreur ${attsResp.status} lors de la récupération attributions:`, errorText);
            } else {
              const attsText = await attsResp.clone().text().catch(() => null);
              console.debug('Attributions raw response text (fallback):', attsText);
              let atts: any = null;
              try {
                atts = attsText ? JSON.parse(attsText) : null;
              } catch (jsonError) {
                console.warn('Impossible de parser la réponse des attributions en JSON:', jsonError, attsText?.slice?.(0, 200));
              }
              const att = Array.isArray(atts) ? atts[0] : atts;
              console.debug('Parsed attributions object (fallback):', atts);
              if (att?.service_contractant_id) {
                currentServiceId = att.service_contractant_id;
                setServiceId(currentServiceId);
              }
            }
          }
        } catch (e) {
          console.warn('Impossible de récupérer l attribution de soumission:', e);
        }

        setDossierInfo(prev => ({
          ...prev,
          operateurEconomique: `Soumission #${soumission.id_soumission}`,
          operateur: soumission.titre_ao || soumission.reference_ao || `Soumission #${soumission.id_soumission}`,
          serviceContractant: currentServiceId ? `Service #${currentServiceId}` : 'Service inconnu',
        }));

        // 2. Récupérer les attributions de l'utilisateur comme dans le dashboard (même logique)
        let attributions: any[] = [];
        let currentValidators: any[] = [];
        

                // 2. Récupérer les membres de la commission/service de l'utilisateur
                // Nouvel endpoint qui retourne automatiquement basé sur le rôle (RESP_CM ou RESP_VALID_INTERN)
                let members: any[] = [];
                try {
                  const commissionMembersResp = await fetch('/api/proxy/contrats?path=commission-members', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    cache: 'no-store',
                  });
          
                  if (commissionMembersResp.ok) {
                    const commissionData = await commissionMembersResp.json().catch(() => null);
                    console.debug('Commission members response:', commissionData);
            
                    if (commissionData?.members && Array.isArray(commissionData.members)) {
                      members = commissionData.members;
              
                      // Mettre à jour le service ID si disponible
                      if (commissionData.id_service && !currentServiceId) {
                        currentServiceId = commissionData.id_service;
                        setServiceId(currentServiceId);
                      }
                    }
                  } else {
                    console.warn('commission-members fetch failed:', commissionMembersResp.status);
                  }
                } catch (e) {
                  console.warn('Impossible de récupérer les membres de la commission:', e);
                }
        const validatorList: Validator[] = (members || []).map(m => ({
          id: String(m.id_utilisateur || m.id_membre || m.id || m.user_id),
          nom: m.nom || m.lastName || m.lastname || 'Inconnu',
          prenom: m.prenom || m.firstName || m.firstname || '',
          matricule: m.matricule || `EXP-${m.id || m.id_membre || ''}`,
          chargeActuelle: m.charge_actuelle || 0,
          disponibilite: (m.charge_actuelle || 0) > 3 ? 'Surchargé' : 'Disponible',
        }));

        console.debug('Mapped validator list:', validatorList);
        setValidators(validatorList);
        if ((validatorList || []).length === 0) {
          setSubmitError('Aucun membre trouvé pour la commission. Vérifiez le rôle et le service.');
        }

      } catch (err) {
        console.error("Erreur chargement données affectation:", err);
        setSubmitError("Impossible de charger les experts. Vérifiez la connexion au service.");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && SOUMISSION_ID && user) {
      loadData();
    }
  }, [authLoading, SOUMISSION_ID, token, user]);

  const handleConfirmAffectation = async (validatorId: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // On cherche d'abord l'attribution liée à cette soumission
      const attsUrl = `/api/proxy/contrats?path=attributions-provisoires/&soumission_id=${SOUMISSION_ID}`;
      console.log('Fetching attribution from:', attsUrl);

      const attsResp = await fetch(attsUrl, {
        headers: authHeaders,
        cache: 'no-store',
      });

      const rawAttsText = await attsResp.text().catch(() => '');
      const contentType = attsResp.headers.get('content-type') || '';
      if (!attsResp.ok) {
        console.error('Attribution fetch failed:', {
          status: attsResp.status,
          statusText: attsResp.statusText,
          contentType,
          rawText: rawAttsText?.slice?.(0, 300),
        });
        throw new Error(`Impossible de récupérer l'attribution (${attsResp.status}): ${rawAttsText.substring(0, 100)}`);
      }

      let atts: any = null;
      try {
        atts = rawAttsText ? JSON.parse(rawAttsText) : null;
      } catch (jsonError) {
        console.error('Impossible de parser la réponse d attribution en JSON:', jsonError, {
          contentType,
          rawText: rawAttsText?.slice?.(0, 300),
        });
      }

      let att = Array.isArray(atts) ? atts[0] : atts;
      if (!att || !att.id) {
        console.warn('Aucune attribution trouvée pour la soumission. Tentative de fallback via user-attributions.');
        const roleParam = user?.role ? encodeURIComponent(String(user.role)) : '';
        const userIdParam = user?.id ? String(user.id) : user?.id_membre ? String(user.id_membre) : '';
        const membreIdParam = user?.id_membre ? String(user.id_membre) : '';
        const uaQuery = [
          roleParam ? `role=${roleParam}` : null,
          userIdParam ? `user_id=${encodeURIComponent(userIdParam)}` : null,
          membreIdParam ? `membre_id=${encodeURIComponent(membreIdParam)}` : null,
        ].filter(Boolean).join('&');
        const uaUrl = `/api/proxy/contrats/user-attributions${uaQuery ? `?${uaQuery}` : ''}`;
        const uaResp = await fetch(uaUrl, {
          headers: authHeaders,
          cache: 'no-store',
        });
        const uaText = await uaResp.text().catch(() => '');
        if (uaResp.ok) {
          let uaJson: any = null;
          try {
            uaJson = uaText ? JSON.parse(uaText) : null;
          } catch (jsonError) {
            console.error('Impossible de parser la réponse user-attributions en JSON:', jsonError, uaText?.slice?.(0, 300));
          }
          const uAttributions = Array.isArray(uaJson?.attributions) ? uaJson.attributions : [];
          att = uAttributions.find((item: any) => Number(item.soumission_id) === Number(SOUMISSION_ID));
        } else {
          console.warn('Fallback user-attributions fetch failed:', uaResp.status, uaResp.statusText, uaText?.slice?.(0, 300));
        }
      }

      if (!att || !att.id) throw new Error('Aucune attribution trouvée pour cette soumission');
      console.log('Using attribution:', att);

      // POST pour affecter validated_by
      const affecterUrl = `/api/proxy/contrats?path=attributions-provisoires/${att.id}/affecter/`;
      console.log('POSTing to:', affecterUrl, 'with validated_by:', validatorId);
      
      const patchResp = await fetch(affecterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ validated_by: Number(validatorId) }),
      });
      
      if (!patchResp.ok) {
        const errText = await patchResp.text().catch(() => 'No error details');
        console.error('Affecter failed:', { status: patchResp.status, error: errText });
        throw new Error(`Erreur lors de l'affectation (${patchResp.status}): ${errText.substring(0, 100)}`);
      }

      const result = await patchResp.json();
      console.log('Affectation successful:', result);

      // Redirection vers le dashboard commission
      router.push(`/${lang}/validation/dashboard/commission?status=En%20Cours`);

    } catch (err) {
      console.error('Erreur dans handleConfirmAffectation:', err);
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'affectation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg animate-in fade-in slide-in-from-top-2">
          <p className="font-medium">Erreur d'affectation</p>
          <p className="text-sm mt-1">{submitError}</p>
        </div>
      )}

      <div className="val-dossier-info">
        <div className="val-dossier-info-grid">
          <div className="val-dossier-info-column">
            <div className="val-dossier-info-item">
              <p className="val-dossier-info-label">Dossier</p>
              <p className="val-dossier-info-value val-dossier-info-value-semibold">
                {dossierInfo.operateurEconomique}
              </p>
            </div>
            <div className="val-dossier-info-item">
              <p className="val-dossier-info-label">Opérateur</p>
              <p className="val-dossier-info-value">
                {dossierInfo.operateur}
              </p>
            </div>
          </div>

          <div className="val-dossier-info-column">
            <div className="val-dossier-info-item">
              <p className="val-dossier-info-label">Service Contractant</p>
              <p className="val-dossier-info-value">
                {dossierInfo.serviceContractant}
              </p>
            </div>
            <div className="val-dossier-info-item">
              <p className="val-dossier-info-label">Délai imparti</p>
              <p className="val-dossier-info-value text-blue-600 font-medium">
                {dossierInfo.delaisValidation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4 border-4 border-t-transparent border-blue-600 rounded-full" />
          <p className="text-gray-500 font-medium">Calcul de la charge des experts...</p>
        </div>
      ) : (
        <ValidatorList
          validators={validators}
          onConfirm={handleConfirmAffectation}
          isReadOnly={false}
        />
      )}

      {isSubmitting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="animate-spin h-10 w-10 text-blue-600 border-4 border-t-transparent border-blue-600 rounded-full" />
            <span className="text-lg font-semibold text-gray-800">Finalisation de l'affectation...</span>
          </div>
        </div>
      )}
    </div>
  );
}