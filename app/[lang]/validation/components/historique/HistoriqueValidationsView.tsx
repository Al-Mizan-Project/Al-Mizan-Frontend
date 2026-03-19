'use client';

import { useState, useMemo } from 'react';
import DossiersFilters from '../../components/ToutLesDossiers/DossierFilters';
import FilesTable from '../dashboard/FilesTable';
import { fileRecord } from '@/app/[lang]/validation/types';

interface HistoriqueValidationsViewProps {
  lang: string;
  dict?: any;
}

export default function HistoriqueValidationsView({ lang, dict }: HistoriqueValidationsViewProps) {
  const [hasResults, setHasResults] = useState<boolean>(true);
  const [filters, setFilters] = useState<any>({});

  // Données de démonstration pour l'historique
  const MOCK_DATA: fileRecord[] = [
    {
      id: 'REF-001',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'Soumis',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-002',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-002', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'Soumis',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-003',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-003', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'Soumis',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-004',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-004', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'Soumis',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-005',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-005', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'Soumis',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-006',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-006', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'Soumis',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-007',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-007', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'Soumis',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-008',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-008', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'Soumis',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-009',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-009', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'Soumis',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-010',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-010', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'Soumis',
      etape: 'Evaluation des Offres',
    },
  ];

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    const hasText = !newFilters.search || newFilters.search.length > 0;
    setHasResults(hasText);
  };

  const handleExport = () => {
    console.log('Export historique:', filters);
  };

  const handleVoirDossier = (dossier: fileRecord) => {
    console.log('Voir dossier:', dossier.id);
    // TODO: Navigation vers les détails du dossier
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

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <DossiersFilters
        onFiltersChange={handleFiltersChange}
        hasResults={hasResults}
        onExport={handleExport}
        showValidatorFilter={false} // Pas de filtre Validateur pour l'historique
        showExportButton={false}    // Pas de bouton Export
        viewType="dossiers"
      />

      {/* Tableau ou état vide */}
      {hasResults && filteredData.length > 0 ? (
        <div className="val-table-wrapper">
          <FilesTable
            data={filteredData}
            status="En Cours" // Status temporaire pour l'affichage
            lang={lang}
            dict={dict}
            onAffecter={handleVoirDossier}
            viewMode="standard"
          />
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
        
      ) : (
        /* État vide */
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