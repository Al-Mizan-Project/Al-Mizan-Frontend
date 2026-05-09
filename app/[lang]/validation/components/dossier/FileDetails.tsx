'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validationsApi } from '@/lib/api/validation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faPaperPlane,
  faFileDownload,
  faCheck,
  faTimes,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';

type TabType = 'financial' | 'technical' | 'call' | 'reports' | 'decision';
type ReportSubTab = 'administrative' | 'offers';
type DecisionSubTab = 'general' | 'commission' | 'technical' | 'conclusion';
type UserRole = 'commission' | 'validator';
type DecisionType = 'retenu' | 'rejete' | 'retenu_reserve';

interface FieldData {
  label: string;
  value: string;
}

interface TabData {
  fields: FieldData[];
}

interface FileDetailsProps {
  activeTab: TabType;
  dict?: {
    common?: {
      actions?: {
        download?: string;
        transmit?: string;
      };
    };
  };
  lang?: string;
  role?: UserRole;
  onDownload?: (url: string) => void;
  onTransmit?: () => void;
  renderDocumentViewer?: (url?: string) => React.ReactNode;
  data?: any;
}

const tabData: Record<TabType, TabData> = {
  financial: { fields: [{ label: 'Dossier', value: 'Référence dossier ID' }, { label: 'Opérateur économique', value: 'Opérateur' }, { label: 'Délais de validation', value: '2026-02-31' }, { label: 'Service Contractant', value: 'Service Contractant' }, { label: 'Evaluateur', value: 'Nom Prénom' }, { label: 'Domaine', value: 'Domaine' }, { label: 'Etape de validation', value: 'Evaluation des Offres' }, { label: 'Document', value: 'Offre financière' }, { label: 'Status', value: 'En attente' },] },
  technical: { fields: [{ label: 'Dossier', value: 'Référence dossier ID' }, { label: 'Opérateur économique', value: 'Opérateur' }, { label: 'Délais de validation', value: '2026-02-31' }, { label: 'Service Contractant', value: 'Service Contractant' }, { label: 'Evaluateur', value: 'Nom Prénom' }, { label: 'Domaine', value: 'Domaine' }, { label: 'Etape de validation', value: 'Evaluation des Offres' }, { label: 'Document', value: 'Offre technique' }, { label: 'Status', value: 'En attente' },] },
  call: { fields: [{ label: 'Dossier', value: 'Référence dossier ID' }, { label: 'Service Contractant', value: 'Service Contractant' }, { label: 'Domaine', value: 'Domaine' }, { label: 'Etape de validation', value: 'Validation externe' }, { label: 'Document', value: 'Cahier des charges' },] },
  reports: { fields: [{ label: 'Dossier', value: 'Référence dossier ID' }, { label: 'Opérateur économique', value: 'Opérateur' }, { label: 'Service Contractant', value: 'Service Contractant' }, { label: 'Domaine', value: 'Domaine' }, { label: 'Document', value: "Rapport d'évaluation" }, { label: 'Status', value: 'Prêt' },] },
  decision: { fields: [{ label: 'Dossier', value: 'Référence dossier ID' }, { label: 'Opérateur économique', value: 'Opérateur' }, { label: 'Service Contractant', value: 'Service Contractant' }, { label: 'Domaine', value: 'Domaine' }, { label: 'Document', value: "Rapport d'évaluation" }, { label: 'Status', value: 'Prêt' },] },
};

const reportSubTabData: Record<ReportSubTab, TabData> = {
  administrative: { fields: [{ label: 'Dossier', value: 'Référence dossier ID' }, { label: 'Opérateur économique', value: 'Opérateur' }, { label: 'Service Contractant', value: 'Service Contractant' }, { label: 'Domaine', value: 'Domaine' }, { label: 'Document', value: "Rapport d'évaluation administrative" }, { label: 'Status', value: 'Prêt' },] },
  offers: { fields: [{ label: 'Dossier', value: 'Référence dossier ID' }, { label: 'Opérateur économique', value: 'Opérateur' }, { label: 'Délais de validation', value: '2026-02-31' }, { label: 'Service Contractant', value: 'Service Contractant' }, { label: 'Validateur', value: 'Nom Prénom' }, { label: 'Domaine', value: 'Domaine' }, { label: 'Etape de validation', value: 'Validation Externe' }, { label: 'Document', value: "Rapport d'évaluation" }, { label: 'Status', value: 'Prêt' },] }
};

// Données pour les sous-onglets de Décision (Validateur)
const decisionSubTabData: Record<DecisionSubTab, TabData> = {
  general: {
    fields: [
      { label: 'Dossier', value: 'Référence Dossier ID' },
      { label: 'Opérateur économique', value: 'Opérateur' },
      { label: 'Service Contractant', value: 'Service Contractant' },
      { label: 'Domaine', value: 'Domaine' },
      { label: 'Date de soumission', value: '2026-02-01' },
      { label: 'Date limite', value: '2026-02-31' },
    ]
  },
  commission: { fields: [] },
  technical: { fields: [] },
  conclusion: { fields: [] }
};

