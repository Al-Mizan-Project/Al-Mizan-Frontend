export type BadgeTone = 'info' | 'success' | 'warn' | 'danger' | 'gray';

export type MarchesTab =
  | 'marches-appels'
  | 'marches-edition'
  | 'marches-documents'
  | 'marches-soumissions'
  | 'marches-evaluations'
  | 'marches-contrats';

export interface BadgeData {
  label: string;
  tone: BadgeTone;
}

export interface TableCell {
  main: string;
  secondary?: string;
}

export interface PermissionRecord {
  id: string;
  name: string;
  pages: string[];
  features: string[];
}

export interface MemberRecord {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  activeLabel: BadgeData;
  role: string;
  permissions: string[];
  firstName: string;
  lastName: string;
  function: string;
  roleOptions: string[];
  actionLabel: string;
}

export const ORGANISATION_PAGE_OPTIONS = [
  'Dashboard',
  'Marchés · Appels d’offres',
  'Marchés · Documents',
  'Marchés · Soumissions',
  'Marchés · Commissions & évaluations',
  'Marchés · Validations',
  'Organisation · Info',
  'Organisation · Gestion membres',
  'Organisation · Permissions',
];

export const ORGANISATION_FEATURE_OPTIONS = [
  'Créer un appel d’offres',
  'Modifier le contenu',
  'Publier un AO',
  'Lancer les suggestions IA',
  'Consulter l’état des évaluations',
  'Affecter une commission interne',
  'Affecter une commission externe',
  'Consulter les soumissions',
  'Gérer les membres',
  'Gérer les permissions',
];

export const dashboardKpis = [
  { label: 'Appels d’offres', value: '12' },
  { label: 'Soumissions reçues', value: '38' },
  { label: 'Commissions actives', value: '6' },
  { label: 'Contrats / recours', value: '7' },
];

export const dashboardRecentOffers = [
  {
    reference: 'AO-2026-014',
    title: 'Acquisition de serveurs et baies de stockage',
    type: 'Appel d’offres ouvert',
    status: { label: 'brouillon', tone: 'warn' as const },
    dates: 'Publication 22/04 — Dépôt 24/04',
  },
  {
    reference: 'AO-2026-009',
    title: 'Équipement réseau campus administratif',
    type: 'Appel d’offres ouvert',
    status: { label: 'publie', tone: 'info' as const },
    dates: 'Dépôt 25/04 — Ouverture 25/04',
  },
  {
    reference: 'AO-2026-006',
    title: 'Prestation de maintenance logicielle',
    type: 'Consultation',
    status: { label: 'depot_cloture', tone: 'gray' as const },
    dates: 'Dépôt clôturé le 20/04',
  },
  {
    reference: 'AO-2026-002',
    title: 'Fourniture de mobilier administratif',
    type: 'Appel d’offres restreint',
    status: { label: 'plis_ouverts', tone: 'success' as const },
    dates: 'Classement en préparation',
  },
];

export const dashboardActivity = [
  {
    badge: { label: 'Document', tone: 'info' as const },
    title: 'CDC final ajouté à AO-2026-014',
    time: '09:42',
  },
  {
    badge: { label: 'Soumission', tone: 'warn' as const },
    title: 'Clôture de dépôt programmée pour AO-2026-009',
    time: '08:55',
  },
  {
    badge: { label: 'Accès', tone: 'success' as const },
    title: 'Utilisateur affecté au rôle EVALUATEUR_TECHNIQUE',
    time: 'Hier',
  },
];

export const marchesTabs: { id: MarchesTab; label: string }[] = [
  { id: 'marches-appels', label: 'Appels d’offres' },
  { id: 'marches-edition', label: 'Édition AO' },
  { id: 'marches-documents', label: 'Documents' },
  { id: 'marches-soumissions', label: 'Soumissions' },
  { id: 'marches-evaluations', label: 'Commissions & évaluations' },
  { id: 'marches-contrats', label: 'Contrats & recours' },
];

export const appelsRows = [
  {
    reference: 'AO-2026-014',
    title: 'Acquisition de serveurs et baies de stockage',
    procedureType: 'Appel d’offres ouvert',
    amount: '12 500 000 DZD',
    publication: '22/04/2026 10:00',
    deadline: '24/04/2026 14:00',
    opening: '25/04/2026 09:30',
    status: { label: 'brouillon', tone: 'warn' as const },
    weight: '70 / 30',
  },
  {
    reference: 'AO-2026-009',
    title: 'Équipement réseau campus administratif',
    procedureType: 'Appel d’offres ouvert',
    amount: '8 900 000 DZD',
    publication: '18/04/2026 08:00',
    deadline: '25/04/2026 09:00',
    opening: '25/04/2026 09:30',
    status: { label: 'publie', tone: 'info' as const },
    weight: '65 / 35',
  },
  {
    reference: 'AO-2026-006',
    title: 'Maintenance logicielle',
    procedureType: 'Consultation',
    amount: '3 200 000 DZD',
    publication: '12/04/2026 11:00',
    deadline: '20/04/2026 12:00',
    opening: '20/04/2026 12:30',
    status: { label: 'depot_cloture', tone: 'gray' as const },
    weight: '60 / 40',
  },
  {
    reference: 'AO-2026-002',
    title: 'Mobilier administratif',
    procedureType: 'Appel d’offres restreint',
    amount: '4 450 000 DZD',
    publication: '02/04/2026 09:00',
    deadline: '15/04/2026 15:00',
    opening: '16/04/2026 09:30',
    status: { label: 'plis_ouverts', tone: 'success' as const },
    weight: '50 / 50',
  },
];

