// Appel d'offre lifecycle: states, visual meta, and the actions available per state.
// The server is the source of truth for `statut`; the frontend derives the rich lifecycle
// state from `statut` + the schedule dates and reflects automatic transitions (it never
// simulates the clock itself).

import type { Permission } from './permissions';

export type AOState =
  | 'BROUILLON'
  | 'EN_VALIDATION'
  | 'REFUSE'
  | 'VALIDE'
  | 'PUBLIE'
  | 'OUVERT'
  | 'CLOTURE_DEPOT'
  | 'EN_OUVERTURE'
  | 'EN_EVALUATION'
  | 'ATTRIBUTION_PROVISOIRE'
  | 'RECOURS_EN_COURS'
  | 'ATTRIBUTION_DEFINITIVE'
  | 'INFRUCTUEUX'
  | 'ANNULE'
  | 'CLOTURE';

type Meta = { fr: string; ar: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' };

export const STATE_META: Record<AOState, Meta> = {
  BROUILLON:              { fr: 'Brouillon',               ar: 'مسودة',              tone: 'neutral' },
  EN_VALIDATION:          { fr: 'En validation',           ar: 'قيد التحقق',         tone: 'info' },
  REFUSE:                 { fr: 'Refusé',                  ar: 'مرفوض',              tone: 'danger' },
  VALIDE:                 { fr: 'Validé',                  ar: 'مُصادق عليه',        tone: 'success' },
  PUBLIE:                 { fr: 'Publié',                  ar: 'منشور',              tone: 'info' },
  OUVERT:                 { fr: 'Ouvert au dépôt',         ar: 'مفتوح للإيداع',      tone: 'success' },
  CLOTURE_DEPOT:          { fr: 'Dépôt clôturé',           ar: 'أُغلق الإيداع',      tone: 'warning' },
  EN_OUVERTURE:           { fr: 'Ouverture des plis',      ar: 'فتح الأظرفة',        tone: 'warning' },
  EN_EVALUATION:          { fr: 'En évaluation',           ar: 'قيد التقييم',        tone: 'warning' },
  ATTRIBUTION_PROVISOIRE: { fr: 'Attribution provisoire',  ar: 'إسناد مؤقت',         tone: 'info' },
  RECOURS_EN_COURS:       { fr: 'Recours en cours',        ar: 'طعن قيد المعالجة',   tone: 'warning' },
  ATTRIBUTION_DEFINITIVE: { fr: 'Attribution définitive',  ar: 'إسناد نهائي',        tone: 'success' },
  INFRUCTUEUX:            { fr: 'Infructueux',             ar: 'غير مثمر',           tone: 'danger' },
  ANNULE:                 { fr: 'Annulé',                  ar: 'ملغى',               tone: 'danger' },
  CLOTURE:                { fr: 'Clôturé',                 ar: 'مُغلق',              tone: 'neutral' },
};

// The 58 Algerian wilayas, in official order — used for the AO location dropdown.
export const ALGERIAN_WILAYAS: string[] = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
  'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
  'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
  'Constantine', 'Médéa', 'Mostaganem', "M'Sila", 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
  'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
  'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
  'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès',
  'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', "El M'Ghair", 'El Meniaa',
];

export type AOType = 'publique' | 'restreint' | 'gre_a_gre' | 'consultation';

export const AO_TYPE_META: Record<AOType, { fr: string; ar: string }> = {
  publique:     { fr: "Appel d'offres ouvert",       ar: 'مناقصة مفتوحة' },
  restreint:    { fr: "Appel d'offres restreint",    ar: 'مناقصة محدودة' },
  gre_a_gre:    { fr: 'Gré à gré',                   ar: 'التراضي' },
  consultation: { fr: 'Achat simple / consultation', ar: 'شراء بسيط / استشارة' },
};

/** Safe label for any (possibly null/unknown) type_procedure value — never throws. */
export function aoTypeLabel(type: string | null | undefined, lang: string, fallback = '—'): string {
  const meta = type ? AO_TYPE_META[type as AOType] : undefined;
  if (!meta) return fallback;
  return lang === 'ar' ? meta.ar : meta.fr;
}

/** Types whose schedule (dates) and weights are not applicable. */
export const TYPES_SANS_PLANNING: AOType[] = ['gre_a_gre', 'consultation'];
/** Consultation needs no commission validation. */
export const TYPES_SANS_VALIDATION: AOType[] = ['consultation'];

// Montant thresholds (Loi 23-12). Below SEUIL_AO → achat simple/consultation only.
export const SEUIL_AO = 12_000_000;

/** Min/max montant (DA) admissible per AO type. `max: null` = no upper bound. */
export const AO_TYPE_MONTANT: Record<AOType, { min: number; max: number | null }> = {
  consultation: { min: 0,        max: SEUIL_AO - 1 }, // < 12M DA
  publique:     { min: SEUIL_AO, max: null },         // ≥ 12M DA
  restreint:    { min: SEUIL_AO, max: null },         // ≥ 12M DA
  gre_a_gre:    { min: SEUIL_AO, max: null },         // ≥ 12M DA (cas légaux)
};

/** True when `montant` (DA) fits the type's admissible range. */
export function montantFitsType(type: AOType, montant: number): boolean {
  const r = AO_TYPE_MONTANT[type];
  return montant >= r.min && (r.max === null || montant <= r.max);
}

