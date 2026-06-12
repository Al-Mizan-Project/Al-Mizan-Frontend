// Fixed Service Contractant / COPEO / CT roles and permissions.
// Backend auth_service.rbac.py is the enforcement source; this mirrors it for frontend gates,
// member creation choices, and the read-only role matrix.

export type SCRole =
  | 'RESP_SC'
  | 'REDACTEUR_CDC'
  | 'EVALUATEUR'
  | 'MEMBRE_COMITE_TECHNIQUE'
  | 'RESP_VALID_INTERN'
  | 'VALIDATEUR_INTERNE_MARCHE'
  | 'VALIDATEUR_INTERNE_CDC';

export const ROLE_PERMISSIONS = {
  RESP_SC: [
    'marche:create',
    'marche:read',
    'marche:update',
    'marche:publish',
    'marche:attribuer',
    'membre:create',
    'membre:update',
    'membre:deactivate',
    'oe:approuve',
    'oe:refuser',
    'role:assign',
    'offre:read_after_ouverture',
    'rapport:read',
    'recours:read',
  ],
  REDACTEUR_CDC: [
    'marche:create',
    'marche:read',
    'marche:update',
    'cdc:create',
    'cdc:update',
    'cdc:submit_validation',
    'question:read',
    'question:repondre',
    'document:upload',
  ],
  EVALUATEUR: [
    'registre_reception:read',
    'registre_reception:verify',
    'offre:flag_late',
    'offre:flag_identifying_marks',
    'offre:ecarted_before_opening',
    'seance_ouverture:read',
    'seance_ouverture:start',
    'seance_ouverture:close',
    'pli:open',
    'pli:read_content_after_opening',
    'offre:read_after_ouverture',
    'candidats_list:create',
    'candidats_list:read',
    'document_offre:paraph',
    'document_offre:read_after_paraph',
    'complement_request:propose',
    'complement_request:read',
    'complement_response:read',
    'document_complement:read',
    'conformite_formelle:evaluer',
    'offre:flag_anonymat_violation',
    'offre:flag_prix_divulgue_dans_pli_technique',
    'offre:ecarted_non_conformite',
    'interdiction_list:check',
    'conflict_interest:check',
    'exclusion:propose',
    'capacite_financiere:evaluer',
    'capacite_technique:evaluer',
    'capacite_professionnelle:evaluer',
    'capacite:noter',
    'offre:ecarted_capacite_insuffisante',
    'offre_technique:read',
    'offre_technique:evaluer',
    'offre_technique:noter',
    'critere_evaluation:read',
    'grille_notation:fill',
    'offre_technique:ecarted_note_insuffisante',
    'offre_financiere:block_if_technique_rejected',
    'offre_financiere:read',
    'offre_financiere:evaluer',
    'offre_financiere:controle_arithmetique',
    'offre_financiere:corriger_erreur_arithmetique',
    'offre_financiere:appliquer_marge_preference_nationale',
    'offre_financiere:noter',
    'prix_anormalement_bas:flag',
    'prix_anormalement_bas:analyze_justification',
    'prix_anormalement_bas:accept_justification',
    'prix_anormalement_bas:reject_justification',
    'prix_excessif:flag',
    'prix_excessif:propose_rejet',
    'atteinte_concurrence:flag',
    'atteinte_concurrence:propose_rejet',
    'classement:read',
    'classement:validate',
    'offre:propose_attribution',
    'document_original:read',
    'document_original:verify',
    'document_original:flag_non_conformite',
    'classement:reprendre_apres_exclusion',
    'offre:propose_infructuosite',
    'pv_ouverture:read',
    'pv_ouverture:signer',
    'pv_ouverture:add_reserve',
    'pv_evaluation:read',
    'pv_evaluation:create',
    'pv_evaluation:signer',
    'pv_evaluation:add_reserve',
    'pv_complementaire:create',
    'pv_complementaire:signer',
    'registre_ouverture_plis:read',
    'registre_evaluation_offres:read',
    'rapport_copeo:submit_to_sc',
  ],
  MEMBRE_COMITE_TECHNIQUE: [
    'cahier_des_charges:read',
    'offre_technique:read',
    'document_offre:read',
    'analyse_technique:create',
    'analyse_technique:edit',
    'analyse_technique:read',
    'note_technique:create',
    'note_technique:edit',
    'commentaire_technique:add',
    'rapport_technique:create',
    'rapport_technique:edit',
    'rapport_technique:submit_to_copeo',
    'rapport_technique:read',
  ],
  RESP_VALID_INTERN: [
    'dossier:read',
    'membre_civ:manage',
    'dossier:assigner',
    'rapport_cm:read',
  ],
  VALIDATEUR_INTERNE_MARCHE: [
    'marche:valider_intern',
    'marche:rejeter_intern',
    'marche:read',
  ],
  VALIDATEUR_INTERNE_CDC: [
    'cdc:read',
    'cdc:valider_intern',
    'cdc:rejeter_intern',
  ],
} as const satisfies Record<SCRole, readonly string[]>;

