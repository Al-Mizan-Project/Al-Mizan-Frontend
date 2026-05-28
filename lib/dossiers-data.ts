export type DossierStatus = 'En attente' | 'En cours' | 'En retard' | 'Prêt';
export type DossierEtape =
  | 'Soumis'
  | 'En analyse'
  | 'Vérification'
  | 'Évaluation'
  | 'Clôturé';

export interface Dossier {
  id: string;
  reference: string;
  operateur: string;
  dateSoumission: string;
  delaiEvaluation: string;
  etape: DossierEtape;
  status: DossierStatus;
    commissionId?: number; 
}

export const DOSSIERS: Dossier[] = [
  // En attente
  {
    id: 'D-0041',
    reference: 'REF-2024-0041',
    operateur: 'Groupe Batimex SARL',
    dateSoumission: '2024-11-01',
    delaiEvaluation: '30 jours',
    etape: 'Soumis',
    status: 'En attente',
  },
  {
    id: 'D-0042',
    reference: 'REF-2024-0042',
    operateur: 'TechBuild Algérie',
    dateSoumission: '2024-11-03',
    delaiEvaluation: '21 jours',
    etape: 'Soumis',
    status: 'En attente',
  },
  {
    id: 'D-0043',
    reference: 'REF-2024-0043',
    operateur: 'Construx Nord SPA',
    dateSoumission: '2024-11-05',
    delaiEvaluation: '14 jours',
    etape: 'Soumis',
    status: 'En attente',
  },
  {
    id: 'D-0044',
    reference: 'REF-2024-0044',
    operateur: 'Infra Solutions DZ',
    dateSoumission: '2024-11-06',
    delaiEvaluation: '30 jours',
    etape: 'Soumis',
    status: 'En attente',
  },
  {
    id: 'D-0045',
    reference: 'REF-2024-0045',
    operateur: 'Agritech Ouest',
    dateSoumission: '2024-11-07',
    delaiEvaluation: '21 jours',
    etape: 'Soumis',
    status: 'En attente',
  },
  {
    id: 'D-0046',
    reference: 'REF-2024-0046',
    operateur: 'Énergies Nouvelles Est',
    dateSoumission: '2024-11-08',
    delaiEvaluation: '30 jours',
    etape: 'Soumis',
    status: 'En attente',
  },
  {
    id: 'D-0047',
    reference: 'REF-2024-0047',
    operateur: 'Delta Logistique',
    dateSoumission: '2024-11-09',
    delaiEvaluation: '14 jours',
    etape: 'Soumis',
    status: 'En attente',
  },
  // En cours
  {
    id: 'D-0021',
    reference: 'REF-2024-0021',
    operateur: 'Hydro-Alg EURL',
    dateSoumission: '2024-10-10',
    delaiEvaluation: '30 jours',
    etape: 'En analyse',
    status: 'En cours',
  },
  {
    id: 'D-0022',
    reference: 'REF-2024-0022',
    operateur: 'Société Minière du Centre',
    dateSoumission: '2024-10-12',
    delaiEvaluation: '21 jours',
    etape: 'Vérification',
    status: 'En cours',
  },
  {
    id: 'D-0023',
    reference: 'REF-2024-0023',
    operateur: 'TransMed Cargo',
    dateSoumission: '2024-10-15',
    delaiEvaluation: '14 jours',
    etape: 'Évaluation',
    status: 'En cours',
  },
  {
    id: 'D-0024',
    reference: 'REF-2024-0024',
    operateur: 'Biopharma Algérie',
    dateSoumission: '2024-10-18',
    delaiEvaluation: '30 jours',
    etape: 'En analyse',
    status: 'En cours',
  },
  {
    id: 'D-0025',
    reference: 'REF-2024-0025',
    operateur: 'Telecom Services DZ',
    dateSoumission: '2024-10-20',
    delaiEvaluation: '21 jours',
    etape: 'Vérification',
    status: 'En cours',
  },
  {
    id: 'D-0026',
    reference: 'REF-2024-0026',
    operateur: 'Groupe Alimentaire Sud',
    dateSoumission: '2024-10-22',
    delaiEvaluation: '30 jours',
    etape: 'Évaluation',
    status: 'En cours',
  },
  // En retard
  {
    id: 'D-0011',
    reference: 'REF-2024-0011',
    operateur: 'Macro Constructions',
    dateSoumission: '2024-09-01',
    delaiEvaluation: '14 jours',
    etape: 'Évaluation',
    status: 'En retard',
  },
  {
    id: 'D-0012',
    reference: 'REF-2024-0012',
    operateur: 'Solaire Maghreb SPA',
    dateSoumission: '2024-09-05',
    delaiEvaluation: '21 jours',
    etape: 'Vérification',
    status: 'En retard',
  },
  {
    id: 'D-0013',
    reference: 'REF-2024-0013',
    operateur: 'GazTech Annaba',
    dateSoumission: '2024-09-10',
    delaiEvaluation: '30 jours',
    etape: 'En analyse',
    status: 'En retard',
  },
  {
    id: 'D-0014',
    reference: 'REF-2024-0014',
    operateur: 'BTP Nationale SARL',
    dateSoumission: '2024-09-12',
    delaiEvaluation: '14 jours',
    etape: 'Évaluation',
    status: 'En retard',
  },

  // Prêt
  {
    id: 'D-0001',
    reference: 'REF-2024-0001',
    operateur: 'Agroalim Tlemcen',
    dateSoumission: '2024-08-01',
    delaiEvaluation: '30 jours',
    etape: 'Clôturé',
    status: 'Prêt',
  },
  {
    id: 'D-0002',
    reference: 'REF-2024-0002',
    operateur: 'MedPharma Oran',
    dateSoumission: '2024-08-05',
    delaiEvaluation: '21 jours',
    etape: 'Clôturé',
    status: 'Prêt',
  },
  {
    id: 'D-0003',
    reference: 'REF-2024-0003',
    operateur: 'Textile Blida EURL',
    dateSoumission: '2024-08-08',
    delaiEvaluation: '14 jours',
    etape: 'Clôturé',
    status: 'Prêt',
  },
  {
    id: 'D-0004',
    reference: 'REF-2024-0004',
    operateur: 'Electrotech Constantine',
    dateSoumission: '2024-08-10',
    delaiEvaluation: '30 jours',
    etape: 'Clôturé',
    status: 'Prêt',
  },
  {
    id: 'D-0005',
    reference: 'REF-2024-0005',
    operateur: 'Import-Export Setif',
    dateSoumission: '2024-08-12',
    delaiEvaluation: '21 jours',
    etape: 'Clôturé',
    status: 'Prêt',
  },
  {
    id: 'D-0006',
    reference: 'REF-2024-0006',
    operateur: 'Chimique Annaba SPA',
    dateSoumission: '2024-08-15',
    delaiEvaluation: '30 jours',
    etape: 'Clôturé',
    status: 'Prêt',
  },
];