/** AO types selectable for a given montant (DA). Empty montant → all types. */
export function typesForMontant(montant: number | null): AOType[] {
  const all = Object.keys(AO_TYPE_MONTANT) as AOType[];
  if (montant == null || Number.isNaN(montant) || montant <= 0) return all;
  return all.filter((t) => montantFitsType(t, montant));
}

export interface AOLike {
  statut?: string | null;
  type_procedure?: string | null;
  date_publication?: string | null;
  date_limite_soumission?: string | null;
  date_ouverture_plis?: string | null;
  attribution_statut?: string | null;   // 'provisoire' | 'definitive'
  recours_en_cours?: boolean | null;
}

function parse(d?: string | null): number | null {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : t;
}

/** Derive the lifecycle state from the server payload + the current time. */
export function deriveState(ao: AOLike, now: number = Date.now()): AOState {
  const s = (ao.statut || '').toLowerCase().replace(/\s+/g, '_');

  if (ao.recours_en_cours) return 'RECOURS_EN_COURS';
  if (ao.attribution_statut === 'definitive') return 'ATTRIBUTION_DEFINITIVE';
  if (ao.attribution_statut === 'provisoire') return 'ATTRIBUTION_PROVISOIRE';

  if (s === 'brouillon') return 'BROUILLON';
  if (s === 'annule' || s === 'annulé') return 'ANNULE';
  if (s === 'infructueux') return 'INFRUCTUEUX';
  if (s === 'refuse' || s === 'refusé') return 'REFUSE';
  if (s === 'ferme' || s === 'fermé' || s === 'cloture' || s === 'clôturé') return 'CLOTURE';
  if (s === 'non_validé' || s === 'non_valide' || s === 'en_validation') return 'EN_VALIDATION';

  if (s === 'validé' || s === 'valide' || s === 'publié' || s === 'publie' || s === 'ouvert' || s === 'verifié' || s === 'verifie') {
    const pub = parse(ao.date_publication);
    const lim = parse(ao.date_limite_soumission);
    const plis = parse(ao.date_ouverture_plis);
    if (pub && now < pub) return 'VALIDE';
    if (!lim) return s.startsWith('pub') ? 'PUBLIE' : 'VALIDE';
    if (now < lim) return 'OUVERT';
    if (plis && now < plis) return 'CLOTURE_DEPOT';
    return 'EN_OUVERTURE';
  }

  return 'EN_VALIDATION';
}

export interface AOAction {
  id: 'continuer' | 'supprimer' | 'soumettre' | 'modifier' | 'publier' | 'cloturer_depot'
    | 'ouvrir_plis' | 'attribuer' | 'consulter_recours';
  fr: string;
  ar: string;
  permission: Permission;
  tone?: 'primary' | 'danger';
}

const A: Record<AOAction['id'], AOAction> = {
  continuer:        { id: 'continuer',        fr: "Continuer l'édition",        ar: 'متابعة التحرير',     permission: 'marche:update' },
  supprimer:        { id: 'supprimer',        fr: 'Supprimer le brouillon',     ar: 'حذف المسودة',        permission: 'marche:update', tone: 'danger' },
  soumettre:        { id: 'soumettre',        fr: 'Soumettre pour validation',  ar: 'إرسال للتحقق',       permission: 'cdc:submit_validation', tone: 'primary' },
  modifier:         { id: 'modifier',         fr: 'Modifier et resoumettre',    ar: 'تعديل وإعادة الإرسال', permission: 'marche:update' },
  publier:          { id: 'publier',          fr: "Publier l'appel d'offres",   ar: 'نشر المناقصة',       permission: 'marche:publish', tone: 'primary' },
  cloturer_depot:   { id: 'cloturer_depot',   fr: 'Clôturer le dépôt',          ar: 'إغلاق الإيداع',      permission: 'marche:update' },
  ouvrir_plis:      { id: 'ouvrir_plis',      fr: "Déclencher l'ouverture des plis", ar: 'بدء فتح الأظرفة', permission: 'marche:update' },
  attribuer:        { id: 'attribuer',        fr: "Statuer sur l'attribution",  ar: 'البت في الإسناد',    permission: 'marche:attribuer', tone: 'primary' },
  consulter_recours:{ id: 'consulter_recours',fr: 'Consulter les recours',      ar: 'الاطلاع على الطعون', permission: 'recours:read' },
};

const STATE_ACTIONS: Record<AOState, AOAction['id'][]> = {
  BROUILLON:              ['continuer', 'soumettre', 'supprimer'],
  EN_VALIDATION:          [],
  REFUSE:                 ['modifier'],
  VALIDE:                 ['publier'],
  PUBLIE:                 [],
  OUVERT:                 ['cloturer_depot'],
  CLOTURE_DEPOT:          ['ouvrir_plis'],
  EN_OUVERTURE:           [],
  EN_EVALUATION:          [],
  ATTRIBUTION_PROVISOIRE: ['attribuer', 'consulter_recours'],
  RECOURS_EN_COURS:       ['consulter_recours'],
  ATTRIBUTION_DEFINITIVE: [],
  INFRUCTUEUX:            [],
  ANNULE:                 [],
  CLOTURE:                [],
};

/** Actions allowed in a state and permitted for the user (`can`). */
export function actionsForState(state: AOState, can: (p: Permission) => boolean): AOAction[] {
  return STATE_ACTIONS[state].map((id) => A[id]).filter((a) => can(a.permission));
}
