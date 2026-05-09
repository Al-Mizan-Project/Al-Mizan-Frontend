'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AppelOffre,
  CommissionEvaluation,
  CommissionExterne,
  CommissionInterne,
  Contrat,
  DocumentMetadata,
  Evaluation,
  Recours,
  Soumission,
  Validation,
} from '@/lib/api/service-contractant';
import { serviceContractantApi } from '@/lib/api/service-contractant';
import styles from './service-contractant.module.css';
import { useServiceContractant } from './ServiceContractantLiveContext';
import { marchesTabs, type MarchesTab } from './service-contractant-data';
import {
  Badge,
  Field,
  LoadingOrErrorBlock,
  ReadonlyField,
  SectionHeader,
  canUseMarches,
  cn,
  formatDateInput,
  formatDateTime,
  formatDateTimeInput,
  formatFileSize,
  formatMoney,
  notify,
  promptValue,
  toBadgeFromStatus,
  toIsoDateTime,
} from './ServiceContractantLiveShared';

// ─── Option lists ───────────────────────────────────────────────────────────

const TYPE_PROCEDURE_OPTIONS = [
  { value: 'appel_offres_ouvert', label: "Appel d'offres ouvert" },
  { value: 'appel_offres_restreint', label: "Appel d'offres restreint" },
  { value: 'gre_a_gre', label: 'Gré à gré' },
  { value: 'concours', label: 'Concours' },
];

const TYPE_PRESTATION_OPTIONS = [
  { value: 'travaux', label: 'Travaux' },
  { value: 'fournitures', label: 'Fournitures' },
  { value: 'services', label: 'Services' },
  { value: 'etudes', label: 'Études' },
];

const VISIBILITE_OPTIONS = [
  { value: 'public', label: 'Public (ouvert à tous)' },
  { value: 'prive', label: 'Privé (restreint)' },
];

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'appel_offres', label: "Appel d'offres" },
  { value: 'soumission', label: 'Soumission' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'autre', label: 'Autre' },
];

const CONTRAT_STATUT_OPTIONS = [
  { value: 'en_preparation', label: 'En préparation' },
  { value: 'signe', label: 'Signé' },
  { value: 'en_execution', label: 'En exécution' },
  { value: 'cloture', label: 'Clôturé' },
  { value: 'resilie', label: 'Résilié' },
];

// ─── Draft types ─────────────────────────────────────────────────────────────

type AppelDraft = {
  id_service_contractant: number;
  reference: string;
  titre: string;
  type_procedure: string;
  type_prestation: string;
  visibilite: string;
  wilaya: string;
  localisation: string;
  description: string;
  montant_estime: string;
  date_publication: string;
  date_limite_soumission: string;
  date_ouverture_plis: string;
  poids_technique: string;
  poids_financier: string;
};

type ContractDraft = {
  numero_contrat: string;
  date_signature: string;
  statut: string;
};

type CommissionDraft = {
  id: string;
  nom_comission: string;
  categorie: string;
};

type DocUploadForm = {
  related_type: string;
  is_encrypted: string;
  visible_after: string;
};

// ─── Builders ────────────────────────────────────────────────────────────────

function buildDefaultAppelDraft(serviceId: number | null): AppelDraft {
  return {
    id_service_contractant: serviceId || 0,
    reference: '',
    titre: '',
    type_procedure: 'appel_offres_ouvert',
    type_prestation: 'fournitures',
    visibilite: 'public',
    wilaya: '',
    localisation: '',
    description: '',
    montant_estime: '',
    date_publication: '',
    date_limite_soumission: '',
    date_ouverture_plis: '',
    poids_technique: '50',
    poids_financier: '50',
  };
}

function buildAppelDraft(appel: AppelOffre | null, serviceId: number | null): AppelDraft {
  if (!appel) return buildDefaultAppelDraft(serviceId);
  return {
    id_service_contractant: appel.id_service_contractant,
    reference: appel.reference || '',
    titre: appel.titre || '',
    type_procedure: appel.type_procedure || 'appel_offres_ouvert',
    type_prestation: appel.type_prestation || 'fournitures',
    visibilite: appel.visibilite || 'public',
    wilaya: appel.wilaya || '',
    localisation: appel.localisation || '',
    description: appel.description || '',
    montant_estime: String(appel.montant_estime || ''),
    date_publication: formatDateTimeInput(appel.date_publication),
    date_limite_soumission: formatDateTimeInput(appel.date_limite_soumission),
    date_ouverture_plis: formatDateTimeInput(appel.date_ouverture_plis),
    poids_technique: String(appel.poids_technique ?? 50),
    poids_financier: String(appel.poids_financier ?? 50),
  };
}

function buildContractDraft(contrat: Contrat | null): ContractDraft {
  if (!contrat) return { numero_contrat: '', date_signature: '', statut: 'en_preparation' };
  return {
    numero_contrat: contrat.numero_contrat || '',
    date_signature: formatDateInput(contrat.date_signature),
    statut: contrat.statut || 'en_preparation',
  };
}

function buildCommissionDraft(commission: CommissionEvaluation | null): CommissionDraft {
  if (!commission) return { id: '', nom_comission: '', categorie: '' };
  return {
    id: String(commission.id_comission),
    nom_comission: commission.nom_comission || '',
    categorie: commission.categorie || '',
  };
}

function buildAppelPayload(draft: AppelDraft, source: AppelOffre | null, serviceId: number | null) {
  return {
    id_service_contractant: serviceId || draft.id_service_contractant,
    reference: draft.reference.trim(),
    titre: draft.titre.trim(),
    description: draft.description.trim(),
    type_procedure: draft.type_procedure,
    type_prestation: draft.type_prestation,
    visibilite: draft.visibilite,
    wilaya: draft.wilaya.trim(),
    localisation: draft.localisation.trim(),
    montant_estime: draft.montant_estime ? Number(draft.montant_estime) : null,
    date_publication: toIsoDateTime(draft.date_publication),
    date_limite_soumission: toIsoDateTime(draft.date_limite_soumission),
    date_ouverture_plis: toIsoDateTime(draft.date_ouverture_plis),
    poids_technique: Number(draft.poids_technique || 0),
    poids_financier: Number(draft.poids_financier || 0),
    required_docs_admin: source?.required_docs_admin || [],
    required_docs_tech: source?.required_docs_tech || [],
    required_docs_fin: source?.required_docs_fin || [],
    minimum_revenue_da: source?.minimum_revenue_da || 0,
    qualification_category: source?.qualification_category || '',
    minimum_experience_years: source?.minimum_experience_years || 0,
    participation_conditions: source?.participation_conditions || [],
    operateurs_invites: source?.operateurs_invites?.map((item) => item.id_operateur_economique) || [],
  };
}

