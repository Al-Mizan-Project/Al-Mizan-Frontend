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
  const missingDocumentText = 'Document non disponible';

  const shouldShowDocumentViewer = activeTab !== 'decision' || (activeTab === 'decision' && activeDecisionSubTab === 'general');
  const validatorNoButtons = isValidator && activeTab === 'call';
  const validatorDownloadOnly = isValidator && (activeTab === 'financial' || activeTab === 'technical');
  const validatorReportsDownloadOnly = isValidator && activeTab === 'reports';
  const validatorFullButtons = isValidator && activeTab === 'decision';

  const getData = () => {
    if (!data) return { fields: [] };
    const { soumission, appelOffre, evaluations, validations, documents, documentsByType } = data;

    const allDocuments = documents || [];

    const findDoc = (type: string) => {
      return allDocuments.find((d: any) =>
        `${d.type_document ?? ''} ${d.nom ?? ''}`.toLowerCase().includes(type.toLowerCase())
      );
    };

    const financialDoc = documentsByType?.financiere || findDoc('financiere') || findDoc('financier') || findDoc('offre financ');
    const technicalDoc = documentsByType?.technique || findDoc('technique') || findDoc('technical') || findDoc('offre technique');
    const aoDoc = documentsByType?.cdc || findDoc('cahier') || findDoc('cdc') || findDoc('cahier des charges');

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
          { label: 'Document', value: financialDoc?.nom ?? missingDocumentText },
          { label: 'URL', value: financialDoc?.download_url ?? financialDoc?.storage_url ?? soumission?.offre_financiere_chiffree_url ?? missingDocumentText },
          { label: 'Status', value: soumission?.statut }
        ]
      };
    }

    if (activeTab === 'technical') {
      return {
        fields: [
          ...commonFields,
          { label: 'Document', value: technicalDoc?.nom ?? missingDocumentText },
          { label: 'URL', value: technicalDoc?.download_url ?? technicalDoc?.storage_url ?? missingDocumentText },
          { label: 'Status', value: soumission?.statut }
        ]
      };
    }

    if (activeTab === 'call') {
      return {
        fields: [
          { label: 'Dossier', value: appelOffre?.reference },
          { label: 'Titre', value: appelOffre?.titre },
          { label: 'Document', value: aoDoc?.nom ?? missingDocumentText },
          { label: 'URL', value: aoDoc?.download_url ?? aoDoc?.storage_url ?? missingDocumentText }
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
  const currentUrlValue = currentData.fields.find(f => f.label === 'URL')?.value;
  const shouldShowMissingDocumentMessage = ['financial', 'technical', 'call'].includes(activeTab) && currentUrlValue === missingDocumentText;

  const handleDownload = () => {
    const urlField = currentData.fields.find(f => f.label === 'URL');
    if (urlField && urlField.value !== missingDocumentText) {
      onDownload?.(urlField.value);
    } else {
      alert('Document non disponible pour le téléchargement');
    }
  };


  // ============================================
  // COMPOSANT: Contenu "Conclusion et Décision"
  // ============================================
  const renderConclusionContent = () => {
    const reference = data?.appelOffre?.reference || 'N/A';
    const operateur = data?.operateurNom || (data?.soumission?.id_soumissionnaire ? `Opérateur #${data.soumission.id_soumissionnaire}` : 'N/A');
    const scoreFinancier = data?.evaluations?.find((e: any) => e.type === 'financiere')?.note ?? 0;
    const scoreTechnique = data?.evaluations?.find((e: any) => e.type === 'technique')?.note ?? 0;
    const serviceContractant = data?.serviceNom || data?.appelOffre?.id_service_contractant || 'N/A';
    const domaine = data?.appelOffre?.secteur || data?.appelOffre?.type_prestation || 'N/A';
    const decisionFinale = data?.attribution?.statut || 'En attente';
    const attributionId = data?.attribution?.id;

    const handleDownloadPdf = () => {
      window.print();
    };

    const handleTransmit = async () => {
      try {
        const decisionLabels: Record<string, string> = {
          'retenu': 'Dossier retenu',
          'rejete': 'Dossier rejeté',
          'retenu_reserve': 'Dossier retenu sous réserve'
        };
        const fullComment = `${decisionLabels[decisionFinale] || 'Décision prise'} : ${motivation || avisFinal || 'Aucun commentaire'}`;

        const notifPayload = {
          utilisateur_id: 1, // Simulate sending to admin/president
          type_notification: 'transmission_dossier',
          titre: `Transmission du dossier ${reference}`,
          message: `Le validateur a transmis le dossier. Décision: ${fullComment}`,
          priorite: 'haute',
          categorie: 'validation',
          entite_liee_type: 'attribution',
          entite_liee_id: attributionId,
          statut: 'non_lu'
        };

        const response = await fetch('/api/proxy/notifications?path=notifications/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifPayload)
        });

        if (!response.ok) {
           console.warn('Notification non envoyée', await response.text());
        }
        
        alert(`Notification transmise au responsable (Rôle: ${role}).`);
        onTransmit?.();
      } catch (e) {
        console.error('Erreur transmission', e);
        alert('Erreur lors de la transmission');
      }
    };

    return (
    <div className="space-y-6">
      {/* Informations générales */}
      <div className="val-conclusion-summary">
        <div className="val-summary-grid">
          <div className="val-summary-item">
            <span className="val-summary-label">Référence dossier ID</span>
            <span className="val-summary-value">{reference}</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Opérateur économique</span>
            <span className="val-summary-value">{operateur}</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Score financière</span>
            <span className="val-summary-value">{scoreFinancier}/100</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Score technique</span>
            <span className="val-summary-value">{scoreTechnique}/100</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Service Contractant</span>
            <span className="val-summary-value">Service #{serviceContractant}</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Domaine</span>
            <span className="val-summary-value">{domaine}</span>
          </div>
          <div className="val-summary-item">
            <span className="val-summary-label">Décision finale</span>
            <span className="val-summary-value">{decisionFinale}</span>
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

      {/* Bouton Marquer comme prêt, Télécharger, Transmettre */}
      <div className="val-action-buttons flex gap-4">
        <button
          onClick={() => setShowModal(true)}
          disabled={!isCertified || decisionFinale === 'definitive'}
          className={`val-btn-primary ${(!isCertified || decisionFinale === 'definitive') ? 'val-btn-disabled' : ''}`}
        >
          Marquer comme prêt
        </button>
        <button
          onClick={handleDownloadPdf}
          className="val-btn-secondary"
        >
          Télécharger
        </button>
        <button
          onClick={handleTransmit}
          disabled={decisionFinale !== 'definitive'}
          className={`val-btn-secondary ${decisionFinale !== 'definitive' ? 'val-btn-disabled' : ''}`}
        >
          Transmettre
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

                  if (!attributionId) {
                    alert("Aucune attribution trouvée pour valider.");
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

                    const fullComment = `${decisionLabels[decision] || 'Décision prise'} : ${motivation || avisFinal || 'Aucun commentaire'}`;

                    // Validation de l'attribution via le endpoint des contrats
                    const response = await fetch(`/api/proxy/contrats?path=attributions-provisoires/${attributionId}/valider/`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ commentaire: fullComment })
                    });

                    if (!response.ok) {
                       const errBody = await response.json().catch(() => ({}));
                       throw new Error(errBody.error || "Failed to validate attribution");
                    }

                    setShowModal(false);
                    // Force refresh to update data
                    window.location.reload();
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
  };

  const renderCommissionContent = () => {
    const montantTotal = data?.soumission?.montant_soumission ?? 'N/A';
    const devise = data?.soumission?.devise ?? 'DZD';
    const domaine = data?.appelOffre?.secteur ?? data?.appelOffre?.type_prestation ?? 'N/A';

    return (
    <div className="space-y-6">
      <div className="val-decision-section">
        <h3 className="val-section-title">Contexte Financier</h3>
        <div className="val-context-grid">
          <div>
            <div className="val-field-row">
              <span className="val-field-label">Montant total</span>
              <span className="val-field-value">{montantTotal}</span>
            </div>
            <div className="val-field-row">
              <span className="val-field-label">Devise</span>
              <span className="val-field-value">{devise}</span>
            </div>
            <div className="val-field-row">
              <span className="val-field-label">Domaine</span>
              <span className="val-field-value">{domaine}</span>
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
            <span className="val-field-value">{montantTotal} {devise}</span>
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
  };
  const renderTechnicalEvaluationContent = () => {
    const objetDuMarche = data?.appelOffre?.titre ?? data?.appelOffre?.reference ?? 'N/A';
    const domaine = data?.appelOffre?.secteur ?? data?.appelOffre?.type_prestation ?? 'N/A';

    return (
    <div className="space-y-6">
      <div className="val-decision-section">
        <h3 className="val-section-title">Contexte Technique</h3>
        <div className="val-context-grid">
          <div>
            <div className="val-field-row">
              <span className="val-field-label">Objet du marché</span>
              <span className="val-field-value">{objetDuMarche}</span>
            </div>
            <div className="val-field-row">
              <span className="val-field-label">Domaine</span>
              <span className="val-field-value">{domaine}</span>
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
  };

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
              {shouldShowMissingDocumentMessage && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 mb-4 text-orange-900">
                  <strong>Document non disponible.</strong> Aucune pièce valide n'a été trouvée pour cet onglet.
                </div>
              )}
              {((currentData?.fields || [])
                .filter((field: any) => !['Document', 'URL', 'Status'].includes(field.label))
                .map((field: any, index: number) => (
                  <div key={index} className="val-file-details-row">
                    <span className="val-file-details-label val-body-medium" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                      {field.label}
                    </span>
                    <span className="val-file-details-value val-body" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}>
                      {field.value}
                    </span>
                  </div>
                )))}
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

              {validatorFullButtons && activeDecisionSubTab !== 'conclusion' && (
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