export const documentsRows = [
  {
    name: 'cdc_final_v3.pdf',
    type: 'cahier_des_charges',
    relatedType: 'appel_offres',
    size: '2.4 Mo',
    encrypted: 'non',
    iaStatus: { label: 'PENDING', tone: 'gray' as const },
    visibleAfter: '22/04/2026 10:00',
    uploadedAt: '21/04/2026 17:42',
  },
  {
    name: 'annexes_quantitatives.xlsx',
    type: 'annexe',
    relatedType: 'appel_offres',
    size: '640 Ko',
    encrypted: 'non',
    iaStatus: { label: 'VALID', tone: 'success' as const },
    visibleAfter: '22/04/2026 10:00',
    uploadedAt: '21/04/2026 17:48',
  },
  {
    name: 'offres_financieres.zip',
    type: 'offre_financiere',
    relatedType: 'soumission',
    size: '4.1 Mo',
    encrypted: 'oui',
    iaStatus: { label: 'ANOMALY', tone: 'warn' as const },
    visibleAfter: '25/04/2026 09:30',
    uploadedAt: '24/04/2026 14:02',
  },
];

export const soumissionsRows = [
  {
    submission: 'S-2026-031',
    operator: 'NetCom SARL',
    conformity: { label: 'valide', tone: 'success' as const },
    evaluation: 'Technique en cours',
    contract: '—',
    actions: ['Consulter', 'Vérifier conformité'],
  },
  {
    submission: 'S-2026-032',
    operator: 'AlgerTel SPA',
    conformity: { label: 'à revoir', tone: 'warn' as const },
    evaluation: 'Administrative ouverte',
    contract: '—',
    actions: ['Consulter', 'Terminer évaluation'],
  },
  {
    submission: 'S-2026-033',
    operator: 'Atlas Data',
    conformity: { label: 'en attente', tone: 'gray' as const },
    evaluation: 'Non démarrée',
    contract: 'C-2026-004',
    actions: ['Contrat', 'Évaluations'],
  },
];

export const commissionMembers = [
  {
    member: 'M-004 — Sara Benyamina',
    job: 'Ingénieure réseau',
    phone: '0550 12 34 56',
    role: 'Présidente',
  },
  {
    member: 'M-007 — Yacine Boulahrouz',
    job: 'Architecte SI',
    phone: '0661 44 10 22',
    role: 'Membre évaluateur',
  },
  {
    member: 'M-009 — Rania Ouali',
    job: 'Responsable achats',
    phone: '0560 98 77 11',
    role: 'Rapporteuse',
  },
];

export const affectationRows = [
  {
    tender: 'AO-2026-009',
    commission: 'Commission technique réseau',
    type: 'Interne',
    state: { label: 'en cours', tone: 'info' as const },
  },
  {
    tender: 'AO-2026-005',
    commission: 'Commission externe infrastructure',
    type: 'Externe',
    state: { label: 'terminée', tone: 'success' as const },
  },
];

export const recoursItems = [
  {
    badge: { label: 'ouvert', tone: 'warn' as const },
    title: 'R-2026-011 — Contestation du classement provisoire',
    text: 'Soumission concernée : S-2026-032 — instruction en attente.',
  },
  {
    badge: { label: 'analyse', tone: 'info' as const },
    title: 'R-2026-010 — Demande de réexamen technique',
    text: 'Pièces complémentaires déjà versées au dossier.',
  },
];

export const organisationInfoFields = [
  { label: 'id_organisation', value: 'ORG-001' },
  { label: 'nom_officiel', value: 'Direction des marchés — Wilaya d’Alger' },
  { label: 'adresse_siege', value: '1, rue des institutions, Alger' },
  { label: 'email_contact', value: 'contact.marches@wilaya.dz' },
  { label: 'type_entite', value: 'service contractant' },
];

export const serviceContractantFields = [
  { label: 'id_tutelle', value: 'TUT-010' },
  { label: 'categorie', value: 'Wilaya' },
  { label: 'code_ordonnateur', value: 'ORD-ALG-2026-01' },
];

export const tutelleFields = [
  { label: 'id_tutelle', value: 'TUT-010' },
  { label: 'nom_tutelle', value: 'Ministère de l’Intérieur' },
  { label: 'identite_autorite', value: 'Secrétariat général', full: true },
];

