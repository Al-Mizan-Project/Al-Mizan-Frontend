'use client';

import { useState, useMemo } from 'react';
import DossiersFilters from '../../components/ToutLesDossiers/DossierFilters';
import FilesTable from '../dashboard/FilesTable';
import ValidatorList from '../AffectationDossier/ValidatorList';
import { fileRecord, Validator } from '@/app/[lang]/validation/types';

interface EnAttenteViewProps {
  lang: string;
  dict?: any;
}

// Données de démonstration pour les validateurs
const MOCK_VALIDATORS: Validator[] = [
  {
    id: 'V-001',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 2,
    disponibilite: 'Recommandé',
  },
  {
    id: 'V-002',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 4,
    disponibilite: 'Conflit',
  },
  {
    id: 'V-003',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 7,
    disponibilite: 'Indisponible',
},
  {
    id: 'V-004',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 8,
    disponibilite: 'Indisponible',
  },
  {
    id: 'V-005',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 12,
    disponibilite: 'Indisponible',
  },
  {
    id: 'V-006',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 14,
    disponibilite: 'Indisponible',
  },
];

export default function EnAttenteView({ lang, dict }: EnAttenteViewProps) {
  const [hasResults, setHasResults] = useState<boolean>(true);
  const [filters, setFilters] = useState<any>({});
  
  // État pour gérer l'affichage de la vue d'affectation
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [selectedDossier, setSelectedDossier] = useState<fileRecord | null>(null);

  // Données de démonstration pour "En Attente"
  const MOCK_DATA: fileRecord[] = [
    {
      id: 'REF-001',
      reference: 'Référence Dossier ID',
      economicOperator: 'Opérateur',
      submissionDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Attente',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-002',
      reference: 'Référence Dossier ID',
      economicOperator: 'Opérateur',
      submissionDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Attente',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-003',
      reference: 'Référence Dossier ID',
      economicOperator: 'Opérateur',
      submissionDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Attente',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-004',
      reference: 'Référence Dossier ID',
      economicOperator: 'Opérateur',
      submissionDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Attente',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-005',
      reference: 'Référence Dossier ID',
      economicOperator: 'Opérateur',
      submissionDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Attente',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-006',
      reference: 'Référence Dossier ID',
      economicOperator: 'Opérateur',
      submissionDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Attente',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-007',
      reference: 'Référence Dossier ID',
      economicOperator: 'Opérateur',
      submissionDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Attente',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-008',
      reference: 'Référence Dossier ID',
      economicOperator: 'Opérateur',
      submissionDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Attente',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-009',
      reference: 'Référence Dossier ID',
      economicOperator: 'Opérateur',
      submissionDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Attente',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-010',
      reference: 'Référence Dossier ID',
      economicOperator: 'Opérateur',
      submissionDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Attente',
      etape: 'Evaluation des Offres',
    },
  ];

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    const hasText = !newFilters.search || newFilters.search.length > 0;
    setHasResults(hasText);
  };

  const handleExport = () => {
    console.log('Export des dossiers En Attente:', filters);
  };

  // Gestion du clic sur le bouton "Affecter"
  const handleAffecterClick = (dossier: fileRecord) => {
    setSelectedDossier(dossier);
    setIsAssigning(true);
  };

  // Retour à la liste des dossiers
  const handleBackToList = () => {
    setIsAssigning(false);
    setSelectedDossier(null);
  };

  // Gestion de la confirmation d'affectation
  const handleConfirmAssignment = (validatorId: string) => {
    console.log(`Dossier ${selectedDossier?.id} affecté au validateur ${validatorId}`);
    // TODO: Appel API pour mettre à jour le dossier
    setIsAssigning(false);
    setSelectedDossier(null);
    // Optionnel: Rafraîchir les données
  };

  const filteredData = useMemo(() => {
    if (!hasResults) return [];
    return MOCK_DATA.filter((item) => {
      if (filters.search && !item.reference.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [hasResults, filters]);

  // Vue d'affectation (formulaire de sélection de validateur)
  if (isAssigning && selectedDossier) {
    return (
      <div className="space-y-6">
        {/* Bouton retour */}
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à la liste
        </button>

        {/* Informations du dossier */}
        <div className="val-dossier-info">
          <div className="val-dossier-info-grid">
            <div className="val-dossier-info-column">
              <div className="val-dossier-info-item">
                <p className="val-dossier-info-label">Dossier</p>
                <p className="val-dossier-info-value val-dossier-info-value-semibold">
                  {selectedDossier.reference}
                </p>
              </div>
              <div className="val-dossier-info-item">
                <p className="val-dossier-info-label">Opérateur économique</p>
                <p className="val-dossier-info-value">
                  {selectedDossier.economicOperator}
                </p>
              </div>
              <div className="val-dossier-info-item">
                <p className="val-dossier-info-label">Délais de validateur</p>
                <p className="val-dossier-info-value">
                  {selectedDossier.validationDeadline}
                </p>
              </div>
            </div>
            
            <div className="val-dossier-info-column">
              <div className="val-dossier-info-item">
                <p className="val-dossier-info-label">Service Contractant</p>
                <p className="val-dossier-info-value">
                  Service Contractant
                </p>
              </div>
              <div className="val-dossier-info-item">
                <p className="val-dossier-info-label">Domaine</p>
                <p className="val-dossier-info-value">
                  Domaine
                </p>
              </div>
              <div className="val-dossier-info-item">
                <p className="val-dossier-info-label">Etape de validation</p>
                <p className="val-dossier-info-value">
                  {selectedDossier.etape}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des validateurs */}
        <ValidatorList 
          validators={MOCK_VALIDATORS}
          onConfirm={handleConfirmAssignment}
        />
      </div>
    );
  }

  // Vue normale (tableau des dossiers)
  return (
    <div>
      {/* Filtres sans le filtre Validateur */}
      <DossiersFilters
        onFiltersChange={handleFiltersChange}
        hasResults={hasResults}
        onExport={handleExport}
        showValidatorFilter={false}
        showExportButton={false}
      />

      {/* Tableau ou état vide */}
      {hasResults && filteredData.length > 0 ? (
        <div className="val-table-wrapper">
          <FilesTable
            data={filteredData}
            status="En Attente"
            lang={lang}
            dict={dict}
            onAffecter={handleAffecterClick}
          />
        </div>
      ) : (
        <div className="val-empty-state">
          <div className="val-empty-icon">
            <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16 8l2-2" 
              />
            </svg>
          </div>
          <h2 className="val-empty-title">Aucun résultat trouvé</h2>
          <p className="val-empty-text">
            Nous n'avons trouvé aucun article correspondant à votre recherche.
          </p>
          <button
            onClick={() => {
              setFilters({});
              setHasResults(true);
            }}
            className="val-reset-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}