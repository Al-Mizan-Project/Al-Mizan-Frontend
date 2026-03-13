'use client';

import React, { useState } from 'react';
import { SystemUser, USERS } from '@/components/DashboardSystemView';

// ─── Types ────────────────────────────────────────────────────────────────────
export type RoleName =
  | 'Administrateur Système'
  | 'Chef de Commission'
  | 'Évaluateur'
  | 'Évaluateur Administratif'
  | 'Service Contractant'
  | 'Opérateur Économique';

type CRUDKey = 'create' | 'read' | 'update' | 'delete';

interface Permission {
  create: boolean;
  read:   boolean;
  update: boolean;
  delete: boolean;
}

// ─── Entities derived from the BDD (all 15 tables grouped by domain) ─────────
type Entity =
  // Gestion des utilisateurs & accès
  | 'Utilisateurs & Membres'
  | 'Rôles & Permissions'
  | 'Organisations & Tutelles'
  // Appels d'offres
  | 'Appels d\'Offres'
  | 'Documents (Appel d\'Offres)'
  // Soumissions
  | 'Soumissions'
  | 'Documents (Soumission)'
  // Commissions
  | 'Commissions d\'Évaluation'
  | 'Commissions Internes'
  | 'Commissions Externes'
  // Évaluation & validation
  | 'Évaluations'
  | 'Validations'
  // Post-attribution
  | 'Contrats'
  | 'Recours'
  // Système
  | 'Notifications'
  | 'Journaux d\'Audit'
  | 'Détection Anomalies IA';

type PermissionMatrix = Record<RoleName, Record<Entity, Permission>>;

const ALL_ROLES: RoleName[] = [
  'Administrateur Système',
  'Chef de Commission',
  'Évaluateur',
  'Évaluateur Administratif',
  'Service Contractant',
  'Opérateur Économique',
];

const ALL_ENTITIES: Entity[] = [
  // Gestion des utilisateurs & accès
  'Utilisateurs & Membres',
  'Rôles & Permissions',
  'Organisations & Tutelles',
  // Appels d'offres
  'Appels d\'Offres',
  'Documents (Appel d\'Offres)',
  // Soumissions
  'Soumissions',
  'Documents (Soumission)',
  // Commissions
  'Commissions d\'Évaluation',
  'Commissions Internes',
  'Commissions Externes',
  // Évaluation & validation
  'Évaluations',
  'Validations',
  // Post-attribution
  'Contrats',
  'Recours',
  // Système
  'Notifications',
  'Journaux d\'Audit',
  'Détection Anomalies IA',
];

// ─── Entity groups for visual separation in the table ─────────────────────────
export const ENTITY_GROUPS: { label: string; entities: Entity[] }[] = [
  {
    label: 'Gestion des accès',
    entities: ['Utilisateurs & Membres', 'Rôles & Permissions', 'Organisations & Tutelles'],
  },
  {
    label: 'Appels d\'offres',
    entities: ['Appels d\'Offres', 'Documents (Appel d\'Offres)'],
  },
  {
    label: 'Soumissions',
    entities: ['Soumissions', 'Documents (Soumission)'],
  },
  {
    label: 'Commissions',
    entities: ['Commissions d\'Évaluation', 'Commissions Internes', 'Commissions Externes'],
  },
  {
    label: 'Évaluation & Validation',
    entities: ['Évaluations', 'Validations'],
  },
  {
    label: 'Post-attribution',
    entities: ['Contrats', 'Recours'],
  },
  {
    label: 'Système',
    entities: ['Notifications', 'Journaux d\'Audit', 'Détection Anomalies IA'],
  },
];

function perm(c: boolean, r: boolean, u: boolean, d: boolean): Permission {
  return { create: c, read: r, update: u, delete: d };
}

