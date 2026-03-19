'use client'; 

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Validator } from '../../types';
import ConfirmationModal from './ConfirmationModal';

interface ValidatorListProps {
  validators: Validator[];
  onConfirm?: (validatorId: string) => void;
  isReadOnly?: boolean; // nouvelle prop
}

export default function ValidatorList({ 
  validators, 
  onConfirm,
  isReadOnly = false
}: ValidatorListProps) {

  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const getAvailabilityBadgeClass = (disponibilite: string) => {
    switch (disponibilite) {
      case 'Recommandé':
      case 'Disponible':
        return 'val-badge-available';
      case 'Conflit':
        return 'val-badge-conflict';
      case 'Indisponible':
        return 'val-badge-unavailable';
      default:
        return 'val-badge-unavailable';
    }
  };

  const handleAssignClick = (validatorId: string) => {
    if (!isReadOnly && declarationAccepted) {
      setSelectedValidator(validatorId);
      setShowModal(true);
    }
  };

  const handleConfirm = () => {
    if (selectedValidator && onConfirm) {
      onConfirm(selectedValidator);
    }
    setShowModal(false);
  };

  return (
    <>
      <div className="val-table-container">
        <table className="val-table">
          <thead className="val-table-header">
            <tr>
              <th className="val-table-cell-left">Validateur ↓</th>

              {/* Colonnes dynamiques */}
              {!isReadOnly && (
                <th className="val-table-cell-left">Charge actuelle ↓</th>
              )}

              {isReadOnly && (
                <>
                  <th className="val-table-cell-left">Dossiers En Cours ↓</th>
                  <th className="val-table-cell-left">Dossiers En Retard ↓</th>
                </>
              )}

              <th className="val-table-cell-left">Disponibilité</th>
            </tr>
          </thead>

          <tbody className="val-validator-body">
            {validators.map((validator) => (
              <tr key={validator.id} className="val-validator-row">
                <td className="val-table-cell-left">
                  <div className="flex items-center gap-3">

                    {/* Radio masqué en mode consultation */}
                    {!isReadOnly && (
                      <input
                        type="radio"
                        name="validator"
                        value={validator.id}
                        checked={selectedValidator === validator.id}
                        onChange={() => setSelectedValidator(validator.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-600"
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <div className="val-user-icon">
                        <FontAwesomeIcon icon={faUser} className="val-icon-16 text-gray-500" />
                      </div>

                      <div>
                        <p className="val-body-medium">
                          {validator.nom} {validator.prenom}
                        </p>
                        <p className="val-small">{validator.matricule}</p>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Colonnes données */}
                {!isReadOnly && (
                  <td className="val-table-cell-left val-body">
                    {validator.chargeActuelle}
                  </td>
                )}

                {isReadOnly && (
                  <>
                    <td className="val-table-cell-left val-body">
                      {validator.chargeActuelle}
                    </td>

                    <td className="val-table-cell-left val-body">
                      {validator.chargeActuelle > 5
                        ? Math.floor(validator.chargeActuelle / 3)
                        : 0}
                    </td>
                  </>
                )}

                <td className="val-table-cell-right val-validator-availability">
                  <span className={`val-badge ${getAvailabilityBadgeClass(validator.disponibilite)}`}>
                    <span className="val-badge-text">
                      {validator.disponibilite}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section déclaration + bouton (masqués en readOnly) */}
      {!isReadOnly && (
        <>
          <div className="mt-6">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600"
              />

              <span className="val-body val-text-gray-700">
                Je déclare que cette affectation respecte les règles d'impartialité et d'absence de conflit d'intérêts
              </span>
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => selectedValidator && handleAssignClick(selectedValidator)}
              disabled={!selectedValidator || !declarationAccepted}
              className="val-file-details-button val-bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Affecter
            </button>
          </div>

          {showModal && (
            <ConfirmationModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              onConfirm={handleConfirm}
            />
          )}
        </>
      )}

      {/* Pagination uniquement pour consultation */}
      {isReadOnly && (
        <div className="val-pagination-container">
          <button className="val-pagination-button" disabled>
            Previous
          </button>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, '...', 11].map((page, idx) => (
              <button
                key={idx}
                className={`val-pagination-button ${
                  page === 2 ? 'val-pagination-button-active' : ''
                }`}
                disabled={page === '...'}
              >
                {page}
              </button>
            ))}
          </div>

          <button className="val-pagination-button">
            Next
          </button>
        </div>
      )}
    </>
  );
}