export type Permission = (typeof ROLE_PERMISSIONS)[SCRole][number];

const ROLE_LABELS: Record<SCRole, { fr: string; ar: string }> = {
  RESP_SC: { fr: 'Responsable Service Contractant', ar: 'مسؤول المصلحة المتعاقدة' },
  REDACTEUR_CDC: { fr: 'Rédacteur CDC', ar: 'محرر دفتر الشروط' },
  EVALUATEUR: { fr: 'Évaluateur COPEO', ar: 'مقيّم COPEO' },
  MEMBRE_COMITE_TECHNIQUE: { fr: 'Membre Comité Technique', ar: 'عضو اللجنة التقنية' },
  RESP_VALID_INTERN: { fr: 'Responsable Validation Interne', ar: 'مسؤول التحقق الداخلي' },
  VALIDATEUR_INTERNE_MARCHE: { fr: 'Validateur Interne — Marché', ar: 'مدقق داخلي — الصفقة' },
  VALIDATEUR_INTERNE_CDC: { fr: 'Validateur Interne — CDC', ar: 'مدقق داخلي — دفتر الشروط' },
};

const KNOWN_ROLES = Object.keys(ROLE_PERMISSIONS) as SCRole[];

/** Normalise a backend role string to one of the Service Contractant-side roles. */
export function normaliseRole(raw: string | null | undefined): SCRole | null {
  if (!raw) return null;
  const up = raw.toUpperCase().trim().replace(/[\s-]+/g, '_');
  if (KNOWN_ROLES.includes(up as SCRole)) return up as SCRole;
  if (up.includes('COMITE') && up.includes('TECHNIQUE')) return 'MEMBRE_COMITE_TECHNIQUE';
  if (up.includes('ÉVALUATEUR') || up.includes('EVALUATEUR') || up.includes('COPEO')) return 'EVALUATEUR';
  if (up.includes('RESP') && up.includes('SC')) return 'RESP_SC';
  if (up.includes('REDACTEUR')) return 'REDACTEUR_CDC';
  if (up.includes('VALID') && up.includes('INTERN') && up.includes('CDC')) return 'VALIDATEUR_INTERNE_CDC';
  if (up.includes('VALID') && up.includes('INTERN')) return up.includes('RESP') ? 'RESP_VALID_INTERN' : 'VALIDATEUR_INTERNE_MARCHE';
  if (up === 'SERVICE_CONTRACTANT') return 'RESP_SC';
  return null;
}

export function permissionsForRole(role: SCRole | null): Set<Permission> {
  return new Set(role ? ROLE_PERMISSIONS[role] : []);
}

export function roleLabel(role: SCRole | null, lang: string): string {
  if (!role) return lang === 'ar' ? 'دور غير معروف' : 'Rôle inconnu';
  return ROLE_LABELS[role][lang === 'ar' ? 'ar' : 'fr'];
}

export const ALL_SC_ROLES = KNOWN_ROLES;