// ─── Complete permission matrix derived from BDD + user stories ───────────────
//
// Mapping rationale per role:
//
// ADMINISTRATEUR SYSTÈME
//   Full CRUD on everything — manages users, roles, org structure, audit logs.
//   Only role that can delete users (soft-delete), manage roles/permissions.
//
// CHEF DE COMMISSION
//   Orchestrates evaluation. Reads everything inside a procedure.
//   Creates/updates evaluations, validations, rapports, manages commissions.
//   Cannot touch users, roles, organisations, or IA anomaly config.
//
// ÉVALUATEUR (technique / financier)
//   Reads appel d'offres + soumissions assigned to them.
//   Creates and updates their own evaluations only.
//   No access to: users, roles, organisations, commissions mgmt, contracts.
//
// ÉVALUATEUR ADMINISTRATIF
//   Same scope as Évaluateur but focuses on administrative conformity.
//   Also creates Validations (conformité administrative).
//   Can read recours to understand their context.
//
// SERVICE CONTRACTANT
//   Publishes and manages their own appels d'offres + documents.
//   Reads soumissions and evaluations (results only, read-only).
//   Creates contrats after attribution. Can cancel/update their own avis.
//   Can see recours filed against their procedures. No system access.
//
// OPÉRATEUR ÉCONOMIQUE
//   Reads published appels d'offres. Creates/manages their own soumissions.
//   Uploads their own documents. Can file recours. Read-only on contracts
//   (their own). No access to evaluations, other users, or system tables.
//
const INITIAL_MATRIX: PermissionMatrix = {

  'Administrateur Système': {
    'Utilisateurs & Membres':         perm(true,  true,  true,  true),
    'Rôles & Permissions':            perm(true,  true,  true,  true),
    'Organisations & Tutelles':       perm(true,  true,  true,  true),
    'Appels d\'Offres':               perm(true,  true,  true,  true),
    'Documents (Appel d\'Offres)':    perm(true,  true,  true,  true),
    'Soumissions':                    perm(true,  true,  true,  true),
    'Documents (Soumission)':         perm(true,  true,  true,  true),
    'Commissions d\'Évaluation':      perm(true,  true,  true,  true),
    'Commissions Internes':           perm(true,  true,  true,  true),
    'Commissions Externes':           perm(true,  true,  true,  true),
    'Évaluations':                    perm(true,  true,  true,  true),
    'Validations':                    perm(true,  true,  true,  true),
    'Contrats':                       perm(true,  true,  true,  true),
    'Recours':                        perm(true,  true,  true,  true),
    'Notifications':                  perm(true,  true,  true,  true),
    'Journaux d\'Audit':              perm(false, true,  false, false),
    'Détection Anomalies IA':         perm(true,  true,  true,  true),
  },

  'Chef de Commission': {
    // Access to all procedure data — read + coordinate
    'Utilisateurs & Membres':         perm(false, true,  false, false),
    'Rôles & Permissions':            perm(false, false, false, false),
    'Organisations & Tutelles':       perm(false, true,  false, false),
    'Appels d\'Offres':               perm(false, true,  true,  false),
    'Documents (Appel d\'Offres)':    perm(false, true,  false, false),
    'Soumissions':                    perm(false, true,  true,  false),
    'Documents (Soumission)':         perm(false, true,  false, false),
    'Commissions d\'Évaluation':      perm(true,  true,  true,  false),
    'Commissions Internes':           perm(true,  true,  true,  false),
    'Commissions Externes':           perm(false, true,  false, false),
    'Évaluations':                    perm(true,  true,  true,  false),
    'Validations':                    perm(true,  true,  true,  false),
    'Contrats':                       perm(false, true,  false, false),
    'Recours':                        perm(false, true,  true,  false),
    'Notifications':                  perm(true,  true,  false, false),
    'Journaux d\'Audit':              perm(false, true,  false, false),
    'Détection Anomalies IA':         perm(false, true,  true,  false),
  },

  'Évaluateur': {
    // Reads assigned dossiers, submits technical/financial evaluations
    'Utilisateurs & Membres':         perm(false, false, false, false),
    'Rôles & Permissions':            perm(false, false, false, false),
    'Organisations & Tutelles':       perm(false, false, false, false),
    'Appels d\'Offres':               perm(false, true,  false, false),
    'Documents (Appel d\'Offres)':    perm(false, true,  false, false),
    'Soumissions':                    perm(false, true,  false, false),
    'Documents (Soumission)':         perm(false, true,  false, false),
    'Commissions d\'Évaluation':      perm(false, true,  false, false),
    'Commissions Internes':           perm(false, false, false, false),
    'Commissions Externes':           perm(false, false, false, false),
    'Évaluations':                    perm(true,  true,  true,  false),
    'Validations':                    perm(false, true,  false, false),
    'Contrats':                       perm(false, false, false, false),
    'Recours':                        perm(false, false, false, false),
    'Notifications':                  perm(false, true,  false, false),
    'Journaux d\'Audit':              perm(false, false, false, false),
    'Détection Anomalies IA':         perm(false, true,  false, false),
  },

  'Évaluateur Administratif': {
    // Administrative conformity: validates documents, creates admin evaluations
    'Utilisateurs & Membres':         perm(false, false, false, false),
    'Rôles & Permissions':            perm(false, false, false, false),
    'Organisations & Tutelles':       perm(false, false, false, false),
    'Appels d\'Offres':               perm(false, true,  false, false),
    'Documents (Appel d\'Offres)':    perm(false, true,  false, false),
    'Soumissions':                    perm(false, true,  true,  false), // update conformite_statut
    'Documents (Soumission)':         perm(false, true,  false, false),
    'Commissions d\'Évaluation':      perm(false, true,  false, false),
    'Commissions Internes':           perm(false, true,  false, false),
    'Commissions Externes':           perm(false, false, false, false),
    'Évaluations':                    perm(true,  true,  true,  false),
    'Validations':                    perm(true,  true,  true,  false),
    'Contrats':                       perm(false, false, false, false),
    'Recours':                        perm(false, true,  false, false),
    'Notifications':                  perm(false, true,  false, false),
    'Journaux d\'Audit':              perm(false, false, false, false),
    'Détection Anomalies IA':         perm(false, true,  false, false),
  },

  'Service Contractant': {
    // Publishes procedures, awards contracts, manages their own data
    'Utilisateurs & Membres':         perm(false, false, false, false),
    'Rôles & Permissions':            perm(false, false, false, false),
    'Organisations & Tutelles':       perm(false, true,  false, false),
    'Appels d\'Offres':               perm(true,  true,  true,  false), // cannot delete after publication
    'Documents (Appel d\'Offres)':    perm(true,  true,  true,  false),
    'Soumissions':                    perm(false, true,  false, false), // read-only (results)
    'Documents (Soumission)':         perm(false, true,  false, false),
    'Commissions d\'Évaluation':      perm(true,  true,  false, false), // creates commissions for their procedures
    'Commissions Internes':           perm(true,  true,  false, false),
    'Commissions Externes':           perm(false, true,  false, false),
    'Évaluations':                    perm(false, true,  false, false),
    'Validations':                    perm(false, true,  false, false),
    'Contrats':                       perm(true,  true,  true,  false), // creates/manages contracts
    'Recours':                        perm(false, true,  true,  false), // can respond to recours
    'Notifications':                  perm(true,  true,  false, false),
    'Journaux d\'Audit':              perm(false, false, false, false),
    'Détection Anomalies IA':         perm(false, false, false, false),
  },

  'Opérateur Économique': {
    // External user: reads published offers, manages own submissions & recours
    'Utilisateurs & Membres':         perm(false, false, false, false),
    'Rôles & Permissions':            perm(false, false, false, false),
    'Organisations & Tutelles':       perm(false, false, false, false),
    'Appels d\'Offres':               perm(false, true,  false, false), // published only
    'Documents (Appel d\'Offres)':    perm(false, true,  false, false), // download CDC
    'Soumissions':                    perm(true,  true,  true,  true),  // own soumissions only (withdraw = delete)
    'Documents (Soumission)':         perm(true,  true,  false, true),  // upload/delete own docs
    'Commissions d\'Évaluation':      perm(false, false, false, false),
    'Commissions Internes':           perm(false, false, false, false),
    'Commissions Externes':           perm(false, false, false, false),
    'Évaluations':                    perm(false, false, false, false),
    'Validations':                    perm(false, false, false, false),
    'Contrats':                       perm(false, true,  false, false), // read own contract
    'Recours':                        perm(true,  true,  false, false), // file & read own recours
    'Notifications':                  perm(false, true,  false, false),
    'Journaux d\'Audit':              perm(false, false, false, false),
    'Détection Anomalies IA':         perm(false, false, false, false),
  },
};