export const connectedMemberFields = [
  { label: 'id_membre', value: 'M-001' },
  { label: 'id_utilisateur', value: 'USR-001' },
  { label: 'prenom', value: 'Sofiane' },
  { label: 'nom', value: 'Benyahia' },
  { label: 'telephone', value: '0555 20 18 34' },
  { label: 'fonction', value: 'Responsable du service contractant' },
  { label: 'email', value: 'sc.admin@wilaya.dz' },
  { label: 'is_active', value: 'true' },
  { label: 'rôle', value: 'responsable_service_contractant' },
];

export const connectedMemberPermissions = [
  'rédacteur_cdc',
  'valider_offre_intern',
];

export const accessItems = [
  {
    badge: { label: 'lecture', tone: 'gray' as const },
    title: 'Organisation',
    text: 'Consultation uniquement.',
  },
  {
    badge: { label: 'rôle', tone: 'info' as const },
    title: 'responsable_service_contractant',
    text: 'Gestion des membres, des rôles et des permissions.',
  },
  {
    badge: { label: 'pages', tone: 'info' as const },
    title: 'Dashboard · Marchés · Organisation',
    text: 'Affichage selon les permissions affectées.',
  },
];

export const members: MemberRecord[] = [
  {
    id: 'M-001',
    userId: 'USR-001',
    fullName: 'Sofiane Benyahia',
    email: 'sc.admin@wilaya.dz',
    activeLabel: { label: 'actif', tone: 'success' },
    role: 'responsable_service_contractant',
    permissions: ['rédacteur_cdc', 'valider_offre_intern'],
    firstName: 'Sofiane',
    lastName: 'Benyahia',
    function: 'Responsable du service contractant',
    roleOptions: ['responsable_service_contractant', 'membre_service_contractant'],
    actionLabel: 'Désactiver',
  },
  {
    id: 'M-004',
    userId: 'USR-004',
    fullName: 'Salma Benyamina',
    email: 's.benyamina@wilaya.dz',
    activeLabel: { label: 'actif', tone: 'success' },
    role: 'membre_service_contractant',
    permissions: ['évaluer_offre_technique'],
    firstName: 'Salma',
    lastName: 'Benyamina',
    function: 'Évaluatrice technique',
    roleOptions: ['membre_service_contractant', 'responsable_service_contractant'],
    actionLabel: 'Désactiver',
  },
  {
    id: 'M-009',
    userId: 'USR-009',
    fullName: 'Riad Ouali',
    email: 'r.ouali@wilaya.dz',
    activeLabel: { label: 'inactif', tone: 'gray' },
    role: 'membre_service_contractant',
    permissions: ['évaluer_offre_administrative'],
    firstName: 'Riad',
    lastName: 'Ouali',
    function: 'Contrôle administratif',
    roleOptions: ['membre_service_contractant', 'responsable_service_contractant'],
    actionLabel: 'Activer',
  },
];

export const newMemberPermissionChoices = [
  { label: 'rédacteur_cdc', tone: 'info' as const },
  { label: 'évaluer_offre_technique', tone: 'gray' as const },
  { label: 'évaluer_offre_financière', tone: 'gray' as const },
  { label: 'évaluer_offre_administrative', tone: 'gray' as const },
  { label: 'valider_offre_intern', tone: 'gray' as const },
];

export const managedFields = [
  {
    badge: { label: 'membre', tone: 'gray' as const },
    title: 'prenom · nom · telephone · fonction',
    text: 'Fiche membre.',
  },
  {
    badge: { label: 'utilisateur', tone: 'gray' as const },
    title: 'email · password · is_active',
    text: 'Compte associé.',
  },
  {
    badge: { label: 'accès', tone: 'gray' as const },
    title: 'id_role · permissions',
    text: 'Affectation des accès.',
  },
];

export const permissions: PermissionRecord[] = [
  {
    id: 'PERM-001',
    name: 'rédacteur_cdc',
    pages: ['Marchés · Appels d’offres'],
    features: ['Créer, modifier et préparer un AO', 'ouvrir Suggestions IA'],
  },
  {
    id: 'PERM-002',
    name: 'évaluer_offre_technique',
    pages: ['Marchés · Évaluations'],
    features: ['Consulter l’état technique', 'suivre l’avancement'],
  },
  {
    id: 'PERM-003',
    name: 'évaluer_offre_financière',
    pages: ['Marchés · Évaluations'],
    features: ['Consulter l’état financier après ouverture', 'suivre l’avancement'],
  },
  {
    id: 'PERM-004',
    name: 'évaluer_offre_administrative',
    pages: ['Marchés · Soumissions'],
    features: ['Vérifier les pièces administratives', 'consulter l’état administratif'],
  },
  {
    id: 'PERM-005',
    name: 'valider_offre_intern',
    pages: ['Marchés · Validations'],
    features: ['Affecter un AO à une commission interne', 'suivre la validation'],
  },
];

export const editPermission = {
  id: 'PERM-001',
  name: 'rédacteur_cdc',
  pages: ['Marchés · Appels d’offres', 'Marchés · Documents'],
  features: ['Créer un appel d’offres', 'Modifier le contenu', 'Lancer les suggestions IA'],
};

export const createPermission = {
  name: 'nouvelle_permission',
  pages: [] as string[],
  features: [] as string[],
};