export default function FileDetails({
  activeTab,
  dict,
  lang,
  role = 'commission',
  onDownload,
  onTransmit,
  renderDocumentViewer,
  data
}: FileDetailsProps) {
  const [activeReportSubTab, setActiveReportSubTab] = useState<ReportSubTab>('administrative');
  const [activeDecisionSubTab, setActiveDecisionSubTab] = useState<DecisionSubTab>('general');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFinancialConform, setIsFinancialConform] = useState(true);
  const [isAbnormallyLow, setIsAbnormallyLow] = useState(false);
  const [isTechnicalConform, setIsTechnicalConform] = useState(true);

  // États pour Conclusion et Décision
  const [decision, setDecision] = useState<DecisionType>('retenu_reserve');
  const [motivation, setMotivation] = useState('');
  const [avisFinal, setAvisFinal] = useState('');
  const [isCertified, setIsCertified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(true);

  const isAr = lang === 'ar';
  const isCommission = role === 'commission';
  const isValidator = role === 'validator';
  const isDecisionTab = activeTab === 'decision';
  const isReportsTab = activeTab === 'reports';

  const shouldShowDocumentViewer = activeTab !== 'decision' || (activeTab === 'decision' && activeDecisionSubTab === 'general');
  const validatorNoButtons = isValidator && activeTab === 'call';
  const validatorDownloadOnly = isValidator && (activeTab === 'financial' || activeTab === 'technical');
  const validatorReportsDownloadOnly = isValidator && activeTab === 'reports';
  const validatorFullButtons = isValidator && activeTab === 'decision';

  const getData = () => {
    if (!data) return { fields: [] };
    const { soumission, appelOffre, evaluations, validations, documents } = data;

    // Helper to find a document by name or type
    const findDoc = (type: string) => {
      return documents?.find((d: any) => d.type_document?.toLowerCase().includes(type.toLowerCase()) || d.nom?.toLowerCase().includes(type.toLowerCase()));
    };

    const financialDoc = findDoc('financiere');
    const technicalDoc = findDoc('technique');
    const aoDoc = findDoc('cahier');

    const commonFields = [
      { label: 'Dossier', value: `AO-${appelOffre?.id_appel_offres}-${soumission?.id_soumission}` },
      { label: 'Opérateur économique', value: `Opérateur #${soumission?.id_soumissionnaire}` },
      { label: 'Service Contractant', value: `Service #${appelOffre?.id_service_contractant}` },
      { label: 'Domaine', value: appelOffre?.titre || 'Non spécifié' },
    ];

    if (activeTab === 'financial') {
      return {
        fields: [
          ...commonFields,
          { label: 'Document', value: 'Offre financière' },
          { label: 'URL', value: soumission?.offre_financiere_chiffree_url || 'Non disponible' },
          { label: 'Status', value: soumission?.statut }
        ]
      };
    }

    if (activeTab === 'technical') {
      return {
        fields: [
          ...commonFields,
          { label: 'Document', value: technicalDoc?.nom || 'Offre technique' },
          { label: 'URL', value: technicalDoc?.storage_url || 'Non disponible' },
          { label: 'Status', value: soumission?.statut }
        ]
      };
    }

    if (activeTab === 'call') {
      return {
        fields: [
          { label: 'Dossier', value: appelOffre?.reference },
          { label: 'Titre', value: appelOffre?.titre },
          { label: 'Document', value: 'Cahier des charges' },
          { label: 'URL', value: aoDoc?.storage_url || 'Non disponible' }
        ]
      };
    }

    if (isReportsTab) {
      const type = activeReportSubTab === 'administrative' ? 'administrative' : 'technique';
      const evalItem = evaluations?.find((e: any) => e.type === type);
      return {
        fields: [
          ...commonFields,
          { label: 'Type Rapport', value: activeReportSubTab === 'administrative' ? 'Administratif' : 'Technique' },
          { label: 'Note', value: evalItem ? `${evalItem.note}/100` : 'Non évalué' },
          { label: 'Commentaire', value: evalItem?.commentaire || 'Aucun' }
        ]
      };
    }

    if (activeTab === 'decision') {
      const validation = validations?.[0];
      return {
        fields: [
          ...commonFields,
          { label: 'Statut Validation', value: validation?.is_validated ? 'Validé' : 'En attente/Rejeté' },
          { label: 'Commentaire', value: validation?.commentaire || 'Aucun' }
        ]
      };
    }

    return { fields: [] };
  };

  const currentData = getData();

  const handleDownload = () => {
    const urlField = currentData.fields.find(f => f.label === 'URL');
    if (urlField && urlField.value !== 'Non disponible') {
      onDownload?.(urlField.value);
    } else {
      alert('Document non disponible pour le téléchargement');
    }
  };


  // ============================================
  // COMPOSANT: Contenu "Conclusion et Décision"
  // ============================================
  const renderConclusionContent = () => (
    <div className="space-y-6">
      {/* Informations générales */}
      <div className="val-conclusion-summary">
        <div className="val-summary-grid">
          <div className="val-summary-item">
            <span className="val-summary-label">Dossier</span>
            <span className="val-summary-value">Référence dossier ID</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Opérateur économique</span>
            <span className="val-summary-value">Opérateur</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Score financière</span>
            <span className="val-summary-value">0/100</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Score technique</span>
            <span className="val-summary-value">0/100</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Service Contractant</span>
            <span className="val-summary-value">Service Contractant</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Domaine</span>
            <span className="val-summary-value">Domaine</span>
          </div>
        </div>
      </div>

      {/* Décision finale */}
      <div className="val-decision-section">
        <h3 className="val-section-title">Décision finale</h3>

        <div className="val-conformity-box">
          <div className="val-field-label mb-3">Décision</div>
          <div className="val-radio-group">
            <label className="val-radio-item">
              <input
                type="radio"
                name="decision"
                value="retenu"
                checked={decision === 'retenu'}
                onChange={(e) => setDecision(e.target.value as DecisionType)}
              />
              <span>Dossier retenu</span>
            </label>
            <label className="val-radio-item">
              <input
                type="radio"
                name="decision"
                value="rejete"
                checked={decision === 'rejete'}
                onChange={(e) => setDecision(e.target.value as DecisionType)}
              />
              <span>Dossier rejeté</span>
            </label>
            <label className="val-radio-item">
              <input
                type="radio"
                name="decision"
                value="retenu_reserve"
                checked={decision === 'retenu_reserve'}
                onChange={(e) => setDecision(e.target.value as DecisionType)}
              />
              <span>Dossier retenu sous réserve</span>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <div className="val-field-label mb-2">Motivation de la décision</div>
          <textarea
            className="val-textarea"
            placeholder="Tapez ici ..."
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            rows={4}
          />
        </div>

        <div className="mt-6">
          <div className="val-field-label mb-2">Avis final de l'évaluateur</div>
          <textarea
            className="val-textarea"
            placeholder="Tapez ici ..."
            value={avisFinal}
            onChange={(e) => setAvisFinal(e.target.value)}
            rows={4}
          />
        </div>
      </div>

      {/* Certification */}
      <div className="val-certification-section">
        <label className="val-checkbox-label">
          <input
            type="checkbox"
            checked={isCertified}
            onChange={(e) => setIsCertified(e.target.checked)}
          />
          <span>Je certifie que cette décision est fondée sur une évaluation objective, conforme aux règles en vigueur, et dûment motivée</span>
        </label>
      </div>

      {/* Bouton Marquer comme prêt */}
      <div className="val-action-buttons">
        <button
          onClick={() => setShowModal(true)}
          disabled={!isCertified}
          className={`val-btn-primary ${!isCertified ? 'val-btn-disabled' : ''}`}
        >
          Marquer comme prêt
        </button>
      </div>

      {/* Modal de confirmation */}
      {showModal && (
        <div className="val-modal-overlay">
          <div className="val-modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="val-modal-content">
            <div className="val-modal-header">
              <h3 className="val-modal-title">Marquer le dossier comme pret</h3>
              <button
                onClick={() => setShowModal(false)}
                className="val-modal-close"
              >
                ×
              </button>
            </div>

            <div className="val-modal-body">
              <p>Je confirme le signalement au chef que ce dossier est pret</p>
            </div>

            <div className="val-modal-footer">
              <button
                onClick={() => setShowModal(false)}
                className="val-btn-secondary"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  // Récupérer l'ID utilisateur à partir du token (comme dans le contexte)
                  let currentUserId = null;
                  try {
                    const storedToken = localStorage.getItem('access_token') || localStorage.getItem('authToken');
                    if (storedToken) {
                      const base64Url = storedToken.split('.')[1];
                      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                      const decoded = JSON.parse(window.atob(base64));
                      currentUserId = decoded.user_id || decoded.id;
                    }
                  } catch (e) {
                    console.error("Erreur décodage token:", e);
                  }

                  const validationId = data?.validations?.find((v: any) =>
                    Number(v.id_utilisateur) === Number(currentUserId)
                  )?.id_validation;

                  if (!validationId) {
                    alert("Aucune affectation trouvée pour votre compte sur ce dossier.");
                    return;
                  }

                  setIsSubmitting(true);
                  try {
                    // Construction du libellé de décision
                    const decisionLabels: Record<string, string> = {
                      'retenu': 'Dossier retenu',
                      'rejete': 'Dossier rejeté',
                      'retenu_reserve': 'Dossier retenu sous réserve'
                    };

                    const motivationPart = motivation ? `Motivation: ${motivation}` : '';
                    const avisPart = avisFinal ? `Avis final: ${avisFinal}` : '';
                    const fullComment = `${decisionLabels[decision] || 'Décision prise'}. ${motivationPart}. ${avisPart}`.trim();

                    // Dans tous les cas (retenu ou rejeté), on marque l'affectation comme TERMINEE (is_validated = True)
                    // La décision réelle est portée par le commentaire.
                    await validationsApi.approveValidation(validationId, fullComment);
                    
                    setShowModal(false);
                    router.push(`/${lang}/validation/dashboard/validator`);
                  } catch (err: any) {
                    console.error("Erreur validation détaillée:", err);
                    alert(`Erreur: ${err.message || "Une erreur est survenue"}`);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className={`val-btn-primary ${isSubmitting ? 'opacity-50 cursor-wait' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCommissionContent = () => (
    <div className="space-y-6">
      <div className="val-decision-section">
        <h3 className="val-section-title">Contexte Financier</h3>
        <div className="val-context-grid">
          <div>
            <div className="val-field-row">
              <span className="val-field-label">Montant total</span>
              <span className="val-field-value">12 500 000.00</span>
            </div>
            <div className="val-field-row">
              <span className="val-field-label">Devise</span>
              <span className="val-field-value">DZD</span>
            </div>
            <div className="val-field-row">
              <span className="val-field-label">Domaine</span>
              <span className="val-field-value">Domaine</span>
            </div>
          </div>
          <div>
            <div className="val-field-row">
              <span className="val-field-label">Lot 01</span>
              <span className="val-field-value">Fourniture équipements</span>
            </div>
            <div className="val-field-row">
              <span className="val-field-label">Lot 02</span>
              <span className="val-field-value">Installation & mise en service</span>
            </div>
          </div>
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Conformité Financière</h3>
        <div className="val-conformity-box">
          <div className="val-toggle-row">
            <span className="val-toggle-label">Conformité de l'offre financière</span>
            <label className="val-toggle-switch">
              <input
                type="checkbox"
                checked={isFinancialConform}
                onChange={(e) => setIsFinancialConform(e.target.checked)}
              />
              <span className="val-toggle-slider"></span>
            </label>
            <span className={`val-toggle-status ${isFinancialConform ? 'val-conform' : 'val-non-conform'}`}>
              {isFinancialConform ? 'Conforme' : 'Non conforme'}
            </span>
          </div>

          {!isFinancialConform && (
            <div className="val-non-conform-reasons mt-4">
              <div className="val-field-label mb-2">Motif de non conformité</div>
              <div className="val-checkbox-group">
                <label className="val-checkbox-item">
                  <input type="checkbox" defaultChecked />
                  <span>Erreur de calcul</span>
                </label>
                <label className="val-checkbox-item">
                  <input type="checkbox" defaultChecked />
                  <span>Pièce manquante</span>
                </label>
                <label className="val-checkbox-item">
                  <input type="checkbox" defaultChecked />
                  <span>Incohérence des montants</span>
                </label>
                <label className="val-checkbox-item">
                  <input type="checkbox" defaultChecked />
                  <span>Autre</span>
                </label>
              </div>
              <div className="mt-3">
                <div className="val-field-label mb-2">Détails du motif</div>
                <textarea
                  className="val-textarea"
                  placeholder="Tapez ici ..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Conformité Financière</h3>
        <div className="val-conformity-details">
          <div className="val-field-row">
            <span className="val-field-label">Montant global proposé</span>
            <span className="val-field-value">12 500 000.00 DZD</span>
          </div>

          <div className="mt-4">
            <div className="val-field-label mb-2">Cohérence du montant par rapport au marché</div>
            <div className="val-radio-group">
              <label className="val-radio-item">
                <input type="radio" name="coherence" value="faible" />
                <span>Faible</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="coherence" value="moyenne" />
                <span>Moyenne</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="coherence" value="elevee" defaultChecked />
                <span>Élevée</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <div className="val-field-label mb-2">Justification de l'appréciation</div>
            <textarea
              className="val-textarea"
              placeholder="Comparer le montant proposé aux références disponibles et justifier l'appréciation ..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Offre anormalement basse</h3>
        <div className="val-conformity-box">
          <div className="val-toggle-row">
            <span className="val-toggle-label">Offre potentiellement anormalement basse</span>
            <label className="val-toggle-switch">
              <input
                type="checkbox"
                checked={isAbnormallyLow}
                onChange={(e) => setIsAbnormallyLow(e.target.checked)}
              />
              <span className="val-toggle-slider"></span>
            </label>
            <span className={`val-toggle-status ${isAbnormallyLow ? 'val-non-conform' : 'val-conform'}`}>
              {isAbnormallyLow ? 'Oui' : 'Non'}
            </span>
          </div>

          {isAbnormallyLow && (
            <div className="mt-4">
              <div className="val-field-label mb-2">Analyse détaillée</div>
              <textarea
                className="val-textarea"
                placeholder="Tapez ici ..."
                rows={3}
              />
            </div>
          )}
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Score financier</h3>
        <div className="val-score-table">
          <div className="val-score-header">Calcul du score</div>
          <table className="val-table">
            <thead>
              <tr>
                <th>Critère</th>
                <th>Score Maximal</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Méthodologie</td>
                <td>20</td>
                <td><input type="text" className="val-input-small" placeholder="Tapez ici ..." /></td>
              </tr>
              <tr>
                <td>Équipe</td>
                <td>40</td>
                <td><input type="text" className="val-input-small" placeholder="Tapez ici ..." /></td>
              </tr>
              <tr>
                <td>Moyens matériels</td>
                <td>15</td>
                <td><input type="text" className="val-input-small" placeholder="Tapez ici ..." /></td>
              </tr>
            </tbody>
          </table>
          <div className="val-score-total">
            Score totale calculé &nbsp; <span className="val-score-value">0/100</span>
          </div>
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Synthèse financière</h3>
        <div className="val-synthesis-box">
          <div className="val-field-label mb-2">Sur la base de l'analyse effectuée, l'offre financière est jugée</div>
          <textarea
            className="val-textarea"
            placeholder="Tapez ici ..."
            rows={3}
          />

          <div className="mt-4">
            <div className="val-field-label mb-2">Les éléments déterminants ayant conduit à cette évaluation sont</div>
            <textarea
              className="val-textarea"
              placeholder="Tapez ici ..."
              rows={3}
            />
          </div>

          <div className="mt-4">
            <div className="val-field-label mb-2">Avis financier</div>
            <div className="val-radio-group">
              <label className="val-radio-item">
                <input type="radio" name="avis" value="favorable" />
                <span>Favorable</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="avis" value="defavorable" />
                <span>Défavorable</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="avis" value="reserve" defaultChecked />
                <span>Réservé</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="val-analysis-help border rounded-xl overflow-hidden shadow-sm transition-all duration-300">
        <button
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          type="button"
        >
          <h3 className="val-section-title !mb-0">Aide à l'analyse</h3>
          <FontAwesomeIcon icon={isHelpOpen ? faChevronUp : faChevronDown} className="text-gray-500" />
        </button>

        {isHelpOpen && (
          <div className="p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
            <div className="val-help-section">
              <h4 className="val-help-title">Vérification de conformité du document</h4>
              <div className="val-help-status val-conform">Conforme</div>
              <ul className="val-checklist">
                <li className="val-check-item val-check-pass">
                  <FontAwesomeIcon icon={faCheck} className="val-check-icon" />
                  Présence des sections obligatoires
                </li>
                <li className="val-check-item val-check-fail">
                  <FontAwesomeIcon icon={faTimes} className="val-check-icon" />
                  Respect du format exigé
                </li>
                <li className="val-check-item val-check-pass">
                  <FontAwesomeIcon icon={faCheck} className="val-check-icon" />
                  Cohérence avec le cahier des charges
                </li>
                <li className="val-check-item val-check-pass">
                  <FontAwesomeIcon icon={faCheck} className="val-check-icon" />
                  Présence des pièces techniques requises
                </li>
              </ul>
            </div>

            <div className="val-help-section">
              <h4 className="val-help-title">Détection des anomalies</h4>
              <ul className="val-anomaly-list">
                <li>La méthodologie est décrite sans planning</li>
                <li>Les moyens matériels ne sont pas chiffrés</li>
                <li>Certaines références techniques sont absentes</li>
                <li>Certaines références techniques sont ambiguës</li>
              </ul>
            </div>

            <div className="val-help-section">
              <h4 className="val-help-title">Estimation indicative</h4>
              <table className="val-estimation-table">
                <thead>
                  <tr>
                    <th>Critère</th>
                    <th>Estimation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Méthodologie</td>
                    <td>14 – 17</td>
                  </tr>
                  <tr>
                    <td>Équipe</td>
                    <td>18 – 20</td>
                  </tr>
                  <tr>
                    <td>Moyens matériels</td>
                    <td>10 – 12</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  const renderTechnicalEvaluationContent = () => (
    <div className="space-y-6">
      <div className="val-decision-section">
        <h3 className="val-section-title">Contexte Technique</h3>
        <div className="val-context-grid">
          <div>
            <div className="val-field-row">
              <span className="val-field-label">Objet du marché</span>
              <span className="val-field-value">Fourniture</span>
            </div>
            <div className="val-field-row">
              <span className="val-field-label">Domaine</span>
              <span className="val-field-value">Domaine</span>
            </div>
          </div>
          <div>
            <div className="val-field-row">
              <span className="val-field-label">Lot 01</span>
              <span className="val-field-value">Fourniture équipements</span>
            </div>
            <div className="val-field-row">
              <span className="val-field-label">Lot 02</span>
              <span className="val-field-value">Installation & mise en service</span>
            </div>
          </div>
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Conformité Technique</h3>
        <div className="val-conformity-box">
          <div className="val-toggle-row">
            <span className="val-toggle-label">Conformité de l'offre technique</span>
            <label className="val-toggle-switch">
              <input
                type="checkbox"
                checked={isTechnicalConform}
                onChange={(e) => setIsTechnicalConform(e.target.checked)}
              />
              <span className="val-toggle-slider"></span>
            </label>
            <span className={`val-toggle-status ${isTechnicalConform ? 'val-conform' : 'val-non-conform'}`}>
              {isTechnicalConform ? 'Conforme' : 'Non conforme'}
            </span>
          </div>

          {!isTechnicalConform && (
            <div className="val-non-conform-reasons mt-4">
              <div className="val-field-label mb-2">Motif de non conformité</div>
              <div className="val-checkbox-group">
                <label className="val-checkbox-item">
                  <input type="checkbox" defaultChecked />
                  <span>Spécifications techniques incomplètes</span>
                </label>
                <label className="val-checkbox-item">
                  <input type="checkbox" defaultChecked />
                  <span>Solutions proposées non conformes</span>
                </label>
                <label className="val-checkbox-item">
                  <input type="checkbox" defaultChecked />
                  <span>Absence d'éléments obligatoires</span>
                </label>
                <label className="val-checkbox-item">
                  <input type="checkbox" defaultChecked />
                  <span>Autre</span>
                </label>
              </div>
              <div className="mt-3">
                <div className="val-field-label mb-2">Détails du motif</div>
                <textarea
                  className="val-textarea"
                  placeholder="Tapez ici ..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Conformité Financière</h3>
        <div className="val-conformity-details">
          <div className="mt-4">
            <div className="val-field-label mb-2">Pertinence de la solution proposée</div>
            <div className="val-radio-group">
              <label className="val-radio-item">
                <input type="radio" name="pertinence" value="faible" />
                <span>Faible</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="pertinence" value="moyenne" />
                <span>Moyenne</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="pertinence" value="elevee" defaultChecked />
                <span>Élevée</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <div className="val-field-label mb-2">Adéquation aux besoins exprimés</div>
            <div className="val-radio-group">
              <label className="val-radio-item">
                <input type="radio" name="adequation" value="insuffisante" />
                <span>Insuffisante</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="adequation" value="acceptable" />
                <span>Acceptable</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="adequation" value="optimale" defaultChecked />
                <span>Optimale</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <div className="val-field-label mb-2">Justification de l'appréciation</div>
            <textarea
              className="val-textarea"
              placeholder="Évaluer la qualité de la solution proposée au regard des exigences techniques et des objectifs du projet"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Moyens humains et matériels</h3>
        <div className="val-conformity-details">
          <div className="mt-4">
            <div className="val-field-label mb-2">Moyens humains proposés</div>
            <div className="val-radio-group">
              <label className="val-radio-item">
                <input type="radio" name="moyens_humains" value="insuffisante" />
                <span>Insuffisante</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="moyens_humains" value="acceptable" />
                <span>Acceptable</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="moyens_humains" value="optimale" defaultChecked />
                <span>Optimale</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <div className="val-field-label mb-2">Moyens matériels et logistiques</div>
            <div className="val-radio-group">
              <label className="val-radio-item">
                <input type="radio" name="moyens_materiels" value="insuffisante" />
                <span>Insuffisante</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="moyens_materiels" value="acceptable" />
                <span>Acceptable</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="moyens_materiels" value="optimale" defaultChecked />
                <span>Optimale</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <div className="val-field-label mb-2">Justification de l'appréciation</div>
            <textarea
              className="val-textarea"
              placeholder="Tapez ici..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Méthodologie & planning</h3>
        <div className="val-conformity-details">
          <div className="mt-4">
            <div className="val-field-label mb-2">Méthodologie d'exécution</div>
            <div className="val-radio-group">
              <label className="val-radio-item">
                <input type="radio" name="methodologie" value="non_satisfaisante" />
                <span>Non satisfaisante</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="methodologie" value="satisfaisante" />
                <span>Satisfaisante</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="methodologie" value="tres_satisfaisante" defaultChecked />
                <span>Très satisfaisante</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <div className="val-field-label mb-2">Planning proposé</div>
            <div className="val-radio-group">
              <label className="val-radio-item">
                <input type="radio" name="planning" value="non_realiste" />
                <span>Non réaliste</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="planning" value="realiste" />
                <span>Réaliste</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="planning" value="optimise" defaultChecked />
                <span>Optimisé</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <div className="val-field-label mb-2">Observations techniques</div>
            <textarea
              className="val-textarea"
              placeholder="Tapez ici..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Score technique</h3>
        <div className="val-score-table">
          <div className="val-score-header">Calcul du score</div>
          <table className="val-table">
            <thead>
              <tr>
                <th>Critère</th>
                <th>Score Maximal</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Méthodologie</td>
                <td>20</td>
                <td><input type="text" className="val-input-small" placeholder="Tapez ici ..." /></td>
              </tr>
              <tr>
                <td>Équipe</td>
                <td>40</td>
                <td><input type="text" className="val-input-small" placeholder="Tapez ici ..." /></td>
              </tr>
              <tr>
                <td>Moyens matériels</td>
                <td>15</td>
                <td><input type="text" className="val-input-small" placeholder="Tapez ici ..." /></td>
              </tr>
            </tbody>
          </table>
          <div className="val-score-total">
            Score totale calculé &nbsp; <span className="val-score-value">0/100</span>
          </div>
        </div>
      </div>

      <div className="val-decision-section">
        <h3 className="val-section-title">Synthèse financière</h3>
        <div className="val-synthesis-box">
          <div className="val-field-label mb-2">Sur la base de l'analyse effectuée, l'offre technique est jugée</div>
          <textarea
            className="val-textarea"
            placeholder="Tapez ici ..."
            rows={3}
          />

          <div className="mt-4">
            <div className="val-field-label mb-2">Les éléments déterminants ayant conduit à cette évaluation sont</div>
            <textarea
              className="val-textarea"
              placeholder="Tapez ici ..."
              rows={3}
            />
          </div>

          <div className="mt-4">
            <div className="val-field-label mb-2">Avis technique</div>
            <div className="val-radio-group">
              <label className="val-radio-item">
                <input type="radio" name="avis_technique" value="favorable" />
                <span>Favorable</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="avis_technique" value="defavorable" />
                <span>Défavorable</span>
              </label>
              <label className="val-radio-item">
                <input type="radio" name="avis_technique" value="reserve" defaultChecked />
                <span>Réservé</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="val-analysis-help border rounded-xl overflow-hidden shadow-sm transition-all duration-300">
        <button 
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          type="button"
        >
          <h3 className="val-section-title !mb-0">Aide à l'analyse</h3>
          <FontAwesomeIcon icon={isHelpOpen ? faChevronUp : faChevronDown} className="text-gray-500" />
        </button>

        {isHelpOpen && (
          <div className="p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">

          <div className="val-help-section">
            <h4 className="val-help-title">Vérification de conformité du document</h4>
            <div className="val-help-status val-conform">Conforme</div>
            <ul className="val-checklist">
              <li className="val-check-item val-check-pass">
                <FontAwesomeIcon icon={faCheck} className="val-check-icon" />
                Présence des sections obligatoires
              </li>
              <li className="val-check-item val-check-fail">
                <FontAwesomeIcon icon={faTimes} className="val-check-icon" />
                Respect du format exigé
              </li>
              <li className="val-check-item val-check-pass">
                <FontAwesomeIcon icon={faCheck} className="val-check-icon" />
                Cohérence avec le cahier des charges
              </li>
              <li className="val-check-item val-check-pass">
                <FontAwesomeIcon icon={faCheck} className="val-check-icon" />
                Présence des pièces techniques requises
              </li>
            </ul>
          </div>

          <div className="val-help-section">
            <h4 className="val-help-title">Détection des anomalies</h4>
            <ul className="val-anomaly-list">
              <li>La méthodologie est décrite sans planning</li>
              <li>Les moyens matériels ne sont pas chiffrés</li>
              <li>Certaines références techniques sont absentes</li>
              <li>Certaines références techniques sont ambiguës</li>
            </ul>
          </div>

          <div className="val-help-section">
            <h4 className="val-help-title">Estimation indicative</h4>
            <table className="val-estimation-table">
              <thead>
                <tr>
                  <th>Critère</th>
                  <th>Estimation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Méthodologie</td>
                  <td>14 – 17</td>
                </tr>
                <tr>
                  <td>Équipe</td>
                  <td>18 – 20</td>
                </tr>
                <tr>
                  <td>Moyens matériels</td>
                  <td>10 – 12</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </div>
);

      return (
      <>
        <div
          className={`val-file-details ${shouldShowDocumentViewer ? '' : 'val-file-details-full-width'}`}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {isReportsTab && (
            <div className="val-reports-navigation">
              <div className="val-reports-nav-buttons">
                <button
                  onClick={() => setActiveReportSubTab('administrative')}
                  className={`val-reports-nav-button ${activeReportSubTab === 'administrative' ? 'val-reports-nav-button-active' : ''}`}
                  style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}
                >
                  Evaluation administrative
                </button>
                <button
                  onClick={() => setActiveReportSubTab('offers')}
                  className={`val-reports-nav-button ${activeReportSubTab === 'offers' ? 'val-reports-nav-button-active' : ''}`}
                  style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}
                >
                  Evaluation des offres
                </button>
              </div>
            </div>
          )}

          {isDecisionTab && isValidator && (
            <div className="val-reports-navigation">
              <div className="val-reports-nav-buttons">
                <button
                  onClick={() => setActiveDecisionSubTab('general')}
                  className={`val-reports-nav-button ${activeDecisionSubTab === 'general' ? 'val-reports-nav-button-active' : ''}`}
                  style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}
                >
                  Informations Générales
                </button>
                <button
                  onClick={() => setActiveDecisionSubTab('commission')}
                  className={`val-reports-nav-button ${activeDecisionSubTab === 'commission' ? 'val-reports-nav-button-active' : ''}`}
                  style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}
                >
                  Décision de la commission
                </button>
                <button
                  onClick={() => setActiveDecisionSubTab('technical')}
                  className={`val-reports-nav-button ${activeDecisionSubTab === 'technical' ? 'val-reports-nav-button-active' : ''}`}
                  style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}
                >
                  Évaluation Technique
                </button>
                <button
                  onClick={() => setActiveDecisionSubTab('conclusion')}
                  className={`val-reports-nav-button ${activeDecisionSubTab === 'conclusion' ? 'val-reports-nav-button-active' : ''}`}
                  style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}
                >
                  Conclusion et Décision
                </button>
              </div>
            </div>
          )}

          {isDecisionTab && isValidator && activeDecisionSubTab === 'commission' ? (
            renderCommissionContent()
          ) : isDecisionTab && isValidator && activeDecisionSubTab === 'technical' ? (
            renderTechnicalEvaluationContent()
          ) : isDecisionTab && isValidator && activeDecisionSubTab === 'conclusion' ? (
            renderConclusionContent()
          ) : (
            <div className="val-file-details-content">
              {(currentData?.fields || []).map((field: any, index: number) => (
                <div key={index} className="val-file-details-row">
                  <span className="val-file-details-label val-body-medium" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                    {field.label}
                  </span>
                  <span className="val-file-details-value val-body" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isCommission && (
            <>
              {isDecisionTab ? (
                <>
                  <button onClick={handleDownload} className="val-file-details-button val-bg-primary" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                    <FontAwesomeIcon icon={faFileDownload} className="val-icon-16" />
                    {dict?.common?.actions?.download || 'Télécharger'}
                  </button>
                  <button onClick={onTransmit} className="val-file-details-button val-bg-success" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                    <FontAwesomeIcon icon={faPaperPlane} className="val-icon-16" />
                    {dict?.common?.actions?.transmit || 'Transmettre'}
                  </button>
                </>
              ) : (
                <button onClick={handleDownload} className="val-file-details-button val-bg-primary" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                  <FontAwesomeIcon icon={faDownload} className="val-icon-16" />
                  {dict?.common?.actions?.download || 'Télécharger'}
                </button>
              )}
            </>
          )}

          {isValidator && (
            <>
              {validatorNoButtons && (
                <div className="val-file-details-no-actions">
                  <span className="val-body val-text-gray-500">Aucune action disponible</span>
                </div>
              )}

              {validatorDownloadOnly && (
                <button onClick={handleDownload} className="val-file-details-button val-bg-primary" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                  <FontAwesomeIcon icon={faDownload} className="val-icon-16" />
                  {dict?.common?.actions?.download || 'Télécharger'}
                </button>
              )}

              {validatorReportsDownloadOnly && (
                <button onClick={handleDownload} className="val-file-details-button val-bg-primary" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                  <FontAwesomeIcon icon={faDownload} className="val-icon-16" />
                  {dict?.common?.actions?.download || 'Télécharger'}
                </button>
              )}

              {validatorFullButtons && (
                <>
                  <button onClick={handleDownload} className="val-file-details-button val-bg-primary" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                    <FontAwesomeIcon icon={faFileDownload} className="val-icon-16" />
                    {dict?.common?.actions?.download || 'Télécharger'}
                  </button>
                  <button onClick={onTransmit} className="val-file-details-button val-bg-success" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                    <FontAwesomeIcon icon={faPaperPlane} className="val-icon-16" />
                    {dict?.common?.actions?.transmit || 'Transmettre'}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {shouldShowDocumentViewer && renderDocumentViewer && (
          <div className="val-document-viewer-container">
            {renderDocumentViewer(currentData.fields.find(f => f.label === 'URL')?.value)}
          </div>
        )}
      </>
      );
}