// ─── Role badge colours ───────────────────────────────────────────────────────
const ROLE_BADGE: Record<RoleName, string> = {
  'Administrateur Système':  'bg-purple-50 text-purple-700 border border-purple-200',
  'Chef de Commission':      'bg-teal-50 text-teal-700 border border-teal-200',
  'Évaluateur':              'bg-blue-50 text-blue-700 border border-blue-200',
  'Évaluateur Administratif':'bg-cyan-50 text-cyan-700 border border-cyan-200',
  'Service Contractant':     'bg-amber-50 text-amber-700 border border-amber-200',
  'Opérateur Économique':    'bg-gray-50 text-gray-700 border border-gray-200',
};

// ─── CRUD pill ────────────────────────────────────────────────────────────────
const CRUD_LABEL: Record<CRUDKey, string> = { create: 'C', read: 'R', update: 'U', delete: 'D' };
const CRUD_COLOR: Record<CRUDKey, { on: string; off: string }> = {
  create: { on: 'bg-emerald-100 text-emerald-700',  off: 'bg-gray-100 text-gray-300' },
  read:   { on: 'bg-blue-100 text-blue-700',         off: 'bg-gray-100 text-gray-300' },
  update: { on: 'bg-amber-100 text-amber-700',       off: 'bg-gray-100 text-gray-300' },
  delete: { on: 'bg-red-100 text-red-600',           off: 'bg-gray-100 text-gray-300' },
};

