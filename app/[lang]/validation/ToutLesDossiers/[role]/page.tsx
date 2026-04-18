'use client';

import { useState, useMemo } from 'react';

import DossiersFilters from '../../components/ToutLesDossiers/DossierFilters';
import FilesTable from '../../components/dashboard/FilesTable';
import { fileRecord } from '../../types';

type UserRole = 'commission' | 'validator';

interface DossierPageProps {
  params: {
    lang: string;
    role: string;
  };
}

const MOCK_DATA: fileRecord[] = [
  {
    id: 'REF-001',
    reference: 'Référence Dossier 001',
    validator: { id: 'V-01', name: 'Nom Prénom' },
    economicOperator: 'Opérateur',
    assignmentDate: '2026-02-01',
    validationDeadline: '2026-02-31',
    status: 'En Cours',
    etape: 'Evaluation Administrative',
  },
  {
    id: 'REF-002',
    reference: 'Référence Dossier 002',
    validator: { id: 'V-02', name: 'Nom Prénom' },
    economicOperator: 'Opérateur',
    assignmentDate: '2026-02-01',
    validationDeadline: '2026-02-31',
    status: 'En Cours',
    etape: 'Evaluation des Offres',
  },
  {
    id: 'REF-003',
    reference: 'Référence Dossier 003',
    validator: { id: 'V-03', name: 'Nom Prénom' },
    economicOperator: 'Opérateur',
    assignmentDate: '2026-02-01',
    validationDeadline: '2026-02-31',
    status: 'En Retard',
    etape: 'Evaluation Administrative',
  },
];

export default function DossierPage({ params }: DossierPageProps) {

  const { lang, role } = params;

  const userRole = (role as UserRole) || 'validator';
  const isCommission = userRole === 'commission';

  const [hasResults, setHasResults] = useState<boolean>(true);
  const [currentStatus] = useState<'En Attente' | 'En Cours' | 'En Retard' | 'Prêt'>('En Cours');
  const [filters, setFilters] = useState<any>({});

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    const hasText = !newFilters.search || newFilters.search.length > 0;
    setHasResults(hasText);
  };

  const handleExport = () => {
    console.log('Export dossiers:', filters);
  };

  const filteredData = useMemo(() => {

    if (!hasResults) return [];

    return MOCK_DATA.filter((item) => {

       
      if (
        filters.search &&
        !item.reference.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

       
      if (!isCommission && item.validator?.id !== 'V-01') {
        return false;
      }

      return true;
    });

  }, [hasResults, filters, isCommission]);

  return (
    <div className="val-dossiers-page">

      { }
      <DossiersFilters
        onFiltersChange={handleFiltersChange}
        hasResults={hasResults}
        onExport={handleExport}
      />

      { }
      {hasResults && filteredData.length > 0 ? (

        <div className="val-table-wrapper">
          <FilesTable
            data={filteredData}
            status={currentStatus}
            lang={lang}
          />
        </div>

      ) : (

        <div className="val-empty-state">

          <div className="val-empty-icon">
            <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="val-empty-title">Aucun résultat trouvé</h2>

          <p className="val-empty-text">
            Nous n'avons trouvé aucun dossier correspondant à votre recherche.
          </p>

          <button
            onClick={() => {
              setFilters({});
              setHasResults(true);
            }}
            className="val-reset-button"
          >
            Réinitialiser les filtres
          </button>

        </div>

      )}

    </div>
  );
}