function getUploadedDocuments(payload: unknown): DocumentMetadata[] {
  if (Array.isArray(payload)) return payload as DocumentMetadata[];
  if (payload && typeof payload === 'object') {
    const value = payload as { documents?: DocumentMetadata | DocumentMetadata[]; id_document?: number };
    if (Array.isArray(value.documents)) return value.documents;
    if (value.documents && typeof value.documents === 'object') return [value.documents];
    if (typeof value.id_document === 'number') return [value as DocumentMetadata];
  }
  return [];
}

function getUploadErrorMessages(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const value = payload as { errors?: Array<{ filename?: string; error?: string }> };
  return (value.errors || []).map((item) =>
    item.filename && item.error ? `${item.filename}: ${item.error}` : item.error || 'Téléversement incomplet.'
  );
}

function downloadAppelsAsCsv(appels: AppelOffre[]) {
  if (typeof window === 'undefined') return;
  const rows = [
    ['Référence', 'Titre', 'Procédure', 'Prestation', 'Montant estimé', 'Date publication', 'Date limite', 'Statut'],
    ...appels.map((a) => [
      a.reference, a.titre, a.type_procedure, a.type_prestation,
      String(a.montant_estime || ''), a.date_publication || '',
      a.date_limite_soumission || '', a.statut || '',
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'appels-offres.csv';
  link.click();
  window.URL.revokeObjectURL(url);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MarchesLiveSection() {
  const { currentPermissions, currentUser, error, isLoading, members, service } = useServiceContractant();

  const [activeTab, setActiveTab] = useState<MarchesTab>('marches-appels');
  const [showAiMock, setShowAiMock] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');

  const [appels, setAppels] = useState<AppelOffre[]>([]);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<DocumentMetadata[]>([]);
  const [soumissions, setSoumissions] = useState<Soumission[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [classement, setClassement] = useState<Array<{ id_soumission: number; moyenne: number }>>([]);
  const [recours, setRecours] = useState<Recours[]>([]);

  const [selectedAppelId, setSelectedAppelId] = useState<number | null>(null);
  const [selectedSoumissionId, setSelectedSoumissionId] = useState<number | null>(null);
  const [selectedCommissionId, setSelectedCommissionId] = useState<number | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contrat | null>(null);

  const [evaluationCommissions, setEvaluationCommissions] = useState<CommissionEvaluation[]>([]);
  const [commissionInterneOptions, setCommissionInterneOptions] = useState<CommissionInterne[]>([]);
  const [commissionExterneOptions, setCommissionExterneOptions] = useState<CommissionExterne[]>([]);
  const [commissionMemberIds, setCommissionMemberIds] = useState<number[]>([]);
  const [memberToAdd, setMemberToAdd] = useState('');

  const [appelDraft, setAppelDraft] = useState<AppelDraft>(buildDefaultAppelDraft(service?.id_service || null));
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [docUploadAppelId, setDocUploadAppelId] = useState<number | null>(null);
  const [docForm, setDocForm] = useState<DocUploadForm>({
    related_type: 'appel_offres',
    is_encrypted: 'false',
    visible_after: '',
  });
  const [validationForm, setValidationForm] = useState({
    is_validated: 'true',
    type: 'interne',
    commentaire: '',
  });
  const [contractDraft, setContractDraft] = useState<ContractDraft>(buildContractDraft(null));
  const [commissionDraft, setCommissionDraft] = useState<CommissionDraft>(buildCommissionDraft(null));
  const [affectationType, setAffectationType] = useState('Commission interne');
  const [affectationTarget, setAffectationTarget] = useState('');
  const [affectationStep, setAffectationStep] = useState('Technique');

  // ─── Derived ──────────────────────────────────────────────────────────────

  const filteredAppels = useMemo(
    () =>
      appels.filter((a) => {
        const matchSearch =
          !searchTerm ||
          a.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.titre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'Tous' || a.statut === statusFilter;
        return matchSearch && matchStatus;
      }),
    [appels, searchTerm, statusFilter]
  );

  const selectedAppel = useMemo(
    () => appels.find((a) => a.id_appel_offres === selectedAppelId) || null,
    [appels, selectedAppelId]
  );

  const selectedSoumission = useMemo(
    () => soumissions.find((s) => s.id_soumission === selectedSoumissionId) || null,
    [selectedSoumissionId, soumissions]
  );

  const selectedValidation = useMemo(
    () => validations.find((v) => v.id_soumission === selectedSoumissionId) || null,
    [selectedSoumissionId, validations]
  );

  const selectedCommission = useMemo(
    () => evaluationCommissions.find((c) => c.id_comission === selectedCommissionId) || null,
    [evaluationCommissions, selectedCommissionId]
  );

  const affectationTargets = useMemo(
    () => [
      ...evaluationCommissions.map((c) => ({ value: `evaluation-${c.id_comission}`, label: `${c.nom_comission}` })),
      ...commissionInterneOptions.map((c) => ({ value: `interne-${c.id_comission_interne}`, label: `${c.nom_comission}` })),
      ...commissionExterneOptions.map((c) => ({ value: `externe-${c.id_comission_externe}`, label: `${c.nom_comission}` })),
    ],
    [commissionExterneOptions, commissionInterneOptions, evaluationCommissions]
  );

  const statusOptions = useMemo(
    () => ['Tous', ...Array.from(new Set(appels.map((a) => a.statut).filter(Boolean)))],
    [appels]
  );

  const administrativeProgress = `${validations.length}/${soumissions.length || 0}`;
  const technicalProgress = `${new Set(evaluations.map((e) => e.id_soumission)).size}/${soumissions.length || 0}`;
  const financialProgress = `${classement.length}/${soumissions.length || 0}`;

  // ─── Data loaders ─────────────────────────────────────────────────────────

  const loadAppels = useCallback(async () => {
    if (!service) { setAppels([]); return; }
    const loaded = await serviceContractantApi.listAppels({ service_id: service.id_service }).catch(() => []);
    setAppels(loaded);
  }, [service]);

  const loadCommissions = useCallback(async () => {
    if (!service) {
      setEvaluationCommissions([]);
      setCommissionInterneOptions([]);
      setCommissionExterneOptions([]);
      return;
    }
    const [svc, ext] = await Promise.all([
      serviceContractantApi.getServiceCommissions(service.id_service).catch(() => ({ commissions_evaluation: [], commissions_internes: [] })),
      serviceContractantApi.getCommissionsExternes().catch(() => []),
    ]);
    setEvaluationCommissions(svc.commissions_evaluation);
    setCommissionInterneOptions(svc.commissions_internes);
    setCommissionExterneOptions(ext);
  }, [service]);

  const loadAppelChildren = useCallback(async (appelId: number | null) => {
    if (!appelId) { setDocuments([]); setSoumissions([]); return; }
    const [links, loadedSoumissions] = await Promise.all([
      serviceContractantApi.getAppelDocuments(appelId).catch(() => []),
      serviceContractantApi.listAppelSoumissions(appelId).catch(() => []),
    ]);
    const loadedDocs = await Promise.all(
      links.map((l) => serviceContractantApi.getDocument(l.id_document).catch(() => null))
    );
    setDocuments(loadedDocs.filter(Boolean) as DocumentMetadata[]);
    setSoumissions(loadedSoumissions);
  }, []);

  const loadSoumissionChildren = useCallback(async (soumissionId: number | null) => {
    if (!soumissionId) {
      setValidations([]); setEvaluations([]); setRecours([]); setSelectedContract(null);
      return;
    }
    const [loadedValidations, loadedEvals, loadedRecours, loadedContract] = await Promise.all([
      serviceContractantApi.listValidations().catch(() => []),
      serviceContractantApi.listSoumissionEvaluations(soumissionId).catch(() => []),
      serviceContractantApi.listRecours().catch(() => []),
      serviceContractantApi.getContratBySoumission(soumissionId).catch(() => null),
    ]);
    setValidations(loadedValidations.filter((v) => v.id_soumission === soumissionId));
    setEvaluations(loadedEvals);
    setRecours(loadedRecours.filter((r) => r.id_soumission === soumissionId));
    setSelectedContract(loadedContract);
  }, []);

  const loadCommissionMemberIds = useCallback(async (commissionId: number | null) => {
    if (!commissionId) { setCommissionMemberIds([]); return; }
    const links = await serviceContractantApi.getCommissionEvaluationMembers(commissionId).catch(() => []);
    setCommissionMemberIds(links.map((l) => l.id_membre));
  }, []);

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => { void loadAppels(); void loadCommissions(); }, [loadAppels, loadCommissions]);

  useEffect(() => {
    if (isCreatingNew) return; // don't auto-select while user is filling a new AO form
    if (selectedAppelId && !appels.some((a) => a.id_appel_offres === selectedAppelId)) {
      setSelectedAppelId(appels[0]?.id_appel_offres || null);
      return;
    }
    if (!selectedAppelId && appels[0]) setSelectedAppelId(appels[0].id_appel_offres);
  }, [appels, isCreatingNew, selectedAppelId]);

  useEffect(() => {
    if (selectedCommissionId && !evaluationCommissions.some((c) => c.id_comission === selectedCommissionId)) {
      setSelectedCommissionId(evaluationCommissions[0]?.id_comission || null);
      return;
    }
    if (!selectedCommissionId && evaluationCommissions[0]) setSelectedCommissionId(evaluationCommissions[0].id_comission);
  }, [evaluationCommissions, selectedCommissionId]);

  useEffect(() => {
    setAppelDraft(buildAppelDraft(selectedAppel, service?.id_service || null));
    void loadAppelChildren(selectedAppelId);
  }, [loadAppelChildren, selectedAppel, selectedAppelId, service]);

  useEffect(() => {
    if (selectedSoumissionId && !soumissions.some((s) => s.id_soumission === selectedSoumissionId)) {
      setSelectedSoumissionId(soumissions[0]?.id_soumission || null);
      return;
    }
    if (!selectedSoumissionId && soumissions[0]) setSelectedSoumissionId(soumissions[0].id_soumission);
  }, [selectedSoumissionId, soumissions]);

  useEffect(() => {
    if (selectedValidation) {
      setValidationForm({
        is_validated: selectedValidation.is_validated === true ? 'true' : selectedValidation.is_validated === false ? 'false' : 'true',
        type: selectedValidation.type || 'interne',
        commentaire: selectedValidation.commentaire || '',
      });
    } else {
      setValidationForm({ is_validated: 'true', type: 'interne', commentaire: '' });
    }
  }, [selectedValidation]);

  useEffect(() => { setContractDraft(buildContractDraft(selectedContract)); }, [selectedContract]);
  useEffect(() => { setCommissionDraft(buildCommissionDraft(selectedCommission)); }, [selectedCommission]);
  useEffect(() => { void loadSoumissionChildren(selectedSoumissionId); }, [loadSoumissionChildren, selectedSoumissionId]);
  useEffect(() => { void loadCommissionMemberIds(selectedCommissionId); }, [loadCommissionMemberIds, selectedCommissionId]);

  useEffect(() => {
    if (!selectedAppelId || !selectedCommissionId) { setClassement([]); return; }
    void serviceContractantApi.getClassement(selectedAppelId, selectedCommissionId)
      .then((r) => setClassement(r.classement || []))
      .catch(() => setClassement([]));
  }, [selectedAppelId, selectedCommissionId]);

  useEffect(() => {
    if (affectationTarget && !affectationTargets.some((t) => t.value === affectationTarget)) {
      setAffectationTarget(affectationTargets[0]?.value || '');
      return;
    }
    if (!affectationTarget && affectationTargets[0]) setAffectationTarget(affectationTargets[0].value);
  }, [affectationTarget, affectationTargets]);

  useEffect(() => {
    if (appels[0] && docUploadAppelId === null) setDocUploadAppelId(appels[0].id_appel_offres);
  }, [appels, docUploadAppelId]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const saveAppel = async () => {
    if (!service) { notify('Service contractant non chargé.'); return; }
    const payload = buildAppelPayload(appelDraft, selectedAppel, service.id_service);
    try {
      const saved = selectedAppel
        ? await serviceContractantApi.updateAppel(selectedAppel.id_appel_offres, payload)
        : await serviceContractantApi.createAppel(payload);
      await loadAppels();
      setSelectedAppelId(saved.id_appel_offres);
      setIsCreatingNew(false);
      setActiveTab('marches-appels');
      notify(selectedAppel ? "Appel d'offres mis à jour." : "Appel d'offres créé.");
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Enregistrement impossible.');
    }
  };

  const runAppelAction = async (action: 'publish' | 'close' | 'open' | 'cancel', appelId: number | null) => {
    if (!appelId) { notify("Sélectionnez un appel d'offres existant."); return; }
    try {
      if (action === 'publish') await serviceContractantApi.publishAppel(appelId);
      else if (action === 'close') await serviceContractantApi.closeDepot(appelId);
      else if (action === 'open') {
        await serviceContractantApi.openPlisWorkflow(appelId);
        await serviceContractantApi.openBids(appelId);
      } else await serviceContractantApi.cancelAppel(appelId);
      await loadAppels();
      notify('Action exécutée.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Action impossible.');
    }
  };

  const uploadAndAttach = async () => {
    if (docFiles.length === 0) { notify('Sélectionnez au moins un fichier.'); return; }
    const formData = new FormData();
    formData.append('related_type', docForm.related_type);
    formData.append('is_encrypted', docForm.is_encrypted);
    if (docForm.visible_after) formData.append('visible_after', toIsoDateTime(docForm.visible_after) || '');
    docFiles.forEach((f) => formData.append('files', f));
    try {
      const response = await serviceContractantApi.uploadDocuments(formData);
      const uploaded = getUploadedDocuments(response);
      const errors = getUploadErrorMessages(response);
      if (errors.length > 0) { notify(errors.join('\n')); return; }
      if (uploaded.length > 0 && docUploadAppelId) {
        await Promise.all(uploaded.map((d) => serviceContractantApi.addAppelDocument(docUploadAppelId, d.id_document)));
        await loadAppelChildren(docUploadAppelId);
        setDocFiles([]);
        notify(`${uploaded.length} document(s) téléversé(s) et associé(s).`);
      } else if (uploaded.length > 0) {
        setPendingDocuments(uploaded);
        notify(`${uploaded.length} document(s) téléversé(s). Sélectionnez un appel pour les associer.`);
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Téléversement impossible.');
    }
  };

  const attachPendingDocuments = async () => {
    if (!docUploadAppelId) { notify("Sélectionnez un appel d'offres."); return; }
    if (pendingDocuments.length === 0) { notify('Aucun document en attente.'); return; }
    try {
      await Promise.all(pendingDocuments.map((d) => serviceContractantApi.addAppelDocument(docUploadAppelId, d.id_document)));
      await loadAppelChildren(docUploadAppelId);
      setPendingDocuments([]);
      notify("Documents associés à l'appel d'offres.");
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Association impossible.');
    }
  };

  const saveValidation = async (forcedStatus?: boolean | null) => {
    if (!currentUser) { notify('Utilisateur non chargé.'); return; }
    if (!selectedSoumissionId) { notify('Sélectionnez une soumission.'); return; }
    const payload = {
      id_utilisateur: currentUser.id_utilisateur,
      id_soumission: selectedSoumissionId,
      type: validationForm.type,
      is_validated: forcedStatus !== undefined ? forcedStatus
        : validationForm.is_validated === 'true' ? true
        : validationForm.is_validated === 'false' ? false : null,
      commentaire: validationForm.commentaire,
    };
    try {
      if (selectedValidation) {
        await serviceContractantApi.updateValidation(selectedValidation.id_validation, payload);
      } else {
        await serviceContractantApi.createValidation(payload);
      }
      await loadSoumissionChildren(selectedSoumissionId);
      notify('Validation mise à jour.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Validation impossible.');
    }
  };

  const approveValidation = async () => {
    if (!selectedSoumissionId) { notify('Sélectionnez une soumission.'); return; }
    try {
      if (selectedValidation) await serviceContractantApi.approveValidation(selectedValidation.id_validation);
      else { await saveValidation(true); return; }
      await loadSoumissionChildren(selectedSoumissionId);
      notify('Soumission approuvée.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Approbation impossible.');
    }
  };

  const rejectValidation = async () => {
    if (!selectedSoumissionId) { notify('Sélectionnez une soumission.'); return; }
    try {
      if (selectedValidation) {
        await serviceContractantApi.rejectValidation(selectedValidation.id_validation, validationForm.commentaire || 'Rejeté.');
      } else { await saveValidation(false); return; }
      await loadSoumissionChildren(selectedSoumissionId);
      notify('Soumission rejetée.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Rejet impossible.');
    }
  };

  const calculateRanking = async () => {
    if (!selectedAppelId || !selectedCommissionId) { notify("Sélectionnez un appel d'offres et une commission."); return; }
    try {
      const r = await serviceContractantApi.calculateClassement(selectedAppelId, selectedCommissionId);
      setClassement(r.classement || []);
      notify('Classement calculé.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Calcul impossible.');
    }
  };

  const validateNotes = async () => {
    if (!selectedAppelId || !selectedCommissionId) { notify("Sélectionnez un appel d'offres et une commission."); return; }
    try {
      await serviceContractantApi.validateNotes(selectedAppelId, selectedCommissionId);
      notify('Notes validées.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Validation des notes impossible.');
    }
  };

  const saveCommission = async () => {
    if (!service) { notify('Service contractant non chargé.'); return; }
    if (!commissionDraft.nom_comission.trim()) { notify('Renseignez le nom de la commission.'); return; }
    const enteredId = Number(commissionDraft.id || 0);
    const matched = evaluationCommissions.find((c) => c.id_comission === enteredId) || null;
    const target = matched || (selectedCommissionId ? evaluationCommissions.find((c) => c.id_comission === selectedCommissionId) || null : null);
    try {
      const saved = target
        ? await serviceContractantApi.updateCommissionEvaluation(target.id_comission, { id_service: service.id_service, nom_comission: commissionDraft.nom_comission, categorie: commissionDraft.categorie })
        : await serviceContractantApi.createCommissionEvaluation({ id_service: service.id_service, nom_comission: commissionDraft.nom_comission, categorie: commissionDraft.categorie });
      await loadCommissions();
      setSelectedCommissionId(saved.id_comission);
      notify(target ? 'Commission mise à jour.' : 'Commission créée.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Commission impossible à enregistrer.');
    }
  };

  const addCommissionMember = async () => {
    if (!selectedCommissionId) { notify('Sélectionnez une commission.'); return; }
    const membreId = Number(memberToAdd);
    if (!membreId) { notify('Identifiant de membre invalide.'); return; }
    try {
      await serviceContractantApi.addCommissionEvaluationMember(selectedCommissionId, membreId);
      await loadCommissionMemberIds(selectedCommissionId);
      setMemberToAdd('');
      notify('Membre ajouté à la commission.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Ajout impossible.');
    }
  };

  const saveContract = async () => {
    if (!service) { notify('Service contractant non chargé.'); return; }
    if (!selectedSoumissionId) { notify('Sélectionnez une soumission.'); return; }
    try {
      const payload = {
        id_soumission: selectedSoumissionId,
        id_service_contractants: service.id_service,
        numero_contrat: contractDraft.numero_contrat,
        date_signature: contractDraft.date_signature ? new Date(contractDraft.date_signature).toISOString() : null,
        statut: contractDraft.statut,
      };
      const saved = selectedContract
        ? await serviceContractantApi.updateContrat(selectedContract.id_contrat, payload)
        : await serviceContractantApi.createContrat(payload);
      setSelectedContract(saved);
      notify(selectedContract ? 'Contrat mis à jour.' : 'Contrat créé.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Contrat impossible à enregistrer.');
    }
  };

  const signContract = async () => {
    if (!selectedContract) { notify('Aucun contrat disponible pour cette soumission.'); return; }
    try {
      const signed = await serviceContractantApi.signContrat(selectedContract.id_contrat);
      setSelectedContract(signed);
      notify('Contrat signé.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Signature impossible.');
    }
  };

  const activeRecours = recours[0] || null;

  const runRecoursAction = async (action: 'instruire' | 'decision' | 'accepter' | 'rejeter' | 'cloturer') => {
    if (!activeRecours) { notify('Aucun recours disponible pour cette soumission.'); return; }
    try {
      if (action === 'instruire') await serviceContractantApi.instruireRecours(activeRecours.id_recours);
      else if (action === 'decision') {
        const decision = promptValue('Décision à enregistrer', activeRecours.decision || '');
        if (!decision) return;
        await serviceContractantApi.decideRecours(activeRecours.id_recours, { decision, traite_par: currentUser!.id_utilisateur });
      } else if (action === 'accepter') await serviceContractantApi.acceptRecours(activeRecours.id_recours);
      else if (action === 'rejeter') await serviceContractantApi.rejectRecours(activeRecours.id_recours);
      else await serviceContractantApi.closeRecours(activeRecours.id_recours);
      if (selectedSoumissionId) await loadSoumissionChildren(selectedSoumissionId);
      notify('Action sur le recours exécutée.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Action impossible sur le recours.');
    }
  };

  // ─── Guard ────────────────────────────────────────────────────────────────

  if (!canUseMarches(currentPermissions)) {
    return (
      <>
        <LoadingOrErrorBlock isLoading={isLoading} error={error} />
        <SectionHeader title="Marchés" description="Espace réservé aux membres du workflow marchés." />
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.hintBox}>
              <h5>Accès réservé</h5>
              <p>Votre profil ne dispose pas des permissions nécessaires pour accéder à cet espace.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <LoadingOrErrorBlock isLoading={isLoading} error={error} />

      <SectionHeader
        title="Marchés"
        description="Gérez les appels d'offres, les documents, les soumissions et les contrats."
      />

      <div className={styles.subtabs}>
        {marchesTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(styles.subtab, activeTab === tab.id && styles.subtabActive)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Liste des appels ── */}
      {activeTab === 'marches-appels' && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.field} style={{ minWidth: 240 }}>
                <label>Recherche</label>
                <input
                  type="search"
                  placeholder="Référence ou titre…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.field} style={{ minWidth: 200 }}>
                <label>Statut</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  {statusOptions.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.toolbarRight}>
              <button
                type="button"
                className={cn(styles.btn, styles.btnPrimary)}
                onClick={() => {
                  setIsCreatingNew(true);
                  setSelectedAppelId(null);
                  setAppelDraft(buildDefaultAppelDraft(service?.id_service || null));
                  setActiveTab('marches-edition');
                }}
              >
                Nouvel appel d'offres
              </button>
              <button
                type="button"
                className={cn(styles.btn, styles.btnGhost)}
                onClick={() => downloadAppelsAsCsv(filteredAppels)}
              >
                Exporter
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h4>Liste des appels d'offres</h4>
              <span className={styles.muted}>{filteredAppels.length} résultat(s)</span>
            </div>
            <div className={styles.cardBodyCompact}>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Référence / Titre</th>
                      <th>Procédure</th>
                      <th>Prestation</th>
                      <th>Montant estimé</th>
                      <th>Date limite</th>
                      <th>Ouverture des plis</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppels.length === 0 ? (
                      <tr><td colSpan={7}>Aucun appel d'offres disponible.</td></tr>
                    ) : (
                      filteredAppels.map((appel) => {
                        const procLabel = TYPE_PROCEDURE_OPTIONS.find((o) => o.value === appel.type_procedure)?.label || appel.type_procedure;
                        const prestLabel = TYPE_PRESTATION_OPTIONS.find((o) => o.value === appel.type_prestation)?.label || appel.type_prestation;
                        return (
                          <tr
                            key={appel.id_appel_offres}
                            onClick={() => { setSelectedAppelId(appel.id_appel_offres); setActiveTab('marches-edition'); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>
                              <strong>{appel.reference}</strong>
                              <br />
                              <span className={styles.muted}>{appel.titre}</span>
                            </td>
                            <td>{procLabel}</td>
                            <td>{prestLabel}</td>
                            <td>{formatMoney(appel.montant_estime)}</td>
                            <td>{formatDateTime(appel.date_limite_soumission)}</td>
                            <td>{formatDateTime(appel.date_ouverture_plis)}</td>
                            <td><Badge badge={toBadgeFromStatus(appel.statut)} /></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Édition appel d'offres ── */}
      {activeTab === 'marches-edition' && (
        <div className={cn(styles.grid, styles.split65)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h4>{selectedAppel ? `Modifier — ${selectedAppel.reference}` : "Nouvel appel d'offres"}</h4>
              {selectedAppel && <Badge badge={toBadgeFromStatus(selectedAppel.statut)} />}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                <Field label="Référence">
                  <input
                    value={appelDraft.reference}
                    placeholder="ex: AO-2025-001"
                    onChange={(e) => setAppelDraft((d) => ({ ...d, reference: e.target.value }))}
                  />
                </Field>
                <Field label="Titre">
                  <input
                    value={appelDraft.titre}
                    placeholder="Titre de l'appel d'offres"
                    onChange={(e) => setAppelDraft((d) => ({ ...d, titre: e.target.value }))}
                  />
                </Field>
                <Field label="Type de procédure">
                  <select
                    value={appelDraft.type_procedure}
                    onChange={(e) => setAppelDraft((d) => ({ ...d, type_procedure: e.target.value }))}
                  >
                    {TYPE_PROCEDURE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Type de prestation">
                  <select
                    value={appelDraft.type_prestation}
                    onChange={(e) => setAppelDraft((d) => ({ ...d, type_prestation: e.target.value }))}
                  >
                    {TYPE_PRESTATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Visibilité">
                  <select
                    value={appelDraft.visibilite}
                    onChange={(e) => setAppelDraft((d) => ({ ...d, visibilite: e.target.value }))}
                  >
                    {VISIBILITE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Wilaya">
                  <input
                    value={appelDraft.wilaya}
                    placeholder="ex: Alger"
                    onChange={(e) => setAppelDraft((d) => ({ ...d, wilaya: e.target.value }))}
                  />
                </Field>
                <Field label="Localisation" full>
                  <input
                    value={appelDraft.localisation}
                    placeholder="Adresse ou lieu précis"
                    onChange={(e) => setAppelDraft((d) => ({ ...d, localisation: e.target.value }))}
                  />
                </Field>
                <Field label="Description" full>
                  <textarea
                    value={appelDraft.description}
                    rows={3}
                    placeholder="Description de l'objet du marché"
                    onChange={(e) => setAppelDraft((d) => ({ ...d, description: e.target.value }))}
                  />
                </Field>
                <Field label="Montant estimé (DA)">
                  <input
                    type="number"
                    value={appelDraft.montant_estime}
                    placeholder="0"
                    onChange={(e) => setAppelDraft((d) => ({ ...d, montant_estime: e.target.value }))}
                  />
                </Field>
                <Field label="Date de publication">
                  <input
                    type="datetime-local"
                    value={appelDraft.date_publication}
                    onChange={(e) => setAppelDraft((d) => ({ ...d, date_publication: e.target.value }))}
                  />
                </Field>
                <Field label="Date limite de soumission">
                  <input
                    type="datetime-local"
                    value={appelDraft.date_limite_soumission}
                    onChange={(e) => setAppelDraft((d) => ({ ...d, date_limite_soumission: e.target.value }))}
                  />
                </Field>
                <Field label="Date d'ouverture des plis">
                  <input
                    type="datetime-local"
                    value={appelDraft.date_ouverture_plis}
                    onChange={(e) => setAppelDraft((d) => ({ ...d, date_ouverture_plis: e.target.value }))}
                  />
                </Field>
                <Field label="Poids technique (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={appelDraft.poids_technique}
                    onChange={(e) => setAppelDraft((d) => ({ ...d, poids_technique: e.target.value }))}
                  />
                </Field>
                <Field label="Poids financier (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={appelDraft.poids_financier}
                    onChange={(e) => setAppelDraft((d) => ({ ...d, poids_financier: e.target.value }))}
                  />
                </Field>
              </div>

              <div className={styles.btnRow} style={{ marginTop: 20 }}>
                <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void saveAppel()}>
                  Enregistrer
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnSoft)}
                  onClick={() => void runAppelAction('publish', selectedAppel?.id_appel_offres || null)}
                >
                  Publier
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnGhost)}
                  onClick={() => void runAppelAction('close', selectedAppel?.id_appel_offres || null)}
                >
                  Clôturer le dépôt
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnGhost)}
                  onClick={() => void runAppelAction('open', selectedAppel?.id_appel_offres || null)}
                >
                  Ouvrir les plis
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnDanger)}
                  onClick={() => void runAppelAction('cancel', selectedAppel?.id_appel_offres || null)}
                >
                  Annuler l'AO
                </button>
              </div>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}><h4>Appels d'offres</h4></div>
              <div className={styles.cardBodyCompact}>
                <div className={styles.list}>
                  {appels.length === 0 ? (
                    <div className={styles.listItem}>
                      <span className={styles.muted}>Aucun appel d'offres.</span>
                    </div>
                  ) : (
                    appels.slice(0, 8).map((a) => (
                      <div
                        key={a.id_appel_offres}
                        className={styles.listItem}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedAppelId(a.id_appel_offres)}
                      >
                        <Badge badge={toBadgeFromStatus(a.statut)} />
                        <div className={styles.grow}>
                          <strong>{a.reference}</strong>
                          <p className={styles.muted}>{a.titre}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}><h4>Cahier des charges (CDC)</h4></div>
              <div className={styles.cardBody}>
                <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: 12 }}>
                  L'assistant IA peut générer une première version du cahier des charges à partir des informations de l'appel.
                </p>
                <div className={styles.btnRow}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => setShowAiMock((v) => !v)}>
                    {showAiMock ? 'Fermer le CDC' : 'Rédiger CDC'}
                  </button>
                </div>

                {showAiMock && (
                  <div className={cn(styles.hintBox, styles.aiMockPanel)} style={{ marginTop: 16 }}>
                    <h5 style={{ margin: '0 0 10px' }}>Assistant IA — Rédaction CDC</h5>
                    <div className={styles.chatThread}>
                      <div className={cn(styles.chatBubble, styles.chatBubbleUser)}>
                        Je veux rédiger un appel d'offres pour l'acquisition de serveurs et baies de stockage.
                      </div>
                      <div className={cn(styles.chatBubble, styles.chatBubbleAi)}>
                        Je peux proposer une trame de CDC avec objet, périmètre, exigences techniques, critères d'évaluation et calendrier.
                      </div>
                      <div className={cn(styles.chatBubble, styles.chatBubbleUser)}>
                        Commence par l'objet et les exigences minimales.
                      </div>
                      <div className={cn(styles.chatBubble, styles.chatBubbleAi)}>
                        Objet : fourniture, installation et mise en service d'une infrastructure de calcul et de stockage. Exigences minimales : capacité, redondance, support et conformité documentaire.
                      </div>
                    </div>
                    <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--muted)' }}>
                      Aperçu — fonctionnalité disponible dans une prochaine version.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Documents ── */}
      {activeTab === 'marches-documents' && (
        <>
          <div className={cn(styles.grid, styles.split55)}>
            <div className={styles.card}>
              <div className={styles.cardHeader}><h4>Téléverser des documents</h4></div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <Field label="Fichiers à téléverser" full>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setDocFiles(Array.from(e.target.files || []))}
                    />
                    {docFiles.length > 0 && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 4 }}>
                        {docFiles.length} fichier(s) sélectionné(s)
                      </p>
                    )}
                  </Field>
                  <Field label="Associer à l'appel d'offres">
                    <select
                      value={docUploadAppelId ? String(docUploadAppelId) : ''}
                      onChange={(e) => setDocUploadAppelId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">— Sélectionner —</option>
                      {appels.map((a) => (
                        <option key={a.id_appel_offres} value={a.id_appel_offres}>
                          {a.reference} — {a.titre}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Catégorie du document">
                    <select
                      value={docForm.related_type}
                      onChange={(e) => setDocForm((d) => ({ ...d, related_type: e.target.value }))}
                    >
                      {DOCUMENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Chiffrer l'offre financière">
                    <select
                      value={docForm.is_encrypted}
                      onChange={(e) => setDocForm((d) => ({ ...d, is_encrypted: e.target.value }))}
                    >
                      <option value="false">Non</option>
                      <option value="true">Oui</option>
                    </select>
                  </Field>
                  <Field label="Visible à partir du">
                    <input
                      type="datetime-local"
                      value={docForm.visible_after}
                      onChange={(e) => setDocForm((d) => ({ ...d, visible_after: e.target.value }))}
                    />
                  </Field>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 18 }}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void uploadAndAttach()}>
                    Téléverser et associer
                  </button>
                  {pendingDocuments.length > 0 && (
                    <button type="button" className={cn(styles.btn, styles.btnSoft)} onClick={() => void attachPendingDocuments()}>
                      Associer ({pendingDocuments.length} en attente)
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4>Documents rattachés à {selectedAppel?.reference || '—'}</h4>
              </div>
              <div className={styles.cardBodyCompact}>
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Nom du fichier</th>
                        <th>Catégorie</th>
                        <th>Taille</th>
                        <th>Chiffré</th>
                        <th>Statut vérification</th>
                        <th>Visible à partir du</th>
                        <th>Téléversé le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.length === 0 ? (
                        <tr><td colSpan={7}>Aucun document rattaché à cet appel d'offres.</td></tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc.id_document}>
                            <td><strong>{doc.nom}</strong></td>
                            <td>{DOCUMENT_TYPE_OPTIONS.find((o) => o.value === doc.related_type)?.label || doc.related_type}</td>
                            <td>{formatFileSize(doc.taille_fichier)}</td>
                            <td>{doc.is_encrypted ? 'Oui' : 'Non'}</td>
                            <td><Badge badge={toBadgeFromStatus(doc.ia_verif_statut)} /></td>
                            <td>{formatDateTime(doc.visible_after)}</td>
                            <td>{formatDateTime(doc.uploaded_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Soumissions ── */}
      {activeTab === 'marches-soumissions' && (
        <div className={cn(styles.grid, styles.split55)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}><h4>Soumissions reçues</h4></div>
            <div className={styles.cardBodyCompact}>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Soumission</th>
                      <th>Opérateur</th>
                      <th>Conformité</th>
                      <th>Statut</th>
                      <th>Contrat</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {soumissions.length === 0 ? (
                      <tr><td colSpan={6}>Aucune soumission reçue pour cet appel d'offres.</td></tr>
                    ) : (
                      soumissions.map((s) => (
                        <tr
                          key={s.id_soumission}
                          onClick={() => setSelectedSoumissionId(s.id_soumission)}
                          style={{ cursor: 'pointer', background: s.id_soumission === selectedSoumissionId ? 'var(--row-active, rgba(0,0,0,0.03))' : undefined }}
                        >
                          <td><strong>S-{s.id_soumission}</strong></td>
                          <td>Opérateur #{s.id_soumissionnaire}</td>
                          <td><Badge badge={toBadgeFromStatus(s.conformite_statut)} /></td>
                          <td><Badge badge={toBadgeFromStatus(s.statut)} /></td>
                          <td>
                            {s.id_soumission === selectedSoumissionId && selectedContract
                              ? selectedContract.numero_contrat
                              : '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={cn(styles.btn, styles.btnGhost)}
                              onClick={(e) => { e.stopPropagation(); setSelectedSoumissionId(s.id_soumission); }}
                            >
                              Sélectionner
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4>Contrôle de conformité</h4>
                {selectedSoumission && <Badge badge={{ label: `S-${selectedSoumission.id_soumission}`, tone: 'info' }} />}
              </div>
              <div className={styles.cardBody}>
                {!selectedSoumission ? (
                  <p className={styles.muted}>Sélectionnez une soumission pour contrôler sa conformité.</p>
                ) : (
                  <>
                    <div className={styles.formGrid}>
                      <Field label="Décision de conformité">
                        <select
                          value={validationForm.is_validated}
                          onChange={(e) => setValidationForm((f) => ({ ...f, is_validated: e.target.value }))}
                        >
                          <option value="true">Conforme</option>
                          <option value="false">Non conforme</option>
                        </select>
                      </Field>
                      <Field label="Type de validation">
                        <select
                          value={validationForm.type}
                          onChange={(e) => setValidationForm((f) => ({ ...f, type: e.target.value }))}
                        >
                          <option value="interne">Interne</option>
                          <option value="externe">Externe</option>
                          <option value="tutelle">Tutelle</option>
                        </select>
                      </Field>
                      <Field label="Observations" full>
                        <textarea
                          value={validationForm.commentaire}
                          rows={2}
                          placeholder="Motif, remarques ou réserves…"
                          onChange={(e) => setValidationForm((f) => ({ ...f, commentaire: e.target.value }))}
                        />
                      </Field>
                    </div>
                    <div className={styles.btnRow} style={{ marginTop: 14 }}>
                      <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void saveValidation()}>
                        Enregistrer
                      </button>
                      <button type="button" className={cn(styles.btn, styles.btnSoft)} onClick={() => void approveValidation()}>
                        Approuver
                      </button>
                      <button type="button" className={cn(styles.btn, styles.btnDanger)} onClick={() => void rejectValidation()}>
                        Rejeter
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}><h4>Actions sur l'appel d'offres</h4></div>
              <div className={styles.cardBody}>
                <div className={styles.statsStrip}>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>Administrative</div>
                    <strong>{administrativeProgress}</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>Technique</div>
                    <strong>{technicalProgress}</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>Financière</div>
                    <strong>{financialProgress}</strong>
                  </div>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void runAppelAction('open', selectedAppel?.id_appel_offres || null)}>
                    Ouvrir les plis
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnSoft)} onClick={() => void calculateRanking()}>
                    Calculer le classement
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)} onClick={() => void validateNotes()}>
                    Valider les notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Évaluations ── */}
      {activeTab === 'marches-evaluations' && (
        <div className={cn(styles.grid, styles.split55)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}><h4>Commission d'évaluation</h4></div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                <Field label="Nom de la commission">
                  <input
                    value={commissionDraft.nom_comission}
                    placeholder="ex: Commission technique 2025"
                    onChange={(e) => setCommissionDraft((d) => ({ ...d, nom_comission: e.target.value }))}
                  />
                </Field>
                <Field label="Catégorie">
                  <input
                    value={commissionDraft.categorie}
                    placeholder="ex: Technique / Administrative"
                    onChange={(e) => setCommissionDraft((d) => ({ ...d, categorie: e.target.value }))}
                  />
                </Field>
              </div>
              <div className={styles.btnRow} style={{ marginTop: 14 }}>
                <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void saveCommission()}>
                  {selectedCommission ? 'Mettre à jour' : 'Créer la commission'}
                </button>
              </div>

              <div style={{ marginTop: 20 }}>
                <p style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Commissions existantes</p>
                <div className={styles.list}>
                  {evaluationCommissions.length === 0 ? (
                    <div className={styles.listItem}><span className={styles.muted}>Aucune commission.</span></div>
                  ) : (
                    evaluationCommissions.map((c) => (
                      <div
                        key={c.id_comission}
                        className={styles.listItem}
                        style={{ cursor: 'pointer', background: c.id_comission === selectedCommissionId ? 'var(--row-active, rgba(0,0,0,0.03))' : undefined }}
                        onClick={() => setSelectedCommissionId(c.id_comission)}
                      >
                        <Badge badge={{ label: c.categorie || 'commission', tone: 'info' }} />
                        <div className={styles.grow}>
                          <strong>{c.nom_comission}</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4>Membres de la commission</h4>
                {selectedCommission && <Badge badge={{ label: selectedCommission.nom_comission, tone: 'info' }} small />}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <Field label="Identifiant du membre à ajouter" full>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        value={memberToAdd}
                        placeholder="ID numérique du membre"
                        onChange={(e) => setMemberToAdd(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button type="button" className={cn(styles.btn, styles.btnSoft)} onClick={() => void addCommissionMember()}>
                        Ajouter
                      </button>
                    </div>
                    {members.length > 0 && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
                        Membres de votre organisation : {members.map((m) => `${m.member.prenom} ${m.member.nom}`).join(', ')}
                      </p>
                    )}
                  </Field>
                </div>
                <div className={styles.tableWrap} style={{ marginTop: 14 }}>
                  <table>
                    <thead>
                      <tr><th>Membre</th><th>Fonction</th></tr>
                    </thead>
                    <tbody>
                      {commissionMemberIds.length === 0 ? (
                        <tr><td colSpan={2}>Aucun membre dans cette commission.</td></tr>
                      ) : (
                        commissionMemberIds.map((id) => {
                          const found = members.find((m) => String(m.member.id_membre) === String(id));
                          return (
                            <tr key={id}>
                              <td><strong>{found ? `${found.member.prenom} ${found.member.nom}` : `Membre #${id}`}</strong></td>
                              <td>{found?.member.fonction || '—'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}><h4>Affectation des appels d'offres</h4></div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <Field label="Appel d'offres">
                    <select
                      value={selectedAppelId ? String(selectedAppelId) : ''}
                      onChange={(e) => setSelectedAppelId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">— Sélectionner —</option>
                      {appels.map((a) => (
                        <option key={a.id_appel_offres} value={a.id_appel_offres}>
                          {a.reference} — {a.titre}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Commission cible">
                    <select value={affectationTarget} onChange={(e) => setAffectationTarget(e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      {affectationTargets.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Étape d'évaluation">
                    <select value={affectationStep} onChange={(e) => setAffectationStep(e.target.value)}>
                      <option>Administrative</option>
                      <option>Technique</option>
                      <option>Financière</option>
                    </select>
                  </Field>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 14 }}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => notify("L'affectation AO → commission n'est pas encore disponible.")}>
                    Affecter
                  </button>
                </div>
                <div className={styles.statsStrip} style={{ marginTop: 16 }}>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>Administrative</div>
                    <strong>{administrativeProgress}</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>Technique</div>
                    <strong>{technicalProgress}</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>Financière</div>
                    <strong>{financialProgress}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Contrats ── */}
      {activeTab === 'marches-contrats' && (
        <div className={cn(styles.grid, styles.split55)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h4>Contrat</h4>
              {selectedSoumission && <Badge badge={{ label: `Soumission S-${selectedSoumission.id_soumission}`, tone: 'info' }} />}
            </div>
            <div className={styles.cardBody}>
              {!selectedSoumission ? (
                <div className={styles.hintBox}>
                  <p>Sélectionnez d'abord une soumission dans l'onglet Soumissions.</p>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)} style={{ marginTop: 8 }} onClick={() => setActiveTab('marches-soumissions')}>
                    Aller aux soumissions
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.formGrid}>
                    <Field label="Numéro du contrat">
                      <input
                        value={contractDraft.numero_contrat}
                        placeholder="ex: CONT-2025-001"
                        onChange={(e) => setContractDraft((d) => ({ ...d, numero_contrat: e.target.value }))}
                      />
                    </Field>
                    <Field label="Date de signature">
                      <input
                        type="date"
                        value={contractDraft.date_signature}
                        onChange={(e) => setContractDraft((d) => ({ ...d, date_signature: e.target.value }))}
                      />
                    </Field>
                    <Field label="Statut du contrat">
                      <select
                        value={contractDraft.statut}
                        onChange={(e) => setContractDraft((d) => ({ ...d, statut: e.target.value }))}
                      >
                        {CONTRAT_STATUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className={styles.btnRow} style={{ marginTop: 16 }}>
                    <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void saveContract()}>
                      Enregistrer
                    </button>
                    <button type="button" className={cn(styles.btn, styles.btnSoft)} onClick={() => void signContract()}>
                      Signer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><h4>Recours</h4></div>
            <div className={styles.cardBody}>
              {recours.length === 0 ? (
                <div className={styles.listItem}>
                  <Badge badge={{ label: 'aucun', tone: 'gray' }} />
                  <div className={styles.grow}>
                    <strong>Aucun recours</strong>
                    <p className={styles.muted}>Aucun recours déposé pour cette soumission.</p>
                  </div>
                </div>
              ) : (
                <div className={styles.list}>
                  {recours.map((item) => (
                    <div key={item.id_recours} className={styles.listItem}>
                      <Badge badge={toBadgeFromStatus(item.statut)} />
                      <div className={styles.grow}>
                        <strong>Recours R-{item.id_recours}</strong>
                        <p className={styles.muted}>{item.motif}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeRecours && (
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)} onClick={() => void runRecoursAction('instruire')}>
                    Instruire
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnSoft)} onClick={() => void runRecoursAction('decision')}>
                    Décision
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void runRecoursAction('accepter')}>
                    Accepter
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnDanger)} onClick={() => void runRecoursAction('rejeter')}>
                    Rejeter
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)} onClick={() => void runRecoursAction('cloturer')}>
                    Clôturer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
