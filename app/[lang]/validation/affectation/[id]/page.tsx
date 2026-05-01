'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ValidatorList from '../../components/AffectationDossier/ValidatorList';
import { Validator, DossierInfo } from '../../types';
import { validationsApi } from '@/lib/api/validation';
import { contractantApi } from '@/lib/api/contractant';
import { acteursApi } from '@/lib/api/acteurs';
import { authApi } from '@/lib/api/auth';
import { soumissionsApi } from '@/lib/api/soumissions';
import { appelsApi } from '@/lib/api/appels';
import { useValidationAuth } from '../../context/ValidationAuthContext';
import '../../validation.css';

export default function AffectationDossierPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const SOUMISSION_ID = params.id ? parseInt(params.id as string, 10) : 0;

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

  const { token, isLoading: authLoading } = useValidationAuth();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // 1. Récupérer la soumission et l'appel d'offre
        const soumission = await soumissionsApi.getSoumission(SOUMISSION_ID);
        const ao = await appelsApi.getAppelOffre(soumission.id_appel_offre);
        const currentServiceId = ao.id_service_contractant;
        setServiceId(currentServiceId);

        setDossierInfo(prev => ({
          ...prev,
          operateur: `Soumission ${SOUMISSION_ID}`,
          serviceContractant: `Service ID: ${currentServiceId}`,
        }));

        // 2. Récupérer les données nécessaires pour la liste des validateurs
        const [serviceComms, allUsers, allActeurs, allValidations] = await Promise.all([
          contractantApi.getServiceCommissions(currentServiceId),
          authApi.getUsers(),
          acteursApi.getMembres(),
          validationsApi.getValidations()
        ]);

        const commissionsInternes = serviceComms.commissions_internes || [];
        
        // 3. Collecter les membres de la commission interne
        const commissionMembreIds = new Set<number>();
        for (const comm of commissionsInternes) {
          const links = await contractantApi.getCommissionInterneMembres(comm.id_comission_interne);
          links.forEach((l: any) => commissionMembreIds.add(l.id_membre));
        }

        // 4. Construire la liste des validateurs avec filtrage et calcul de charge
        const validatorList: Validator[] = [];

        allUsers.forEach(user => {
          // On ne garde que les utilisateurs qui sont membres de cette commission
          if (!commissionMembreIds.has(user.id_membre)) return;

          const membreData = allActeurs.find(m => m.id_membre === user.id_membre);
          
          // FILTRE : Exclure le Chef de commission / Président
          const fonction = (membreData?.fonction || '').toLowerCase();
          if (fonction.includes('chef') || fonction.includes('président') || fonction.includes('president')) {
            return;
          }

          // CALCUL DE CHARGE : Compter les validations non terminées pour cet utilisateur
          const charge = allValidations.filter(v => 
            v.id_utilisateur === user.id_utilisateur && !v.is_validated
          ).length;

          validatorList.push({
            id: String(user.id_utilisateur), // On utilise bien l'ID UTILISATEUR pour l'affectation
            nom: membreData?.nom || 'Inconnu',
            prenom: membreData?.prenom || '',
            matricule: `EXP-${user.id_utilisateur}`,
            chargeActuelle: charge,
            disponibilite: charge > 3 ? 'Surchargé' : 'Disponible'
          });
        });

        setValidators(validatorList);

      } catch (err) {
        console.error("Erreur chargement données affectation:", err);
        setSubmitError("Impossible de charger les experts. Vérifiez la connexion au service.");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && SOUMISSION_ID) {
      loadData();
    }
  }, [authLoading, SOUMISSION_ID]);

  const handleConfirmAffectation = async (validatorId: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Création de la validation pour l'expert choisi
      await validationsApi.createValidation({
        id_utilisateur: Number(validatorId),
        id_soumission: SOUMISSION_ID,
        type: 'interne',
        commentaire: `Dossier affecté pour expertise.`,
        is_validated: false,
      });

      // Redirection vers le dashboard commission
      router.push(`/fr/validation/dashboard/commission?status=En%20Cours`);

    } catch (err) {
      console.error('Erreur création validation:', err);
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