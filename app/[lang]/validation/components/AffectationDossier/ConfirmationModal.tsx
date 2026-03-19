'use client';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  validatorName?: string;
  dossierReference?: string;
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  validatorName,
  dossierReference
}: ConfirmationModalProps) {
  // ✅ IMPORTANT : Retourner null si fermé
  if (!isOpen) return null;

  return (
    <div className="val-modal-overlay">
      <div className="val-modal-backdrop" onClick={onClose} />
      
      <div className="val-modal-content">
        <div className="val-modal-header">
          <h3 className="val-modal-title">
            {dossierReference 
              ? `Attribuer ${dossierReference} au Validateur`
              : 'Attribuer le Dossier au Validateur'
            }
          </h3>
          <button onClick={onClose} className="val-modal-close" aria-label="Fermer">
            <svg className="val-icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="val-modal-body">
          <p className="val-small val-text-gray-500 mt-2">
            Je confirme l'attribution du dossier au validateur
          </p>
        </div>
        
        <div className="val-modal-footer">
          <button onClick={onClose} className="val-modal-button val-modal-button-secondary">
            Annuler
          </button>
          <button onClick={onConfirm} className="val-modal-button val-modal-button-primary">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}