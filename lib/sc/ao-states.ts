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

export type AOType = 'publique' | 'restreint' | 'gre_a_gre' | 'consultation';

export const AO_TYPE_META: Record<AOType, { fr: string; ar: string }> = {
  publique:     { fr: "Appel d'offres ouvert",       ar: 'مناقصة مفتوحة' },
  restreint:    { fr: "Appel d'offres restreint",    ar: 'مناقصة محدودة' },
  gre_a_gre:    { fr: 'Gré à gré',                   ar: 'التراضي' },
  consultation: { fr: 'Consultation',                ar: 'استشارة' },
};

/** Types whose schedule (dates) and weights are not applicable. */
export const TYPES_SANS_PLANNING: AOType[] = ['gre_a_gre', 'consultation'];
/** Consultation needs no commission validation. */
export const TYPES_SANS_VALIDATION: AOType[] = ['consultation'];

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
    | 'ouvrir_plis' | 'annuler' | 'attribuer' | 'consulter_recours';
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
  annuler:          { id: 'annuler',          fr: "Annuler l'appel d'offres",   ar: 'إلغاء المناقصة',     permission: 'marche:update', tone: 'danger' },
  attribuer:        { id: 'attribuer',        fr: "Statuer sur l'attribution",  ar: 'البت في الإسناد',    permission: 'marche:attribuer', tone: 'primary' },
  consulter_recours:{ id: 'consulter_recours',fr: 'Consulter les recours',      ar: 'الاطلاع على الطعون', permission: 'recours:read' },
};

const STATE_ACTIONS: Record<AOState, AOAction['id'][]> = {
  BROUILLON:              ['continuer', 'soumettre', 'supprimer'],
  EN_VALIDATION:          ['annuler'],
  REFUSE:                 ['modifier', 'annuler'],
  VALIDE:                 ['publier', 'annuler'],
  PUBLIE:                 ['annuler'],
  OUVERT:                 ['cloturer_depot', 'annuler'],
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