// ─── Evaluateurs data ─────────────────────────────────────────────────────────

export type Disponibilite = 'Recommandé' | 'Indisponible' | 'Conflit';

export interface Evaluateur {
  id: string;
  nom: string;
  role: string;
  chargeDossiers: number;
  disponibilite: Disponibilite;
  email: string;
  specialite: string;
  dossiers: string[]; // references of assigned dossiers
}

export const EVALUATEURS_DATA: Evaluateur[] = [
  {
    id: 'EV-001',
    nom: 'A. Benali',
    role: 'Évaluateur Principal',
    chargeDossiers: 12,
    disponibilite: 'Recommandé',
    email: 'a.benali@elmizan.dz',
    specialite: 'BTP / Infrastructure',
    dossiers: ['REF-2024-0021', 'REF-2024-0022', 'REF-2024-0001'],
  },
  {
    id: 'EV-002',
    nom: 'S. Hadj',
    role: 'Évaluateur',
    chargeDossiers: 9,
    disponibilite: 'Recommandé',
    email: 's.hadj@elmizan.dz',
    specialite: 'Industrie / Énergie',
    dossiers: ['REF-2024-0023', 'REF-2024-0002'],
  },
  {
    id: 'EV-003',
    nom: 'K. Meziane',
    role: 'Évaluateur Senior',
    chargeDossiers: 15,
    disponibilite: 'Indisponible',
    email: 'k.meziane@elmizan.dz',
    specialite: 'Agriculture / Agroalimentaire',
    dossiers: ['REF-2024-0024', 'REF-2024-0025', 'REF-2024-0003', 'REF-2024-0004'],
  },
  {
    id: 'EV-004',
    nom: 'L. Ouali',
    role: 'Évaluateur',
    chargeDossiers: 7,
    disponibilite: 'Conflit',
    email: 'l.ouali@elmizan.dz',
    specialite: 'Santé / Pharmacie',
    dossiers: ['REF-2024-0011', 'REF-2024-0005'],
  },
  {
    id: 'EV-005',
    nom: 'M. Tebbal',
    role: 'Évaluateur Principal',
    chargeDossiers: 11,
    disponibilite: 'Recommandé',
    email: 'm.tebbal@elmizan.dz',
    specialite: 'Technologie / Télécoms',
    dossiers: ['REF-2024-0026', 'REF-2024-0006'],
  },
];