// Fixed roles & permissions for the Service Contractant area (source of truth — PV pages 5-8).
// Permissions are immutable per role; the backend enforces them, the frontend uses them to
// gate navigation and actions.

export type SCRole =
  | 'RESP_SC'
  | 'REDACTEUR_CDC'
  | 'RESP_VALID_INTERN'
  | 'VALIDATEUR_INTERNE_MARCHE'
  | 'VALIDATEUR_INTERNE_CDC';

export type Permission =
  | 'marche:create' | 'marche:read' | 'marche:update' | 'marche:publish' | 'marche:attribuer'
  | 'marche:valider_intern' | 'marche:rejeter_intern'
  | 'cdc:create' | 'cdc:update' | 'cdc:submit_validation' | 'cdc:read'
  | 'cdc:valider_intern' | 'cdc:rejeter_intern'
  | 'membre:create' | 'membre:update' | 'membre:deactivate' | 'role:assign'
  | 'oe:approuve' | 'oe:refuser'
  | 'question:read' | 'question:repondre' | 'document:upload'
  | 'offre:read_after_ouverture' | 'rapport:read' | 'recours:read'
  | 'dossier:read' | 'dossier:assigner' | 'membre_civ:manage' | 'rapport_cm:read';

export const ROLE_PERMISSIONS: Record<SCRole, Permission[]> = {
  RESP_SC: [
    'marche:create', 'marche:read', 'marche:update', 'marche:publish', 'marche:attribuer',
    'membre:create', 'membre:update', 'membre:deactivate', 'role:assign',
    'oe:approuve', 'oe:refuser',
    'offre:read_after_ouverture', 'rapport:read', 'recours:read',
  ],
  REDACTEUR_CDC: [
    'marche:create', 'marche:read', 'marche:update',
    'cdc:create', 'cdc:update', 'cdc:submit_validation',
    'question:read', 'question:repondre', 'document:upload',
  ],
  RESP_VALID_INTERN: [
    'dossier:read', 'membre_civ:manage', 'dossier:assigner', 'rapport_cm:read',
  ],
  VALIDATEUR_INTERNE_MARCHE: [
    'marche:valider_intern', 'marche:rejeter_intern', 'marche:read',
  ],
  VALIDATEUR_INTERNE_CDC: [
    'cdc:read', 'cdc:valider_intern', 'cdc:rejeter_intern',
  ],
};

const ROLE_LABELS: Record<SCRole, { fr: string; ar: string }> = {
  RESP_SC: { fr: 'Responsable Service Contractant', ar: 'مسؤول المصلحة المتعاقدة' },
  REDACTEUR_CDC: { fr: 'Rédacteur CDC', ar: 'محرر دفتر الشروط' },
  RESP_VALID_INTERN: { fr: 'Responsable Validation Interne', ar: 'مسؤول التحقق الداخلي' },
  VALIDATEUR_INTERNE_MARCHE: { fr: 'Validateur Interne — Marché', ar: 'مدقق داخلي — الصفقة' },
  VALIDATEUR_INTERNE_CDC: { fr: 'Validateur Interne — CDC', ar: 'مدقق داخلي — دفتر الشروط' },
};

const KNOWN_ROLES = Object.keys(ROLE_PERMISSIONS) as SCRole[];

/** Normalise a backend role string to one of the SC roles, or null if it is not an SC role. */
export function normaliseRole(raw: string | null | undefined): SCRole | null {
  if (!raw) return null;
  const up = raw.toUpperCase().trim().replace(/\s+/g, '_');
  if (KNOWN_ROLES.includes(up as SCRole)) return up as SCRole;
  // tolerant fallbacks for older seeds
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
