import type { ReactElement } from 'react';
import type { Permission } from '@/lib/sc/permissions';

export interface NavItem {
  key: string;
  segment: string;            // path segment under /dashboard/contractant
  fr: string;
  ar: string;
  icon: ReactElement;
  anyOf: Permission[] | null; // null = visible to every SC role
}

const i = (d: ReactElement) => d;

export const CONTRACTANT_NAV: NavItem[] = [
  {
    key: 'dashboard', segment: '', fr: 'Tableau de bord', ar: 'لوحة التحكم', anyOf: null,
    icon: i(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>),
  },
  {
    key: 'marches', segment: 'marches', fr: "Appels d'offres", ar: 'المناقصات', anyOf: ['marche:read'],
    icon: i(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
  },
  {
    key: 'validations', segment: 'validations', fr: 'Validation interne', ar: 'التحقق الداخلي',
    anyOf: ['marche:valider_intern', 'cdc:valider_intern', 'dossier:read'],
    icon: i(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>),
  },
  {
    key: 'demo-conformite', segment: 'demo-conformite', fr: 'Conformité IA', ar: 'المطابقة بالذكاء الاصطناعي',
    anyOf: null,
    icon: i(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>),
  },
  {
    key: 'clarifications', segment: 'clarifications', fr: 'Clarifications', ar: 'طلبات التوضيح', anyOf: ['question:read'],
    icon: i(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  },
  {
    key: 'demandes-oe', segment: 'demandes-oe', fr: 'Demandes OE', ar: 'طلبات المتعاملين', anyOf: ['oe:approuve'],
    icon: i(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>),
  },
  {
    key: 'organisation', segment: 'organisation', fr: 'Mon organisation', ar: 'مؤسستي', anyOf: null,
    icon: i(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  },
  {
    key: 'membres', segment: 'organisation/membres', fr: 'Membres', ar: 'الأعضاء', anyOf: ['membre:create', 'membre:update', 'role:assign'],
    icon: i(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  },
  {
    key: 'roles', segment: 'organisation/roles', fr: 'Rôles & Permissions', ar: 'الأدوار والصلاحيات', anyOf: ['role:assign', 'membre:update'],
    icon: i(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  },
  {
    key: 'commissions', segment: 'organisation/commissions', fr: 'Commissions COPEO', ar: 'لجان COPEO',
    anyOf: ['membre_civ:manage', 'role:assign', 'marche:create'],
    icon: i(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>),
  },
];
