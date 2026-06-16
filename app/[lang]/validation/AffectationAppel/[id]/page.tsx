'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ValidatorList from '../../components/AffectationDossier/ValidatorList';
import { Validator, DossierInfo } from '../../types';
import { useAuth } from '@/contexts/AuthContext';
import { useAppels } from '@/contexts/AppelsContext';
import { appelsApi } from '@/lib/api/appels';
import '../../validation.css';

// ── Fonction pour extraire l'ID numérique ────────────────────────────────
function extractNumericId(value: any): number | null {
  if (!value) return null;
  
  if (typeof value === 'number') return value > 0 ? value : null;
  if (typeof value === 'string') {
    const num = parseInt(value.replace(/\D/g, ''), 10);
    return num > 0 ? num : null;
  }
  
  return null;
}

export default function AffectationAppelPage() {
  const router = useRouter();
  const params = useParams<{ lang?: string; id?: string }>();
  const lang = params?.lang || 'fr';
  const APPEL_ID = extractNumericId(params?.id);

  const { user, token } = useAuth();
  const { selectedAppel } = useAppels();

  const [validators, setValidators] = useState<Validator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dossierInfo, setDossierInfo] = useState<DossierInfo>({
    operateurEconomique: selectedAppel?.reference || `Appel #${APPEL_ID}`,
    operateur: selectedAppel?.economicOperator || 'Chargement...',
    delaisValidation: selectedAppel?.validationDeadline !== '-' ? selectedAppel?.validationDeadline || '7 jours' : '7 jours',
    serviceContractant: 'Chargement...',
    domaine: 'Commission',
    etapeValidation: 'Affectation des experts',
  });

  const [attributionId, setAttributionId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        if (!APPEL_ID || APPEL_ID <= 0) {
          console.warn('Invalid APPEL_ID:', APPEL_ID);
          setSubmitError('ID d\'appel invalide');
          setIsLoading(false);
          return;
        }

        // 1. Check if we have appel data from context (faster path)
        let appel: any = null;
        
        if (selectedAppel) {
          console.log('Using selectedAppel from context:', selectedAppel);
          appel = selectedAppel;
        } else {
          // Fallback: Get appel/contrat details via API
          console.log('Loading appel for APPEL_ID:', APPEL_ID);
          appel = await appelsApi.getAppelOffre(APPEL_ID);
        }

        let serviceId = appel.id_service_contractant;

        setDossierInfo(prev => ({
          ...prev,
          operateurEconomique: appel.reference || `Appel #${APPEL_ID}`,
          operateur: appel.titre || appel.economicOperator || `Appel ${APPEL_ID}`,
          serviceContractant: serviceId ? `Service #${serviceId}` : 'Service inconnu',
        }));

        // 2. Fetch experts for this specific appel using new endpoint
        let members: any[] = [];
        try {
          console.log('Fetching experts for appel ID:', APPEL_ID);
          members = await appelsApi.getAppelOffreExperts(APPEL_ID);
          console.log('Found', members.length, 'experts for appel', APPEL_ID);
        } catch (fetchError) {
          console.warn('Erreur chargement experts:', fetchError);
        }

        // Map experts to Validator format
        const mapped: Validator[] = (members || []).map(m => ({
          id: String(m.id_utilisateur || m.id_membre || m.id || m.user_id),
          nom: m.nom || m.lastName || m.lastname || 'Inconnu',
          prenom: m.prenom || m.firstName || m.firstname || '',
          matricule: m.matricule || `EXP-${m.id || m.id_membre || ''}`,
          chargeActuelle: m.charge_actuelle || 0,
          disponibilite: (m.charge_actuelle || 0) > 3 ? 'Surchargé' : 'Disponible',
        }));

        setValidators(mapped);

        if (mapped.length === 0) {
          console.warn('No experts found for appel', APPEL_ID);
          setSubmitError('Aucun expert disponible pour cette appel d\'offres. Veuillez vérifier vos permissions.');
        } else {
          console.log('Successfully loaded', mapped.length, 'experts');
        }

        setAttributionId(null);
      } catch (err) {
        console.error('Erreur chargement affectation:', err);
        setSubmitError(err instanceof Error ? err.message : 'Erreur chargement');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [APPEL_ID, token, user, selectedAppel]);

  const handleConfirmAffectation = async (validatorId: string) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Call the new unified endpoint: affecter-validateur
      // This endpoint handles both:
      // 1. Updating validated_by in appels_offres
      // 2. Creating a suivi entry in appels_offres_suivis
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
      const headers = {
        'Content-Type': 'application/json',
        ...(authHeaders ? authHeaders : {}),
      };

      const affectResp = await fetch(`/api/proxy/appels?path=appels-offres/${APPEL_ID}/affecter-validateur`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ validator_id: Number(validatorId) }),
      });

      if (!affectResp.ok) {
        const text = await affectResp.text();
        throw new Error(text || `Erreur ${affectResp.status}`);
      }

      // Success: redirect to commission dashboard
      router.push(`/${lang}/validation/dashboard/commission?status=En%20Cours`);
    } catch (err) {
      console.error('Erreur création affectation validateur:', err);
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
              <p className="val-dossier-info-label">Appel</p>
              <p className="val-dossier-info-value val-dossier-info-value-semibold">
                {dossierInfo.operateurEconomique}
              </p>
            </div>
            <div className="val-dossier-info-item">
              <p className="val-dossier-info-label">Titre</p>
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
          <p className="text-gray-500 font-medium">Chargement des membres de la commission...</p>
        </div>
      ) : validators.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-yellow-100">
          <p className="text-yellow-700 font-medium mb-2">Aucun validateur CDC disponible</p>
          <p className="text-sm text-gray-600">Impossible de charger les membres de la commission CDC. Veuillez vérifier votre connexion et vos permissions.</p>
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