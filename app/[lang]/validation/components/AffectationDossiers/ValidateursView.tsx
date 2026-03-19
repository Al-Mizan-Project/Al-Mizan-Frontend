'use client';

import { useState, useMemo } from 'react';
import DossiersFilters from '../../components/ToutLesDossiers/DossierFilters';
import FilesTable from '../dashboard/FilesTable';
import { Validator, fileRecord } from '@/app/[lang]/validation/types';

interface ValidateursViewProps {
  lang: string;
  dict?: any;
}

export default function ValidateursView({ lang, dict }: ValidateursViewProps) {
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [activeTab, setActiveTab] = useState<'en-cours' | 'en-retard'>('en-cours');

  const MOCK_VALIDATORS: Validator[] = [
    {
      id: 'V-001',
      nom: 'Nom',
      prenom: 'Prénom',
      matricule: 'Matricule',
      chargeActuelle: 2,
      disponibilite: 'Indisponible',
    },
    {
      id: 'V-002',
      nom: 'Nom',
      prenom: 'Prénom',
      matricule: 'Matricule',
      chargeActuelle: 4,
      disponibilite: 'Indisponible',
    },
    {
      id: 'V-003',
      nom: 'Nom',
      prenom: 'Prénom',
      matricule: 'Matricule',
      chargeActuelle: 7,
      disponibilite: 'Recommandé',
    },
    {
      id: 'V-004',
      nom: 'Nom',
      prenom: 'Prénom',
      matricule: 'Matricule',
      chargeActuelle: 8,
      disponibilite: 'Conflit',
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

  const DOSSIERS_EN_COURS: fileRecord[] = [
    {
      id: 'REF-001',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-002',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-003',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-004',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-005',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-006',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-007',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-008',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-009',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-010',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation des Offres',
    },
  ];

  const DOSSIERS_EN_RETARD: fileRecord[] = [
    {
      id: 'REF-011',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      delayDays: 4,
      validationDeadline: '2026-02-31',
      status: 'En Retard',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-012',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      delayDays: 4,
      validationDeadline: '2026-02-31',
      status: 'En Retard',
      etape: 'Evaluation des Offres',
    },
  ];

  const handleFiltersChange = (newFilters: any) => {
    setFilters({ search: newFilters.search, status: newFilters.status });
  };

  const handleValidatorClick = (validator: Validator) => {
    setSelectedValidator(validator);
    setActiveTab('en-cours');
  };

  const handleBackToList = () => {
    setSelectedValidator(null);
  };

  const filteredValidators = useMemo(() => {
    return MOCK_VALIDATORS.filter((v) => {
      const matchSearch = !filters.search || 
        `${v.nom} ${v.prenom}`.toLowerCase().includes(filters.search.toLowerCase());
      const matchStatus = !filters.status || 
        v.disponibilite.toLowerCase() === filters.status.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [filters]);

  // Vue détaillée d'un validateur
  if (selectedValidator) {
    const dossiersToDisplay = activeTab === 'en-cours' ? DOSSIERS_EN_COURS : DOSSIERS_EN_RETARD;
    const tableStatus = activeTab === 'en-cours' ? 'En Cours' : 'En Retard';

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

        {/* En-tête du validateur */}
        <div className="val-dossier-info">
          <div className="flex items-center justify-between gap-8">
            {/* Colonne 1 : Validateur */}
            <div className="flex items-center gap-3">
              <div className="val-user-icon">
                <svg className="val-icon-24 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="val-body-medium">
                  {selectedValidator.nom} {selectedValidator.prenom}
                </p>
                <p className="val-small">{selectedValidator.matricule}</p>
              </div>
            </div>

            {/* Colonne 2 : Dossiers */}
            <div className="flex gap-4">
              <div>
                <p className="val-dossier-info-label">Dossiers En cours d'évaluation</p>
                <p className="val-dossier-info-value">
                  {DOSSIERS_EN_COURS.length}
                </p>
              </div>

              <div>
                <p className="val-dossier-info-label">Dossiers en Retard d'évaluation</p>
                <p className="val-dossier-info-value">
                  {DOSSIERS_EN_RETARD.length}
                </p>
              </div>
            </div>

            {/* Colonne 3 : Disponibilité */}
            <div>
              <p className="val-dossier-info-label">Disponibilité</p>
              <span
                className={`val-badge ${
                  selectedValidator.disponibilite === 'Disponible' ||
                  selectedValidator.disponibilite === 'Recommandé'
                    ? 'val-badge-available'
                    : selectedValidator.disponibilite === 'Conflit'
                    ? 'val-badge-conflict'
                    : 'val-badge-unavailable'
                }`}
              >
                <span className="val-badge-text">
                  {selectedValidator.disponibilite}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="val-tabs-container">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('en-cours')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'en-cours'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dossiers en cours
            </button>
            <button
              onClick={() => setActiveTab('en-retard')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'en-retard'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dossiers en retard
            </button>
          </div>
        </div>

        {/* Tableau des dossiers */}
       <div className="val-table-wrapper">
          <FilesTable
            data={dossiersToDisplay}
            status={tableStatus}
            lang={lang}
            dict={dict}
            viewMode="validateur" 
          />
        </div>
      </div>
    );
  }

  // Vue liste des validateurs
  return (
    <div>
      {/* Filtres adaptés pour Validateurs */}
      <DossiersFilters
        onFiltersChange={handleFiltersChange}
        hasResults={filteredValidators.length > 0}
        viewType="validateurs"
        showValidatorFilter={false}
        showExportButton={false}
      />

      {/* Liste des validateurs en mode readOnly avec clic */}
      <div className="val-table-container">
        <table className="val-table">
          <thead className="val-table-header">
            <tr>
              <th className="val-table-cell-left">Validateur ↓</th>
              <th className="val-table-cell-left">Dossiers En Cours ↓</th>
              <th className="val-table-cell-left">Dossiers En Retard ↓</th>
              <th className="val-table-cell-left">Disponibilité</th>
            </tr>
          </thead>
          <tbody className="val-validator-body">
            {filteredValidators.map((validator) => (
              <tr 
                key={validator.id} 
                className="val-validator-row"
                onClick={() => handleValidatorClick(validator)}
                style={{ cursor: 'pointer' }}
              >
                <td className="val-table-cell-left">
                  <div className="flex items-center gap-2">
                    <div className="val-user-icon">
                      <svg className="val-icon-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="val-body-medium">
                        {validator.nom} {validator.prenom}
                      </p>
                      <p className="val-small">{validator.matricule}</p>
                    </div>
                  </div>
                </td>
                <td className="val-table-cell-left val-body">
                  {validator.chargeActuelle}
                </td>
                <td className="val-table-cell-left val-body">
                  {validator.chargeActuelle > 5 ? Math.floor(validator.chargeActuelle / 3) : 0}
                </td>
                <td className="val-table-cell-right val-validator-availability">
                  <span className={`val-badge ${
                    validator.disponibilite === 'Disponible' || validator.disponibilite === 'Recommandé'
                      ? 'val-badge-available'
                      : validator.disponibilite === 'Conflit'
                      ? 'val-badge-conflict'
                      : 'val-badge-unavailable'
                  }`}>
                    <span className="val-badge-text">{validator.disponibilite}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="val-pagination-container">
        <button className="val-pagination-button" disabled>Previous</button>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5, '...', 11].map((page, idx) => (
            <button
              key={idx}
              className={`val-pagination-button ${page === 2 ? 'val-pagination-button-active' : ''}`}
              disabled={page === '...'}
            >
              {page}
            </button>
          ))}
        </div>
        <button className="val-pagination-button">Next</button>
      </div>
    </div>
  );
}