function CRUDCell({
  perm, role, entity, editable, onChange,
}: {
  perm: Permission; role: RoleName; entity: Entity;
  editable: boolean;
  onChange: (role: RoleName, entity: Entity, key: CRUDKey, val: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-1 justify-center">
      {(Object.keys(CRUD_LABEL) as CRUDKey[]).map(key => (
        <button
          key={key}
          disabled={!editable}
          onClick={() => onChange(role, entity, key, !perm[key])}
          title={key.charAt(0).toUpperCase() + key.slice(1)}
          className={`w-6 h-6 rounded text-xs font-black transition-all ${
            perm[key]
              ? CRUD_COLOR[key].on
              : CRUD_COLOR[key].off
          } ${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          {CRUD_LABEL[key]}
        </button>
      ))}
    </div>
  );
}

// ─── Role assignment panel ────────────────────────────────────────────────────
function RoleAssignmentPanel() {
  const [users, setUsers] = useState<SystemUser[]>(USERS);
  const [search, setSearch] = useState('');
  const [pendingChange, setPendingChange] = useState<{ userId: string; newRole: RoleName } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleRoleChange = (userId: string, newRole: RoleName) => {
    setPendingChange({ userId, newRole });
    setShowConfirm(true);
  };

  const confirmChange = () => {
    if (!pendingChange) return;
    setUsers(prev =>
      prev.map(u =>
        u.id === pendingChange.userId ? { ...u, role: pendingChange.newRole } : u
      )
    );
    setPendingChange(null);
    setShowConfirm(false);
  };

  const pendingUser = pendingChange ? users.find(u => u.id === pendingChange.userId) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Rechercher un utilisateur…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:border-[#97A675] focus:outline-none transition-all placeholder-gray-400"
          style={{ color: '#1C4532' }}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-[#F4F7F4]">
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Utilisateur</th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rôle actuel</th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Modifier le rôle</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-[#F4F7F4]/60 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                      {u.prenom[0]}{u.nom[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{u.prenom} {u.nom}</p>
                      <p className="text-xs text-gray-400">{u.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role as RoleName]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value as RoleName)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-[#00738C] transition-colors cursor-pointer"
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm modal */}
      {showConfirm && pendingUser && pendingChange && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-black text-gray-800">Modifier le rôle</h3>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Affecter le rôle <span className="font-bold text-[#1C4532]">{pendingChange.newRole}</span> à{' '}
              <span className="font-bold text-gray-800">{pendingUser.prenom} {pendingUser.nom}</span> ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-all">
                Annuler
              </button>
              <button onClick={confirmChange}
                className="flex-1 py-2.5 text-white font-bold text-sm rounded-xl transition-all"
                style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type SubTab = 'matrice' | 'affectation';

export default function RolesPermissionsView() {
  const [activeTab,  setActiveTab]  = useState<SubTab>('matrice');
  const [matrix,     setMatrix]     = useState<PermissionMatrix>(INITIAL_MATRIX);
  const [activeRole, setActiveRole] = useState<RoleName>('Administrateur Système');
  const [saved,      setSaved]      = useState(false);
  const [editMode,   setEditMode]   = useState(false);

  const handleCRUDChange = (role: RoleName, entity: Entity, key: CRUDKey, val: boolean) => {
    setMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [entity]: { ...prev[role][entity], [key]: val },
      },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Sub-tab row */}
      <div className="border-b border-gray-200 -mx-6 -mt-6 px-6 mb-6 flex items-center gap-0 bg-white">
        {([
          { id: 'matrice'     as SubTab, label: 'Matrice des permissions' },
          { id: 'affectation' as SubTab, label: 'Affectation des rôles'   },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3.5 text-sm font-semibold relative transition-all ${
              activeTab === tab.id ? 'text-[#00738C]' : 'text-gray-500 hover:text-gray-800'
            }`}>
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#00738C' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Matrice tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'matrice' && (
        <div className="flex flex-col gap-5">

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-xs text-gray-500 font-medium">Légende :</p>
            {(Object.keys(CRUD_LABEL) as CRUDKey[]).map(key => (
              <span key={key} className={`text-xs font-bold px-2 py-0.5 rounded ${CRUD_COLOR[key].on}`}>
                {CRUD_LABEL[key]} — {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
            ))}
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-300 ml-1">
              C — Non accordé
            </span>
          </div>

          {/* Role selector pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {ALL_ROLES.map(role => (
              <button key={role} onClick={() => setActiveRole(role)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                  activeRole === role
                    ? ROLE_BADGE[role] + ' shadow-sm scale-105'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                }`}>
                {role}
              </button>
            ))}
          </div>

          {/* Matrix table for selected role */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Role header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
              style={{ background: '#F4F7F4' }}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-xl ${ROLE_BADGE[activeRole]}`}>
                  {activeRole}
                </span>
                <p className="text-xs text-gray-500">
                  {USERS.filter(u => u.role === activeRole).length} utilisateur(s) avec ce rôle
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Sauvegardé
                  </span>
                )}
                {editMode ? (
                  <button onClick={handleSave}
                    className="px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-all"
                    style={{ background: '#1C4532' }}>
                    Sauvegarder
                  </button>
                ) : (
                  <button onClick={() => setEditMode(true)}
                    className="px-4 py-1.5 text-xs font-bold border border-gray-300 text-gray-600 rounded-lg hover:border-[#00738C] hover:text-[#00738C] transition-all">
                    Modifier
                  </button>
                )}
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Entité / Module</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Permissions (C R U D)</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Accès total</th>
                </tr>
              </thead>
              <tbody>
                {ENTITY_GROUPS.map(group => (
                  <React.Fragment key={group.label}>
                    <tr className="border-b border-gray-200">
                      <td colSpan={3} className="px-6 py-2"
                        style={{ background: 'linear-gradient(90deg, #1C453210, transparent)' }}>
                        <span className="text-xs font-black uppercase tracking-widest"
                          style={{ color: '#1C4532' }}>
                          {group.label}
                        </span>
                      </td>
                    </tr>
                    {group.entities.map((entity, i) => {
                      const p = matrix[activeRole][entity];
                      const accessCount = [p.create, p.read, p.update, p.delete].filter(Boolean).length;
                      const totalAccess = accessCount === 4;
                      const noAccess = accessCount === 0;
                      return (
                        <tr key={entity}
                          className={`border-b border-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-[#F4F7F4]/20'}`}>
                          <td className="pl-10 pr-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                noAccess ? 'bg-gray-300' : totalAccess ? 'bg-emerald-400' : 'bg-amber-400'
                              }`} />
                              <span className="text-sm font-medium text-gray-800">{entity}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <CRUDCell
                              perm={p}
                              role={activeRole}
                              entity={entity}
                              editable={editMode}
                              onChange={handleCRUDChange}
                            />
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`text-xs font-bold ${
                              noAccess    ? 'text-gray-400' :
                              totalAccess ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {noAccess ? 'Aucun' : totalAccess ? 'Complet' : `${accessCount}/4`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* All-roles overview mini table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#F4F7F4]">
              <h3 className="text-sm font-bold text-gray-800">Vue d'ensemble — tous les rôles</h3>
              <p className="text-xs text-gray-500 mt-0.5">Nombre de permissions accordées par rôle (sur {ALL_ENTITIES.length * 4} max)</p>
            </div>
            <div className="p-4 grid grid-cols-2 xl:grid-cols-3 gap-3">
              {ALL_ROLES.map(role => {
                const total = ALL_ENTITIES.reduce((sum, entity) => {
                  const p = matrix[role][entity];
                  return sum + [p.create, p.read, p.update, p.delete].filter(Boolean).length;
                }, 0);
                const max = ALL_ENTITIES.length * 4;
                const pct = Math.round((total / max) * 100);
                return (
                  <button key={role} onClick={() => setActiveRole(role)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      activeRole === role ? 'border-[#00738C] bg-[#D6EAD4]' : 'border-gray-100 hover:border-gray-300'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[role]}`}>
                        {role}
                      </span>
                      <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: '#00738C' }} />
                      </div>
                    </div>
                    <span className="text-sm font-black text-gray-700 flex-shrink-0">{total}/{max}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Affectation tab ──────────────────────────────────────────────────── */}
      {activeTab === 'affectation' && <RoleAssignmentPanel />}
    </div>
  );
}