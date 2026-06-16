'use client';

import { useState, useMemo } from 'react';
import DossiersFilters from '../../components/ToutLesDossiers/DossierFilters';
import FilesTable from '../dashboard/FilesTable';
import { fileRecord } from '@/app/[lang]/validation/types';
import { useCommissionUserAttributions } from '../../dashboard/commission/useCommissionAttributions';

interface HistoriqueValidationsViewProps {
  lang: string;
  dict?: any;
}

export default function HistoriqueValidationsView({ lang, dict }: HistoriqueValidationsViewProps) {
  const [filters, setFilters] = useState<any>({});
  const { appels, isLoading, error, refresh } = useCommissionUserAttributions();

  // Keep only 'Prêt' status
  const pretAppels = useMemo(() => {
    return appels.filter(appel => appel.status === 'Prêt');
  }, [appels]);

  const filteredData = useMemo(() => {
    return pretAppels.filter((item) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const refMatch = item.reference?.toLowerCase().includes(searchLower);
        const opMatch = item.economicOperator?.toLowerCase().includes(searchLower);
        if (!refMatch && !opMatch) {
          return false;
        }
      }
      return true;
    });
  }, [pretAppels, filters]);

  const hasResults = filteredData.length > 0;

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    console.log('Export historique:', filters);
  };

  const handleVoirDossier = (dossier: fileRecord) => {
    console.log('Voir dossier:', dossier.id);
    // TODO: Navigation vers les détails du dossier
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Erreur lors du chargement</h3>
        <p className="text-sm text-gray-500">{error}</p>
        <button onClick={refresh} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <DossiersFilters
        onFiltersChange={handleFiltersChange}
        hasResults={hasResults || isLoading}
        onExport={handleExport}
        showValidatorFilter={false} // Pas de filtre Validateur pour l'historique
        showExportButton={false}    // Pas de bouton Export
        showStatusFilter={false}    // Pas de filtre de statut
        viewType="dossiers"
      />

      {/* Tableau ou état vide */}
      {isLoading ? (
        <div className="p-10 text-center text-gray-500">Chargement de l'historique...</div>
      ) : hasResults ? (
        <div className="val-table-wrapper">
          <FilesTable
            data={filteredData}
            status="Prêt" 
            lang={lang}
            dict={dict}
            onView={handleVoirDossier}
            viewMode="standard"
          />
          {/* Pagination */}
          <div className="val-pagination-container">
            <button className="val-pagination-button" disabled>Previous</button>
            <div className="flex items-center gap-1">
              {[1].map((page, idx) => (
                <button
                  key={idx}
                  className={`val-pagination-button ${page === 1 ? 'val-pagination-button-active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button className="val-pagination-button" disabled>Next</button>
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