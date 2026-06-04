'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload, faTimes } from '@fortawesome/free-solid-svg-icons';

interface FilterState {
  search: string;
  validateur: string;
  domaine: string;
  status: string;
  periode: string;
}

interface ActiveFilters {
  construction?: boolean;
  enCours?: boolean;
  enRetard?: boolean;
  enAttente?: boolean;
  pret?: boolean;
}

interface DossiersFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  hasResults: boolean;
  onExport?: () => void;
  showValidatorFilter?: boolean;
  showExportButton?: boolean;
  showStatusFilter?: boolean;
  viewType?: 'dossiers' | 'validateurs'; // nouvelle prop
}

export default function DossiersFilters({ 
  onFiltersChange, 
  hasResults,
  onExport,
  showValidatorFilter = true,
  showExportButton = true,
  showStatusFilter = true,
  viewType = 'dossiers'
}: DossiersFiltersProps) {

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    validateur: '',
    domaine: '',
    status: '',
    periode: '',
  });

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    const newFilters = { ...filters, search: newSearch };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);

    if (key === 'domaine' && value) {
      setActiveFilters((prev) => ({ ...prev, construction: true }));
    }
    if (key === 'status' && value) {
      setActiveFilters((prev) => ({ ...prev, enCours: true }));
    }
  };

  const removeActiveFilter = (filterKey: keyof ActiveFilters) => {
    setActiveFilters((prev) => ({ ...prev, [filterKey]: false }));

    if (filterKey === 'construction') {
      setFilters((prev) => ({ ...prev, domaine: '' }));
    }
    if (filterKey === 'enCours') {
      setFilters((prev) => ({ ...prev, status: '' }));
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      console.log('Export des dossiers...');
    }
  };

  return (
    <div className="val-dossiers-filters">

      {/* Ligne 1 */}
      <div className="val-filters-top-row">

        {/* Recherche */}
        <div className="val-search-container">
          <div className="val-search-input-wrapper">
            <FontAwesomeIcon icon={faSearch} className="val-search-icon" />
            <input
              type="text"
              placeholder={
                viewType === 'validateurs'
                  ? 'Rechercher un validateur'
                  : 'Rechercher'
              }
              value={filters.search}
              onChange={handleSearchChange}
              className="val-search-input"
            />
          </div>
        </div>

        {/* Dropdowns */}
        <div className="val-filters-dropdowns">

          {/* Validateur */}
          {showValidatorFilter && viewType !== 'validateurs' && (
            <select
              value={filters.validateur}
              onChange={(e) => handleFilterChange('validateur', e.target.value)}
              className="val-filter-select"
            >
              <option value="">Validateur</option>
              <option value="1">Nom Prénom 1</option>
              <option value="2">Nom Prénom 2</option>
            </select>
          )}

          {/* Domaine */}
          {viewType !== 'validateurs' && (
            <select
              value={filters.domaine}
              onChange={(e) => handleFilterChange('domaine', e.target.value)}
              className="val-filter-select"
            >
              <option value="">Domaine</option>
              <option value="construction">Construction</option>
              <option value="informatique">Informatique</option>
              <option value="sante">Santé</option>
            </select>
          )}

          {/* Status / Disponibilité */}
          {showStatusFilter && (
            viewType === 'validateurs' ? (
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="val-filter-select"
              >
                <option value="">Disponibilité</option>
                <option value="disponible">Disponible</option>
                <option value="recommande">Recommandé</option>
                <option value="conflit">Conflit</option>
                <option value="indisponible">Indisponible</option>
              </select>
            ) : (
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="val-filter-select"
              >
                <option value="">Status</option>
                <option value="en-cours">En Cours</option>
                <option value="en-retard">En Retard</option>
                <option value="en-attente">En Attente</option>
                <option value="pret">Prêt</option>
              </select>
            )
          )}

          {/* Période */}
          {viewType !== 'validateurs' && (
            <select
              value={filters.periode}
              onChange={(e) => handleFilterChange('periode', e.target.value)}
              className="val-filter-select"
            >
              <option value="">Période</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>
          )}
        </div>
      </div>

      {/* Ligne 2 (masquée pour validateurs) */}
      {viewType !== 'validateurs' &&
        (Object.values(activeFilters).some(Boolean) ||
          (hasResults && showExportButton)) && (
          <div className="val-filters-bottom-row">

            {Object.keys(activeFilters).length > 0 && (
              <div className="val-active-filters">
                {activeFilters.construction && (
                  <span className="val-filter-tag">
                    Construction
                    <button
                      onClick={() => removeActiveFilter('construction')}
                      className="val-filter-tag-remove"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </span>
                )}

                {activeFilters.enCours && (
                  <span className="val-filter-tag">
                    En Cours
                    <button
                      onClick={() => removeActiveFilter('enCours')}
                      className="val-filter-tag-remove"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {hasResults && showExportButton && (
              <button onClick={handleExport} className="val-export-button">
                <FontAwesomeIcon icon={faDownload} className="val-export-icon" />
                Exporter
              </button>
            )}
          </div>
        )}
    </div>
  );
}