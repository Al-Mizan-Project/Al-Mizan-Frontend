'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ValidatorList from '../../components/AffectationDossier/ValidatorList';
import { Validator, DossierInfo } from '../../types';
import { validationsApi } from '@/lib/api/validation';
import { contractantApi } from '@/lib/api/contractant';
import { acteursApi } from '@/lib/api/acteurs';
import { authApi } from '@/lib/api/auth';
import { useValidationAuth } from '../../context/ValidationAuthContext';
import '../../validation.css';

export default function AffectationDossierPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [validators, setValidators] = useState<Validator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { token, organisationId, isLoading: authLoading } = useValidationAuth();

  const dossierInfo: DossierInfo = {
    operateurEconomique: `Dossier #${params.id}`,
    operateur: 'Chargement...',
    delaisValidation: '10 jours',
    serviceContractant: 'Service Principal',
    domaine: 'Contrôle Interne',
    etapeValidation: 'Validation Interne',
  };

  useEffect(() => {
    async function loadCommissionMembers() {
      setIsLoading(true);
      try {
        const allUsers = await authApi.getUsers();

        const targetOrgId = organisationId || 30;
        const commMembres = await contractantApi.getCommissionInterneMembres(targetOrgId);

        if (!commMembres || commMembres.length === 0) {
          console.warn("Aucun membre trouvé pour la commission interne");
          setValidators([]);
          return;
        }

        const validatorList: Validator[] = await Promise.all(
          commMembres.map(async (link: any) => {
            try {
              const membreData = await acteursApi.getMembre(link.id_membre);
              const user = allUsers.find(u => u.id_membre === link.id_membre);

              return {
                id: String(user?.id_utilisateur || link.id_membre),
                nom: membreData.nom || 'Inconnu',
                prenom: membreData.prenom || '',
                matricule: `INT-${link.id_membre}`,
                chargeActuelle: 1,
                disponibilite: 'Disponible'
              };
            } catch (e) {
              return null;
            }
          })
        ).then(list => list.filter((v): v is Validator => v !== null));

        setValidators(validatorList);
      } catch (err) {
        console.error("Erreur chargement validateurs internes:", err);
        setSubmitError("Impossible de charger les membres de la commission interne.");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && token) {
      loadCommissionMembers();
    }
  }, [token, authLoading, organisationId]);

  const SOUMISSION_ID = params.id ? parseInt(params.id as string, 10) : 0;
  const ORGANISATION_ID = organisationId || 1;

  const handleConfirmAffectation = async (validatorId: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedValidator = validators.find(v => v.id === validatorId);

      if (!selectedValidator) {
        setSubmitError("Veuillez sélectionner un validateur.");
        setIsSubmitting(false);
        return;
      }

      await validationsApi.createValidation({
        id_utilisateur: Number(validatorId),
        id_organisation: ORGANISATION_ID,
        id_soumission: SOUMISSION_ID,
        type: 'interne',
        commentaire: `Affectation effectuée via le panel de commission interne.`,
        is_validated: false,
      });

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
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p className="font-medium">Erreur d'affectation</p>
          <p className="text-sm mt-1">{submitError}</p>
          <button
            onClick={() => setSubmitError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Fermer
          </button>
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
              <p className="val-dossier-info-label">Opérateur économique</p>
              <p className="val-dossier-info-value">
                {dossierInfo.operateur}
              </p>
            </div>
            <div className="val-dossier-info-item">
              <p className="val-dossier-info-label">Délais de validateur</p>
              <p className="val-dossier-info-value">
                {dossierInfo.delaisValidation}
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
              <p className="val-dossier-info-label">Domaine</p>
              <p className="val-dossier-info-value">
                {dossierInfo.domaine}
              </p>
            </div>
            <div className="val-dossier-info-item">
              <p className="val-dossier-info-label">Etape de validation</p>
              <p className="val-dossier-info-value">
                {dossierInfo.etapeValidation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4 border-4 border-t-transparent border-blue-600 rounded-full" />
          <p className="text-gray-500 font-medium">Chargement des experts de la commission...</p>
        </div>
      ) : (
        <ValidatorList
          validators={validators}
          onConfirm={handleConfirmAffectation}
          isReadOnly={false}
        />
      )}

      {isSubmitting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="val-body-medium">Affectation en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
}