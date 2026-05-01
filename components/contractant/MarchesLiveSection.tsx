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
  Membre,
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

type AppelDraft = {
  id_service_contractant: number;
  reference: string;
  titre: string;
  type_procedure: string;
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

function buildDefaultAppelDraft(serviceId: number | null): AppelDraft {
  return {
    id_service_contractant: serviceId || 0,
    reference: '',
    titre: '',
    type_procedure: '',
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
  if (!appel) {
    return buildDefaultAppelDraft(serviceId);
  }

  return {
    id_service_contractant: appel.id_service_contractant,
    reference: appel.reference || '',
    titre: appel.titre || '',
    type_procedure: appel.type_procedure || '',
    description: appel.description || '',
    montant_estime: String(appel.montant_estime || ''),
    date_publication: formatDateTimeInput(appel.date_publication),
    date_limite_soumission: formatDateTimeInput(appel.date_limite_soumission),
    date_ouverture_plis: formatDateTimeInput(appel.date_ouverture_plis),
    poids_technique: String(appel.poids_technique || 50),
    poids_financier: String(appel.poids_financier || 50),
  };
}

function buildContractDraft(contrat: Contrat | null): ContractDraft {
  if (!contrat) {
    return {
      numero_contrat: '',
      date_signature: '',
      statut: 'en_preparation',
    };
  }

  return {
    numero_contrat: contrat.numero_contrat || '',
    date_signature: formatDateInput(contrat.date_signature),
    statut: contrat.statut || 'en_preparation',
  };
}

function buildCommissionDraft(commission: CommissionEvaluation | null): CommissionDraft {
  if (!commission) {
    return {
      id: '',
      nom_comission: '',
      categorie: '',
    };
  }

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
    type_procedure: draft.type_procedure.trim(),
    type_prestation: source?.type_prestation || 'fournitures',
    visibilite: source?.visibilite || 'public',
    wilaya: source?.wilaya || '',
    localisation: source?.localisation || '',
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
  if (Array.isArray(payload)) {
    return payload as DocumentMetadata[];
  }

  if (payload && typeof payload === 'object') {
    const value = payload as {
      documents?: DocumentMetadata | DocumentMetadata[];
      id_document?: number;
    };

    if (Array.isArray(value.documents)) {
      return value.documents;
    }

    if (value.documents && typeof value.documents === 'object') {
      return [value.documents];
    }

    if (typeof value.id_document === 'number') {
      return [value as DocumentMetadata];
    }
  }

  return [];
}

function getUploadErrorMessages(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return [] as string[];
  }

  const value = payload as {
    errors?: Array<{ filename?: string; error?: string }>;
  };

  return (value.errors || []).map((item) => {
    if (item.filename && item.error) {
      return `${item.filename}: ${item.error}`;
    }
    return item.error || 'Téléversement incomplet.';
  });
}

function downloadAppelsAsCsv(appels: AppelOffre[]) {
  if (typeof window === 'undefined') {
    return;
  }

  const rows = [
    ['reference', 'titre', 'type_procedure', 'montant_estime', 'date_publication', 'date_limite_soumission', 'statut'],
    ...appels.map((appel) => [
      appel.reference,
      appel.titre,
      appel.type_procedure,
      String(appel.montant_estime || ''),
      appel.date_publication || '',
      appel.date_limite_soumission || '',
      appel.statut || '',
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'appels-offres.csv';
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function MarchesLiveSection() {
  const { currentUser, error, isLoading, service, serviceResolutionWarning } = useServiceContractant();
  const [activeTab, setActiveTab] = useState<MarchesTab>('marches-appels');
  const [showAiMock, setShowAiMock] = useState(false);
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
  const [commissionMembers, setCommissionMembers] = useState<Membre[]>([]);
  const [commissionDraft, setCommissionDraft] = useState<CommissionDraft>(buildCommissionDraft(null));
  const [appelDraft, setAppelDraft] = useState<AppelDraft>(buildDefaultAppelDraft(service?.id_service || null));
  const [documentSingle, setDocumentSingle] = useState<File | null>(null);
  const [documentMulti, setDocumentMulti] = useState<File[]>([]);
  const [documentForm, setDocumentForm] = useState({
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
  const [affectationType, setAffectationType] = useState('Commission interne');
  const [affectationTarget, setAffectationTarget] = useState('');
  const [affectationStep, setAffectationStep] = useState('Technique');

  const filteredAppels = useMemo(
    () =>
      appels.filter((appel) => {
        const matchesSearch =
          !searchTerm ||
          appel.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appel.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appel.type_procedure.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Tous' || appel.statut === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [appels, searchTerm, statusFilter]
  );

  const selectedAppel = useMemo(
    () => appels.find((appel) => appel.id_appel_offres === selectedAppelId) || null,
    [appels, selectedAppelId]
  );

  const selectedSoumission = useMemo(
    () => soumissions.find((soumission) => soumission.id_soumission === selectedSoumissionId) || null,
    [selectedSoumissionId, soumissions]
  );

  const selectedValidation = useMemo(
    () => validations.find((validation) => validation.id_soumission === selectedSoumissionId) || null,
    [selectedSoumissionId, validations]
  );

  const selectedCommission = useMemo(
    () =>
      evaluationCommissions.find((commission) => commission.id_comission === selectedCommissionId) || null,
    [evaluationCommissions, selectedCommissionId]
  );

  const currentDocument = pendingDocuments[0] || documents[0] || null;

  const affectationTargets = useMemo(
    () => [
      ...evaluationCommissions.map((commission) => ({
        value: `evaluation-${commission.id_comission}`,
        label: `COM-${commission.id_comission} — ${commission.nom_comission}`,
      })),
      ...commissionInterneOptions.map((commission) => ({
        value: `interne-${commission.id_comission_interne}`,
        label: `CIN-${commission.id_comission_interne} — ${commission.nom_comission}`,
      })),
      ...commissionExterneOptions.map((commission) => ({
        value: `externe-${commission.id_comission_externe}`,
        label: `CEX-${commission.id_comission_externe} — ${commission.nom_comission}`,
      })),
    ],
    [commissionExterneOptions, commissionInterneOptions, evaluationCommissions]
  );

  const statusOptions = useMemo(
    () => ['Tous', ...Array.from(new Set(appels.map((appel) => appel.statut).filter(Boolean)))],
    [appels]
  );

  const administrativeProgress = `${validations.length}/${soumissions.length || 0}`;
  const technicalProgress = `${new Set(evaluations.map((item) => item.id_soumission)).size}/${soumissions.length || 0}`;
  const financialProgress = `${classement.length}/${soumissions.length || 0}`;

  const loadAppels = useCallback(async () => {
    if (!service) {
      setAppels([]);
      return;
    }

    const loadedAppels = await serviceContractantApi.listAppels({ service_id: service.id_service }).catch(() => []);
    setAppels(loadedAppels);
  }, [service]);

  const loadCommissions = useCallback(async () => {
    if (!service) {
      setEvaluationCommissions([]);
      setCommissionInterneOptions([]);
      setCommissionExterneOptions([]);
      return;
    }

    const [serviceCommissions, externalCommissions] = await Promise.all([
      serviceContractantApi
        .getServiceCommissions(service.id_service)
        .catch(() => ({ commissions_evaluation: [], commissions_internes: [] })),
      serviceContractantApi.getCommissionsExternes().catch(() => []),
    ]);

    setEvaluationCommissions(serviceCommissions.commissions_evaluation);
    setCommissionInterneOptions(serviceCommissions.commissions_internes);
    setCommissionExterneOptions(externalCommissions);
  }, [service]);

  const loadAppelChildren = useCallback(async (appelId: number | null) => {
    if (!appelId) {
      setDocuments([]);
      setSoumissions([]);
      return;
    }

    const [links, loadedSoumissions] = await Promise.all([
      serviceContractantApi.getAppelDocuments(appelId).catch(() => []),
      serviceContractantApi.listAppelSoumissions(appelId).catch(() => []),
    ]);

    const loadedDocuments = await Promise.all(
      links.map((link) => serviceContractantApi.getDocument(link.id_document).catch(() => null))
    );

    setDocuments(loadedDocuments.filter(Boolean) as DocumentMetadata[]);
    setSoumissions(loadedSoumissions);
  }, []);

  const loadSoumissionChildren = useCallback(async (soumissionId: number | null) => {
    if (!soumissionId) {
      setValidations([]);
      setEvaluations([]);
      setRecours([]);
      setSelectedContract(null);
      return;
    }

    const [loadedValidations, loadedEvaluations, loadedRecours, loadedContract] = await Promise.all([
      serviceContractantApi.listValidations().catch(() => []),
      serviceContractantApi.listSoumissionEvaluations(soumissionId).catch(() => []),
      serviceContractantApi.listRecours().catch(() => []),
      serviceContractantApi.getContratBySoumission(soumissionId).catch(() => null),
    ]);

    setValidations(loadedValidations.filter((item) => item.id_soumission === soumissionId));
    setEvaluations(loadedEvaluations);
    setRecours(loadedRecours.filter((item) => item.id_soumission === soumissionId));
    setSelectedContract(loadedContract);
  }, []);

  useEffect(() => {
    void loadAppels();
    void loadCommissions();
  }, [loadAppels, loadCommissions]);

  useEffect(() => {
    if (selectedAppelId && !appels.some((appel) => appel.id_appel_offres === selectedAppelId)) {
      setSelectedAppelId(appels[0]?.id_appel_offres || null);
      return;
    }

    if (!selectedAppelId && appels[0]) {
      setSelectedAppelId(appels[0].id_appel_offres);
    }
  }, [appels, selectedAppelId]);

  useEffect(() => {
    if (selectedCommissionId && !evaluationCommissions.some((item) => item.id_comission === selectedCommissionId)) {
      setSelectedCommissionId(evaluationCommissions[0]?.id_comission || null);
      return;
    }

    if (!selectedCommissionId && evaluationCommissions[0]) {
      setSelectedCommissionId(evaluationCommissions[0].id_comission);
    }
  }, [evaluationCommissions, selectedCommissionId]);

  useEffect(() => {
    setAppelDraft(buildAppelDraft(selectedAppel, service?.id_service || null));
    void loadAppelChildren(selectedAppelId);
  }, [loadAppelChildren, selectedAppel, selectedAppelId, service]);

  useEffect(() => {
    if (selectedSoumissionId && !soumissions.some((soumission) => soumission.id_soumission === selectedSoumissionId)) {
      setSelectedSoumissionId(soumissions[0]?.id_soumission || null);
      return;
    }

    if (!selectedSoumissionId && soumissions[0]) {
      setSelectedSoumissionId(soumissions[0].id_soumission);
    }
  }, [selectedSoumissionId, soumissions]);

  useEffect(() => {
    if (selectedValidation) {
      setValidationForm({
        is_validated:
          selectedValidation.is_validated === true
            ? 'true'
            : selectedValidation.is_validated === false
              ? 'false'
              : 'true',
        type: selectedValidation.type || 'interne',
        commentaire: selectedValidation.commentaire || '',
      });
      return;
    }

    setValidationForm({
      is_validated: 'true',
      type: 'interne',
      commentaire: '',
    });
  }, [selectedValidation]);

  useEffect(() => {
    setContractDraft(buildContractDraft(selectedContract));
  }, [selectedContract]);

  useEffect(() => {
    setCommissionDraft(buildCommissionDraft(selectedCommission));
  }, [selectedCommission]);

  useEffect(() => {
    void loadSoumissionChildren(selectedSoumissionId);
  }, [loadSoumissionChildren, selectedSoumissionId]);

  useEffect(() => {
    if (!selectedAppelId || !selectedCommissionId) {
      setClassement([]);
      return;
    }

    void serviceContractantApi
      .getClassement(selectedAppelId, selectedCommissionId)
      .then((response) => setClassement(response.classement || []))
      .catch(() => setClassement([]));
  }, [selectedAppelId, selectedCommissionId]);

  useEffect(() => {
    if (!selectedCommissionId) {
      setCommissionMembers([]);
      return;
    }

    const commissionId = selectedCommissionId;

    async function loadMembers() {
      const links = await serviceContractantApi
        .getCommissionEvaluationMembers(commissionId)
        .catch(() => []);
      const loadedMembers = await Promise.all(
        links.map((link) => serviceContractantApi.getMembre(link.id_membre).catch(() => null))
      );
      setCommissionMembers(loadedMembers.filter(Boolean) as Membre[]);
    }

    void loadMembers();
  }, [selectedCommissionId]);

  useEffect(() => {
    if (affectationTarget && !affectationTargets.some((item) => item.value === affectationTarget)) {
      setAffectationTarget(affectationTargets[0]?.value || '');
      return;
    }

    if (!affectationTarget && affectationTargets[0]) {
      setAffectationTarget(affectationTargets[0].value);
    }
  }, [affectationTarget, affectationTargets]);

  const resetAppelForm = () => {
    setSelectedAppelId(null);
    setAppelDraft(buildDefaultAppelDraft(service?.id_service || null));
    setShowAiMock(false);
  };

  const saveAppel = async () => {
    if (!service) {
      notify('Service contractant non chargé.');
      return;
    }

    const payload = buildAppelPayload(appelDraft, selectedAppel, service.id_service);

    try {
      const savedAppel = selectedAppel
        ? await serviceContractantApi.updateAppel(selectedAppel.id_appel_offres, payload)
        : await serviceContractantApi.createAppel(payload);

      await loadAppels();
      setSelectedAppelId(savedAppel.id_appel_offres);
      setActiveTab('marches-appels');
      notify(selectedAppel ? 'Appel d’offres mis à jour.' : 'Appel d’offres créé.');
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'Enregistrement impossible.');
    }
  };

  const runAppelAction = async (
    action: 'publish' | 'close' | 'open' | 'cancel',
    appelId: number | null
  ) => {
    if (!appelId) {
      notify('Sélectionnez un appel d’offres existant.');
      return;
    }

    try {
      if (action === 'publish') {
        await serviceContractantApi.publishAppel(appelId);
      } else if (action === 'close') {
        await serviceContractantApi.closeDepot(appelId);
      } else if (action === 'open') {
        await serviceContractantApi.openPlisWorkflow(appelId);
        await serviceContractantApi.openBids(appelId);
      } else {
        await serviceContractantApi.cancelAppel(appelId);
      }

      await loadAppels();
      notify('Action exécutée.');
    } catch (actionError) {
      notify(actionError instanceof Error ? actionError.message : 'Action impossible.');
    }
  };

  const uploadDocuments = async () => {
    if (!documentSingle && documentMulti.length === 0) {
      notify('Sélectionnez un fichier.');
      return;
    }

    const formData = new FormData();
    formData.append('related_type', documentForm.related_type);
    formData.append('is_encrypted', documentForm.is_encrypted);

    if (documentForm.visible_after) {
      formData.append('visible_after', toIsoDateTime(documentForm.visible_after) || '');
    }

    if (documentMulti.length > 0) {
      documentMulti.forEach((file) => formData.append('files', file));
    } else if (documentSingle) {
      formData.append('file', documentSingle);
    }

    try {
      const response = await serviceContractantApi.uploadDocuments(formData);
      const uploadedDocuments = getUploadedDocuments(response);
      const uploadErrors = getUploadErrorMessages(response);

      if (uploadedDocuments.length > 0) {
        setPendingDocuments(uploadedDocuments);
      }

      if (uploadErrors.length > 0) {
        notify(uploadErrors.join('\n'));
        return;
      }

      notify(
        uploadedDocuments.length > 1
          ? `${uploadedDocuments.length} documents téléversés.`
          : 'Document téléversé.'
      );
    } catch (uploadError) {
      notify(uploadError instanceof Error ? uploadError.message : 'Téléversement impossible.');
    }
  };

  const attachPendingDocuments = async () => {
    if (!selectedAppelId) {
      notify('Sélectionnez un appel d’offres.');
      return;
    }

    if (pendingDocuments.length === 0) {
      notify('Aucun document en attente d’association.');
      return;
    }

    try {
      await Promise.all(
        pendingDocuments.map((document) =>
          serviceContractantApi.addAppelDocument(selectedAppelId, document.id_document)
        )
      );
      await loadAppelChildren(selectedAppelId);
      setPendingDocuments([]);
      notify('Documents associés à l’appel d’offres.');
    } catch (attachError) {
      notify(attachError instanceof Error ? attachError.message : 'Association impossible.');
    }
  };

  const saveValidation = async (forcedStatus?: boolean | null) => {
    if (!currentUser) {
      notify('Utilisateur non chargé.');
      return;
    }

    if (!selectedSoumissionId) {
      notify('Sélectionnez une soumission.');
      return;
    }

    const payload = {
      id_utilisateur: currentUser.id_utilisateur,
      id_soumission: selectedSoumissionId,
      type: validationForm.type,
      is_validated:
        forcedStatus !== undefined
          ? forcedStatus
          : validationForm.is_validated === 'true'
            ? true
            : validationForm.is_validated === 'false'
              ? false
              : null,
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
    } catch (validationError) {
      notify(validationError instanceof Error ? validationError.message : 'Validation impossible.');
    }
  };

  const approveSelectedValidation = async () => {
    if (!selectedSoumissionId) {
      notify('Sélectionnez une soumission.');
      return;
    }

    try {
      if (selectedValidation) {
        await serviceContractantApi.approveValidation(selectedValidation.id_validation);
      } else {
        await saveValidation(true);
        return;
      }

      await loadSoumissionChildren(selectedSoumissionId);
      notify('Validation approuvée.');
    } catch (approveError) {
      notify(approveError instanceof Error ? approveError.message : 'Approbation impossible.');
    }
  };

  const rejectSelectedValidation = async () => {
    if (!selectedSoumissionId) {
      notify('Sélectionnez une soumission.');
      return;
    }

    try {
      if (selectedValidation) {
        await serviceContractantApi.rejectValidation(
          selectedValidation.id_validation,
          validationForm.commentaire || 'Validation rejetée.'
        );
      } else {
        await saveValidation(false);
        return;
      }

      await loadSoumissionChildren(selectedSoumissionId);
      notify('Validation rejetée.');
    } catch (rejectError) {
      notify(rejectError instanceof Error ? rejectError.message : 'Rejet impossible.');
    }
  };

  const calculateRanking = async () => {
    if (!selectedAppelId || !selectedCommissionId) {
      notify('Sélectionnez un appel d’offres et une commission.');
      return;
    }

    try {
      const response = await serviceContractantApi.calculateClassement(selectedAppelId, selectedCommissionId);
      setClassement(response.classement || []);
      notify('Classement calculé.');
    } catch (rankingError) {
      notify(rankingError instanceof Error ? rankingError.message : 'Calcul impossible.');
    }
  };

  const validateCommissionNotes = async () => {
    if (!selectedAppelId || !selectedCommissionId) {
      notify('Sélectionnez un appel d’offres et une commission.');
      return;
    }

    try {
      await serviceContractantApi.validateNotes(selectedAppelId, selectedCommissionId);
      notify('Notes validées.');
    } catch (notesError) {
      notify(notesError instanceof Error ? notesError.message : 'Validation des notes impossible.');
    }
  };

  const saveCommission = async () => {
    if (!service) {
      notify('Service contractant non chargé.');
      return;
    }

    if (!commissionDraft.nom_comission.trim()) {
      notify('Renseignez le nom de la commission.');
      return;
    }

    const enteredId = Number(commissionDraft.id || 0);
    const matchedCommission =
      evaluationCommissions.find((commission) => commission.id_comission === enteredId) || null;
    const targetCommission =
      matchedCommission ||
      (selectedCommissionId
        ? evaluationCommissions.find((commission) => commission.id_comission === selectedCommissionId) || null
        : null);

    try {
      const savedCommission = targetCommission
        ? await serviceContractantApi.updateCommissionEvaluation(targetCommission.id_comission, {
            id_service: service.id_service,
            nom_comission: commissionDraft.nom_comission,
            categorie: commissionDraft.categorie,
          })
        : await serviceContractantApi.createCommissionEvaluation({
            id_service: service.id_service,
            nom_comission: commissionDraft.nom_comission,
            categorie: commissionDraft.categorie,
          });

      await loadCommissions();
      setSelectedCommissionId(savedCommission.id_comission);
      notify(targetCommission ? 'Commission mise à jour.' : 'Commission créée.');
    } catch (commissionError) {
      notify(commissionError instanceof Error ? commissionError.message : 'Commission impossible à enregistrer.');
    }
  };

  const addCommissionMember = async () => {
    if (!selectedCommissionId) {
      notify('Sélectionnez une commission.');
      return;
    }

    const value = promptValue('Id du membre à ajouter à la commission');
    const membreId = Number(value || 0);

    if (!membreId) {
      return;
    }

    try {
      await serviceContractantApi.addCommissionEvaluationMember(selectedCommissionId, membreId);
      const links = await serviceContractantApi.getCommissionEvaluationMembers(selectedCommissionId).catch(() => []);
      const loadedMembers = await Promise.all(
        links.map((link) => serviceContractantApi.getMembre(link.id_membre).catch(() => null))
      );
      setCommissionMembers(loadedMembers.filter(Boolean) as Membre[]);
      notify('Membre ajouté à la commission.');
    } catch (memberError) {
      notify(memberError instanceof Error ? memberError.message : 'Ajout impossible.');
    }
  };

  const saveContract = async () => {
    if (!service) {
      notify('Service contractant non chargé.');
      return;
    }

    if (!selectedSoumissionId) {
      notify('Sélectionnez une soumission.');
      return;
    }

    try {
      const payload = {
        id_soumission: selectedSoumissionId,
        id_service_contractants: service.id_service,
        numero_contrat: contractDraft.numero_contrat,
        date_signature: contractDraft.date_signature ? new Date(contractDraft.date_signature).toISOString() : null,
        statut: contractDraft.statut,
      };

      const savedContract = selectedContract
        ? await serviceContractantApi.updateContrat(selectedContract.id_contrat, payload)
        : await serviceContractantApi.createContrat(payload);

      setSelectedContract(savedContract);
      notify(selectedContract ? 'Contrat mis à jour.' : 'Contrat créé.');
    } catch (contractError) {
      notify(contractError instanceof Error ? contractError.message : 'Contrat impossible à enregistrer.');
    }
  };

  const signSelectedContract = async () => {
    if (!selectedContract) {
      notify('Aucun contrat disponible pour cette soumission.');
      return;
    }

    try {
      const signedContract = await serviceContractantApi.signContrat(selectedContract.id_contrat);
      setSelectedContract(signedContract);
      notify('Contrat signé.');
    } catch (signError) {
      notify(signError instanceof Error ? signError.message : 'Signature impossible.');
    }
  };

  const activeRecours = recours[0] || null;

  const runRecoursAction = async (
    action: 'instruire' | 'decision' | 'accepter' | 'rejeter' | 'cloturer'
  ) => {
    if (!activeRecours) {
      notify('Aucun recours disponible pour cette soumission.');
      return;
    }

    if (action === 'decision' && !currentUser) {
      notify('Utilisateur non chargé.');
      return;
    }

    try {
      if (action === 'instruire') {
        await serviceContractantApi.instruireRecours(activeRecours.id_recours);
      } else if (action === 'decision') {
        const decision = promptValue('Décision à enregistrer', activeRecours.decision || '');
        if (!decision) {
          return;
        }
        await serviceContractantApi.decideRecours(activeRecours.id_recours, {
          decision,
          traite_par: currentUser!.id_utilisateur,
        });
      } else if (action === 'accepter') {
        await serviceContractantApi.acceptRecours(activeRecours.id_recours);
      } else if (action === 'rejeter') {
        await serviceContractantApi.rejectRecours(activeRecours.id_recours);
      } else {
        await serviceContractantApi.closeRecours(activeRecours.id_recours);
      }

      if (selectedSoumissionId) {
        await loadSoumissionChildren(selectedSoumissionId);
      }
      notify('Action sur le recours exécutée.');
    } catch (recoursError) {
      notify(recoursError instanceof Error ? recoursError.message : 'Action impossible sur le recours.');
    }
  };

  return (
    <>
      <LoadingOrErrorBlock isLoading={isLoading} error={error} />

      <SectionHeader
        title="Marchés"
        description="Gérez les appels d’offres, les documents, les soumissions et les contrats."
      />

      {serviceResolutionWarning && (
        <div className={styles.card} style={{ marginBottom: 18 }}>
          <div className={styles.cardBody}>
            <div className={styles.hintBox}>
              <h5>Résolution du service</h5>
              <p>{serviceResolutionWarning}</p>
            </div>
          </div>
        </div>
      )}

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

      {activeTab === 'marches-appels' && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.field} style={{ minWidth: 240 }}>
                <label>Recherche</label>
                <input
                  type="search"
                  placeholder="Référence, titre, procédure…"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className={styles.field} style={{ minWidth: 220 }}>
                <label>Statut</label>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.toolbarRight}>
              <button
                type="button"
                className={cn(styles.btn, styles.btnPrimary)}
                onClick={() => {
                  resetAppelForm();
                  setActiveTab('marches-edition');
                }}
              >
                Nouvel appel d’offres
              </button>
              <button
                type="button"
                className={cn(styles.btn, styles.btnGhost)}
                onClick={() => downloadAppelsAsCsv(filteredAppels)}
              >
                Exporter la liste
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Liste des appels d’offres</h4>
              </div>
            </div>
            <div className={styles.cardBodyCompact}>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Référence / titre</th>
                      <th>Type de procédure</th>
                      <th>Montant estimé</th>
                      <th>Date publication</th>
                      <th>Date limite</th>
                      <th>Ouverture des plis</th>
                      <th>Statut</th>
                      <th>Poids</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppels.length === 0 ? (
                      <tr>
                        <td colSpan={8}>Aucun appel d’offres disponible.</td>
                      </tr>
                    ) : (
                      filteredAppels.map((appel) => (
                        <tr
                          key={appel.id_appel_offres}
                          onClick={() => {
                            setSelectedAppelId(appel.id_appel_offres);
                            setActiveTab('marches-edition');
                          }}
                        >
                          <td>
                            <strong>{appel.reference}</strong>
                            <br />
                            <span style={{ color: 'var(--muted)' }}>{appel.titre}</span>
                          </td>
                          <td>{appel.type_procedure}</td>
                          <td>{formatMoney(appel.montant_estime)}</td>
                          <td>{formatDateTime(appel.date_publication)}</td>
                          <td>{formatDateTime(appel.date_limite_soumission)}</td>
                          <td>{formatDateTime(appel.date_ouverture_plis)}</td>
                          <td>
                            <Badge badge={toBadgeFromStatus(appel.statut)} />
                          </td>
                          <td>
                            {appel.poids_technique} / {appel.poids_financier}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'marches-edition' && (
        <div className={cn(styles.grid, styles.split65)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Fiche appel d’offres</h4>
              </div>
              <Badge badge={{ label: 'service contractant', tone: 'info' }} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                <ReadonlyField
                  label="Id service contractant"
                  value={service ? String(service.id_service) : '—'}
                />
                <Field label="Référence">
                  <input
                    value={appelDraft.reference}
                    onChange={(event) =>
                      setAppelDraft((current) => ({ ...current, reference: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Titre">
                  <input
                    value={appelDraft.titre}
                    onChange={(event) =>
                      setAppelDraft((current) => ({ ...current, titre: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Type de procédure">
                  <input
                    value={appelDraft.type_procedure}
                    onChange={(event) =>
                      setAppelDraft((current) => ({ ...current, type_procedure: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Description" full>
                  <textarea
                    value={appelDraft.description}
                    onChange={(event) =>
                      setAppelDraft((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Montant estimé">
                  <input
                    value={appelDraft.montant_estime}
                    onChange={(event) =>
                      setAppelDraft((current) => ({ ...current, montant_estime: event.target.value }))
                    }
                  />
                </Field>
                <ReadonlyField label="Statut" value={selectedAppel?.statut || 'brouillon'} />
                <Field label="Date de publication">
                  <input
                    type="datetime-local"
                    value={appelDraft.date_publication}
                    onChange={(event) =>
                      setAppelDraft((current) => ({ ...current, date_publication: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Date limite de soumission">
                  <input
                    type="datetime-local"
                    value={appelDraft.date_limite_soumission}
                    onChange={(event) =>
                      setAppelDraft((current) => ({ ...current, date_limite_soumission: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Date d’ouverture des plis">
                  <input
                    type="datetime-local"
                    value={appelDraft.date_ouverture_plis}
                    onChange={(event) =>
                      setAppelDraft((current) => ({ ...current, date_ouverture_plis: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Poids technique">
                  <input
                    type="number"
                    value={appelDraft.poids_technique}
                    onChange={(event) =>
                      setAppelDraft((current) => ({ ...current, poids_technique: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Poids financier">
                  <input
                    type="number"
                    value={appelDraft.poids_financier}
                    onChange={(event) =>
                      setAppelDraft((current) => ({ ...current, poids_financier: event.target.value }))
                    }
                  />
                </Field>
              </div>

              <div className={styles.btnRow} style={{ marginTop: 18 }}>
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
                  className={cn(styles.btn, styles.btnGhost)}
                  onClick={() => setShowAiMock(true)}
                >
                  Suggestions IA
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnDanger)}
                  onClick={() => void runAppelAction('cancel', selectedAppel?.id_appel_offres || null)}
                >
                  Annuler
                </button>
              </div>

              {showAiMock && (
                <div className={cn(styles.hintBox, styles.aiMockPanel)}>
                  <div className={styles.inlineRow}>
                    <h5 style={{ margin: 0 }}>Conversation IA — aide à la rédaction du CDC</h5>
                    <button
                      type="button"
                      className={cn(styles.btn, styles.btnGhost)}
                      onClick={() => setShowAiMock(false)}
                    >
                      Fermer
                    </button>
                  </div>
                  <div className={styles.chatThread}>
                    <div className={cn(styles.chatBubble, styles.chatBubbleUser)}>
                      Je veux rédiger un appel d’offres pour l’acquisition de serveurs et baies de stockage. Donne-moi
                      une base claire et non discriminante.
                    </div>
                    <div className={cn(styles.chatBubble, styles.chatBubbleAi)}>
                      Je peux proposer une trame de CDC avec objet, périmètre, exigences techniques, critères
                      d’évaluation et calendrier. Je peux aussi reformuler les exigences trop restrictives.
                    </div>
                    <div className={cn(styles.chatBubble, styles.chatBubbleUser)}>
                      Commence par l’objet, le périmètre et les exigences minimales.
                    </div>
                    <div className={cn(styles.chatBubble, styles.chatBubbleAi)}>
                      Brouillon proposé : objet du marché, fourniture, installation et mise en service d’une
                      infrastructure de calcul et de stockage. Périmètre : livraison, intégration, tests,
                      documentation et garantie. Exigences minimales : capacité, redondance, support, délais de mise
                      en service et conformité documentaire.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Aide IA disponible</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.list}>
                  <div className={styles.listItem}>
                    <Badge badge={{ label: 'CDC', tone: 'info' }} />
                    <div className={styles.grow}>
                      <strong>Rédiger un CDC</strong>
                      <p>Lancer l’assistant de rédaction pour produire un cahier des charges initial.</p>
                    </div>
                  </div>
                  <div className={styles.listItem}>
                    <Badge badge={{ label: 'CDC', tone: 'info' }} />
                    <div className={styles.grow}>
                      <strong>Réviser un CDC</strong>
                      <p>Réviser un texte existant pour améliorer sa qualité et limiter les biais.</p>
                    </div>
                  </div>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnPrimary)}
                    onClick={() => setShowAiMock(true)}
                  >
                    Rédiger
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnGhost)}
                    onClick={() => setShowAiMock(true)}
                  >
                    Réviser
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Lecture rapide</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.hintBox}>
                  <h5>Ce qui reste côté backend</h5>
                  <p>
                    Les actions d’assistance IA visibles ici sont conservées dans le frontend, mais le backend
                    contractant n’expose pas encore de flux dédié pour les exécuter depuis cette page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marches-documents' && (
        <>
          <div className={cn(styles.grid, styles.split55)}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Téléversement GED</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <Field label="Fichier unique">
                    <input
                      type="file"
                      onChange={(event) => setDocumentSingle(event.target.files?.[0] || null)}
                    />
                  </Field>
                  <Field label="Fichiers multiples">
                    <input
                      type="file"
                      multiple
                      onChange={(event) => setDocumentMulti(Array.from(event.target.files || []))}
                    />
                  </Field>
                  <Field label="related_type">
                    <input
                      value={documentForm.related_type}
                      onChange={(event) =>
                        setDocumentForm((current) => ({ ...current, related_type: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="is_encrypted">
                    <select
                      value={documentForm.is_encrypted}
                      onChange={(event) =>
                        setDocumentForm((current) => ({ ...current, is_encrypted: event.target.value }))
                      }
                    >
                      <option>false</option>
                      <option>true</option>
                    </select>
                  </Field>
                  <Field label="visible_after">
                    <input
                      type="datetime-local"
                      value={documentForm.visible_after}
                      onChange={(event) =>
                        setDocumentForm((current) => ({ ...current, visible_after: event.target.value }))
                      }
                    />
                  </Field>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 18 }}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void uploadDocuments()}>
                    Téléverser
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnGhost)}
                    onClick={() => void attachPendingDocuments()}
                  >
                    Associer à l’appel d’offres
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Métadonnées document</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.statsStrip}>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>hash</div>
                    <strong>{currentDocument?.hash_sha256 || '—'}</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>ia_verif_statut</div>
                    <strong>{currentDocument?.ia_verif_statut || 'PENDING'}</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>visibilité</div>
                    <strong>{formatDateTime(currentDocument?.visible_after)}</strong>
                  </div>
                </div>
                <div className={styles.footerNote}>
                  Les documents listés ci-dessous conservent les métadonnées utiles : nom, type_document,
                  related_type, taille_fichier, hash_sha256, uploaded_at, visible_after et statut de vérification IA.
                </div>
                {pendingDocuments.length > 0 && (
                  <div className={styles.footerNote}>
                    {pendingDocuments.length} document(s) téléversé(s) en attente d’association à l’appel d’offres.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.card} style={{ marginTop: 18 }}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Documents rattachés à {selectedAppel?.reference || '—'}</h4>
              </div>
            </div>
            <div className={styles.cardBodyCompact}>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>type_document</th>
                      <th>related_type</th>
                      <th>Taille</th>
                      <th>Chiffré</th>
                      <th>Statut IA</th>
                      <th>visible_after</th>
                      <th>uploaded_at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.length === 0 ? (
                      <tr>
                        <td colSpan={8}>Aucun document rattaché.</td>
                      </tr>
                    ) : (
                      documents.map((document) => (
                        <tr key={document.id_document}>
                          <td>
                            <strong>{document.nom}</strong>
                          </td>
                          <td>{document.type_document}</td>
                          <td>{document.related_type}</td>
                          <td>{formatFileSize(document.taille_fichier)}</td>
                          <td>{document.is_encrypted ? 'oui' : 'non'}</td>
                          <td>
                            <Badge badge={toBadgeFromStatus(document.ia_verif_statut)} />
                          </td>
                          <td>{formatDateTime(document.visible_after)}</td>
                          <td>{formatDateTime(document.uploaded_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'marches-soumissions' && (
        <div className={cn(styles.grid, styles.split55)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Soumissions reçues</h4>
              </div>
            </div>
            <div className={styles.cardBodyCompact}>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Soumission</th>
                      <th>Opérateur</th>
                      <th>Conformité</th>
                      <th>Évaluation</th>
                      <th>Contrat</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soumissions.length === 0 ? (
                      <tr>
                        <td colSpan={6}>Aucune soumission reçue pour cet appel d’offres.</td>
                      </tr>
                    ) : (
                      soumissions.map((soumission) => (
                        <tr key={soumission.id_soumission}>
                          <td>
                            <strong>S-{soumission.id_soumission}</strong>
                          </td>
                          <td>Opérateur #{soumission.id_soumissionnaire}</td>
                          <td>
                            <Badge badge={toBadgeFromStatus(soumission.conformite_statut)} />
                          </td>
                          <td>
                            {soumission.id_soumission === selectedSoumissionId && evaluations.length > 0
                              ? `${evaluations.length} évaluation(s)`
                              : soumission.statut || 'Non démarrée'}
                          </td>
                          <td>
                            {soumission.id_soumission === selectedSoumissionId && selectedContract
                              ? selectedContract.numero_contrat
                              : '—'}
                          </td>
                          <td>
                            <div className={styles.btnRow}>
                              <button
                                type="button"
                                className={cn(styles.btn, styles.btnGhost)}
                                onClick={() => setSelectedSoumissionId(soumission.id_soumission)}
                              >
                                Consulter
                              </button>
                              <button
                                type="button"
                                className={cn(styles.btn, styles.btnSoft)}
                                onClick={() => setSelectedSoumissionId(soumission.id_soumission)}
                              >
                                Vérifier conformité
                              </button>
                            </div>
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
                <div>
                  <h4>Contrôle de conformité</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <ReadonlyField
                    label="Soumission"
                    value={selectedSoumission ? `S-${selectedSoumission.id_soumission}` : '—'}
                  />
                  <Field label="Statut de validation">
                    <select
                      value={validationForm.is_validated}
                      onChange={(event) =>
                        setValidationForm((current) => ({ ...current, is_validated: event.target.value }))
                      }
                    >
                      <option>true</option>
                      <option>false</option>
                    </select>
                  </Field>
                  <Field label="Type de validation">
                    <select
                      value={validationForm.type}
                      onChange={(event) =>
                        setValidationForm((current) => ({ ...current, type: event.target.value }))
                      }
                    >
                      <option>interne</option>
                      <option>externe</option>
                      <option>tutelle</option>
                    </select>
                  </Field>
                  <ReadonlyField
                    label="Utilisateur"
                    value={currentUser ? String(currentUser.id_utilisateur) : '—'}
                  />
                  <Field label="Commentaire" full>
                    <textarea
                      value={validationForm.commentaire}
                      onChange={(event) =>
                        setValidationForm((current) => ({ ...current, commentaire: event.target.value }))
                      }
                    />
                  </Field>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void saveValidation()}>
                    Mettre à jour
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnGhost)}
                    onClick={() => void approveSelectedValidation()}
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnDanger)}
                    onClick={() => void rejectSelectedValidation()}
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Actions globales</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.btnRow}>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnPrimary)}
                    onClick={() => void runAppelAction('open', selectedAppel?.id_appel_offres || null)}
                  >
                    Ouvrir les plis
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnSoft)}
                    onClick={() => void calculateRanking()}
                  >
                    Calculer le classement
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnGhost)}
                    onClick={() => void validateCommissionNotes()}
                  >
                    Valider les notes
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnGhost)}
                    onClick={() => notify('La détection d’anomalies n’est pas encore exposée par le backend du service contractant.')}
                  >
                    Détecter les anomalies
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnGhost)}
                    onClick={() => notify('La vérification IA de conformité n’est pas encore exposée par le backend du service contractant.')}
                  >
                    Vérifier conformité IA
                  </button>
                </div>
                <div className={styles.footerNote}>
                  La saisie de dépôt d’offre n’apparaît plus ici, car elle concerne l’opérateur économique et non le
                  service contractant.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marches-evaluations' && (
        <div className={cn(styles.grid, styles.split55)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Commission d’évaluation</h4>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                <Field label="Id commission">
                  <input
                    value={commissionDraft.id}
                    onChange={(event) =>
                      setCommissionDraft((current) => ({ ...current, id: event.target.value }))
                    }
                  />
                </Field>
                <ReadonlyField label="Id service" value={service ? String(service.id_service) : '—'} />
                <Field label="Nom commission">
                  <input
                    value={commissionDraft.nom_comission}
                    onChange={(event) =>
                      setCommissionDraft((current) => ({ ...current, nom_comission: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Catégorie / type">
                  <input
                    value={commissionDraft.categorie}
                    onChange={(event) =>
                      setCommissionDraft((current) => ({ ...current, categorie: event.target.value }))
                    }
                  />
                </Field>
              </div>

              <div className={styles.btnRow} style={{ marginTop: 16 }}>
                <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void saveCommission()}>
                  Enregistrer la commission
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnGhost)}
                  onClick={() => void addCommissionMember()}
                >
                  Ajouter un membre
                </button>
              </div>

              <div className={styles.tableWrap} style={{ marginTop: 18 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Membre</th>
                      <th>Fonction</th>
                      <th>Téléphone</th>
                      <th>Rôle dans la commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionMembers.length === 0 ? (
                      <tr>
                        <td colSpan={4}>Aucun membre chargé pour cette commission.</td>
                      </tr>
                    ) : (
                      commissionMembers.map((member) => (
                        <tr key={member.id_membre}>
                          <td>
                            <strong>
                              M-{member.id_membre} — {member.prenom} {member.nom}
                            </strong>
                          </td>
                          <td>{member.fonction}</td>
                          <td>{member.telephone}</td>
                          <td>Non modélisé par le backend</td>
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
                <div>
                  <h4>Affectation des AO</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <Field label="AO">
                    <select
                      value={selectedAppelId ? String(selectedAppelId) : ''}
                      onChange={(event) =>
                        setSelectedAppelId(event.target.value ? Number(event.target.value) : null)
                      }
                    >
                      <option value="">—</option>
                      {appels.map((appel) => (
                        <option key={appel.id_appel_offres} value={appel.id_appel_offres}>
                          {appel.reference} — {appel.titre}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Type de commission">
                    <select value={affectationType} onChange={(event) => setAffectationType(event.target.value)}>
                      <option>Commission interne</option>
                      <option>Commission externe</option>
                      <option>Commission d’évaluation</option>
                    </select>
                  </Field>
                  <Field label="Commission cible">
                    <select value={affectationTarget} onChange={(event) => setAffectationTarget(event.target.value)}>
                      <option value="">—</option>
                      {affectationTargets.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Étape suivie">
                    <select value={affectationStep} onChange={(event) => setAffectationStep(event.target.value)}>
                      <option>Administrative</option>
                      <option>Technique</option>
                      <option>Financière</option>
                    </select>
                  </Field>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnPrimary)}
                    onClick={() => notify('L’affectation AO → commission n’est pas encore exposée par le backend.')}
                  >
                    Affecter la commission
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnGhost)}
                    onClick={() => notify('Le backend ne retourne pas encore l’historique des affectations AO → commission.')}
                  >
                    Voir les affectations
                  </button>
                </div>

                <div className={styles.tableWrap} style={{ marginTop: 18 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>AO</th>
                        <th>Commission</th>
                        <th>Type</th>
                        <th>État</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{selectedAppel?.reference || '—'}</td>
                        <td>
                          {affectationTargets.find((item) => item.value === affectationTarget)?.label || '—'}
                        </td>
                        <td>{affectationType}</td>
                        <td>
                          <Badge badge={{ label: 'non exposé', tone: 'gray' }} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Vue d’avancement</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.statsStrip}>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>administrative</div>
                    <strong>{administrativeProgress}</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>technique</div>
                    <strong>{technicalProgress}</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>financière</div>
                    <strong>{financialProgress}</strong>
                  </div>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnSoft)}
                    onClick={() => setActiveTab('marches-soumissions')}
                  >
                    Voir l’état détaillé
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnGhost)}
                    onClick={() => notify('Le backend ne retourne pas encore les affectations détaillées.')}
                  >
                    Voir les affectations
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marches-contrats' && (
        <div className={cn(styles.grid, styles.split55)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Contrat</h4>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                <ReadonlyField
                  label="id_soumission"
                  value={selectedSoumission ? `S-${selectedSoumission.id_soumission}` : '—'}
                />
                <ReadonlyField
                  label="id_service_contractants"
                  value={service ? String(service.id_service) : '—'}
                />
                <Field label="Numéro contrat">
                  <input
                    value={contractDraft.numero_contrat}
                    onChange={(event) =>
                      setContractDraft((current) => ({ ...current, numero_contrat: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Date signature">
                  <input
                    type="date"
                    value={contractDraft.date_signature}
                    onChange={(event) =>
                      setContractDraft((current) => ({ ...current, date_signature: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Statut">
                  <input
                    value={contractDraft.statut}
                    onChange={(event) =>
                      setContractDraft((current) => ({ ...current, statut: event.target.value }))
                    }
                  />
                </Field>
              </div>
              <div className={styles.btnRow} style={{ marginTop: 16 }}>
                <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void saveContract()}>
                  Enregistrer le contrat
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnGhost)}
                  onClick={() => setActiveTab('marches-soumissions')}
                >
                  Voir depuis la soumission
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnSoft)}
                  onClick={() => void signSelectedContract()}
                >
                  Signer
                </button>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Recours</h4>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.list}>
                {recours.length === 0 ? (
                  <div className={styles.listItem}>
                    <Badge badge={{ label: 'aucun', tone: 'gray' }} />
                    <div className={styles.grow}>
                      <strong>Aucun recours</strong>
                      <p>Cette soumission ne possède pas de recours exposé par le backend.</p>
                    </div>
                  </div>
                ) : (
                  recours.map((item) => (
                    <div key={item.id_recours} className={styles.listItem}>
                      <Badge badge={toBadgeFromStatus(item.statut)} />
                      <div className={styles.grow}>
                        <strong>R-{item.id_recours} — Validation {item.id_validation}</strong>
                        <p>Soumission concernée : S-{item.id_soumission} — {item.motif}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className={styles.btnRow} style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnGhost)}
                  onClick={() => void runRecoursAction('instruire')}
                >
                  Instruire
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnSoft)}
                  onClick={() => void runRecoursAction('decision')}
                >
                  Décision
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnPrimary)}
                  onClick={() => void runRecoursAction('accepter')}
                >
                  Accepter
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnDanger)}
                  onClick={() => void runRecoursAction('rejeter')}
                >
                  Rejeter
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnGhost)}
                  onClick={() => void runRecoursAction('cloturer')}
                >
                  Clôturer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
