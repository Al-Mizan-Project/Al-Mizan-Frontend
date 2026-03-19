'use client';

import { useMemo } from 'react';
import { DOSSIERS, EVALUATEURS_DATA } from '@/lib/dossiers-data';

// ─── Static user pool (simulates a real user DB) ──────────────────────────────
export interface SystemUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'Administrateur Système' | 'Chef de Commission' | 'Évaluateur' | 'Évaluateur Administratif' | 'Service Contractant' | 'Opérateur Économique';
  statut: 'Actif' | 'En attente' | 'Bloqué';
  dateInscription: string;
  derniereAction: string;
}

export const USERS: SystemUser[] = [
  { id: 'U-001', nom: 'Benali',   prenom: 'Amine',   email: 'a.benali@elmizan.dz',   role: 'Évaluateur',                statut: 'Actif',      dateInscription: '2024-09-01', derniereAction: '2024-11-10' },
  { id: 'U-002', nom: 'Hadj',     prenom: 'Samira',  email: 's.hadj@elmizan.dz',     role: 'Évaluateur',                statut: 'Actif',      dateInscription: '2024-09-03', derniereAction: '2024-11-09' },
  { id: 'U-003', nom: 'Meziane',  prenom: 'Karim',   email: 'k.meziane@elmizan.dz',  role: 'Évaluateur',                statut: 'Actif',      dateInscription: '2024-09-05', derniereAction: '2024-11-08' },
  { id: 'U-004', nom: 'Ouali',    prenom: 'Leïla',   email: 'l.ouali@elmizan.dz',    role: 'Évaluateur',                statut: 'Bloqué',     dateInscription: '2024-09-07', derniereAction: '2024-10-30' },
  { id: 'U-005', nom: 'Tebbal',   prenom: 'Mourad',  email: 'm.tebbal@elmizan.dz',   role: 'Évaluateur',                statut: 'Actif',      dateInscription: '2024-09-10', derniereAction: '2024-11-11' },
  { id: 'U-006', nom: 'Ferhat',   prenom: 'Nadia',   email: 'n.ferhat@elmizan.dz',   role: 'Évaluateur Administratif',  statut: 'Actif',      dateInscription: '2024-09-12', derniereAction: '2024-11-10' },
  { id: 'U-007', nom: 'Cherif',   prenom: 'Yacine',  email: 'y.cherif@elmizan.dz',   role: 'Évaluateur Administratif',  statut: 'En attente', dateInscription: '2024-11-01', derniereAction: '2024-11-01' },
  { id: 'U-008', nom: 'Amrani',   prenom: 'Farida',  email: 'f.amrani@elmizan.dz',   role: 'Chef de Commission',        statut: 'Actif',      dateInscription: '2024-08-15', derniereAction: '2024-11-11' },
  { id: 'U-009', nom: 'Boudjelal',prenom: 'Sofiane', email: 's.boudjelal@gov.dz',    role: 'Service Contractant',       statut: 'Actif',      dateInscription: '2024-08-20', derniereAction: '2024-11-09' },
  { id: 'U-010', nom: 'Khelil',   prenom: 'Rania',   email: 'r.khelil@gov.dz',       role: 'Service Contractant',       statut: 'En attente', dateInscription: '2024-11-08', derniereAction: '2024-11-08' },
  { id: 'U-011', nom: 'Mansouri', prenom: 'Tarek',   email: 't.mansouri@batimex.dz', role: 'Opérateur Économique',      statut: 'Actif',      dateInscription: '2024-10-01', derniereAction: '2024-11-07' },
  { id: 'U-012', nom: 'Bouras',   prenom: 'Sihem',   email: 's.bouras@techbuild.dz', role: 'Opérateur Économique',      statut: 'Actif',      dateInscription: '2024-10-05', derniereAction: '2024-11-06' },
  { id: 'U-013', nom: 'Djebbar',  prenom: 'Omar',    email: 'o.djebbar@trans.dz',    role: 'Opérateur Économique',      statut: 'Bloqué',     dateInscription: '2024-10-10', derniereAction: '2024-10-25' },
  { id: 'U-014', nom: 'Sahel',    prenom: 'Zineb',   email: 'z.sahel@biopharma.dz',  role: 'Opérateur Économique',      statut: 'En attente', dateInscription: '2024-11-10', derniereAction: '2024-11-10' },
  { id: 'U-015', nom: 'Belkacem', prenom: 'Hichem',  email: 'h.belkacem@elmizan.dz', role: 'Administrateur Système',    statut: 'Actif',      dateInscription: '2024-08-01', derniereAction: '2024-11-11' },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color, onClick }: {
  label: string; value: number | string; sub?: string;
  icon: React.ReactNode; color: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 transition-all' : ''}`}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 leading-tight mb-1">{label}</p>
        <p className="text-3xl font-black" style={{ color: '#1C4532' }}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Recent activity row ──────────────────────────────────────────────────────
const ROLE_BADGE: Record<SystemUser['role'], string> = {
  'Administrateur Système':  'bg-purple-50 text-purple-700 border border-purple-200',
  'Chef de Commission':      'bg-teal-50 text-teal-700 border border-teal-200',
  'Évaluateur':              'bg-blue-50 text-blue-700 border border-blue-200',
  'Évaluateur Administratif':'bg-cyan-50 text-cyan-700 border border-cyan-200',
  'Service Contractant':     'bg-amber-50 text-amber-700 border border-amber-200',
  'Opérateur Économique':    'bg-gray-50 text-gray-700 border border-gray-200',
};

const STATUT_STYLE: Record<SystemUser['statut'], string> = {
  'Actif':      'text-emerald-700',
  'En attente': 'text-amber-600',
  'Bloqué':     'text-red-600',
};

// ─── Main export ──────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (page: 'utilisateurs' | 'roles') => void;
}

export default function DashboardSystemView({ onNavigate }: Props) {
  const stats = useMemo(() => ({
    totalUsers:    USERS.length,
    actifs:        USERS.filter(u => u.statut === 'Actif').length,
    enAttente:     USERS.filter(u => u.statut === 'En attente').length,
    bloques:       USERS.filter(u => u.statut === 'Bloqué').length,
    totalDossiers: DOSSIERS.length,
    enRetard:      DOSSIERS.filter(d => d.status === 'En retard').length,
  }), []);

  const recentUsers = useMemo(() =>
    [...USERS].sort((a, b) => b.dateInscription.localeCompare(a.dateInscription)).slice(0, 6),
  []);

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Utilisateurs actifs"
          value={stats.actifs}
          sub={`sur ${stats.totalUsers} comptes`}
          color="#1C4532"
          onClick={() => onNavigate('utilisateurs')}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
        />
        <StatCard
          label="Comptes en attente de validation"
          value={stats.enAttente}
          sub="Nécessitent une action"
          color="#D97706"
          onClick={() => onNavigate('utilisateurs')}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          }
        />
        <StatCard
          label="Comptes bloqués"
          value={stats.bloques}
          color="#DC2626"
          onClick={() => onNavigate('utilisateurs')}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          }
        />
        <StatCard
          label="Dossiers en retard"
          value={stats.enRetard}
          sub={`sur ${stats.totalDossiers} dossiers`}
          color="#7C3AED"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          }
        />
      </div>

      {/* ── Répartition par rôle ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Role distribution */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-5">Répartition par rôle</h3>
          <div className="space-y-3">
            {(Object.keys(ROLE_BADGE) as SystemUser['role'][]).map(role => {
              const count = USERS.filter(u => u.role === role).length;
              const pct   = Math.round((count / USERS.length) * 100);
              return (
                <div key={role} className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_BADGE[role]}`}>
                    {role}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: '#00738C' }} />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent registrations */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-800">Inscriptions récentes</h3>
            <button onClick={() => onNavigate('utilisateurs')}
              className="text-xs font-semibold text-[#00738C] hover:text-[#1C4532] transition-colors">
              Voir tous →
            </button>
          </div>
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                  {u.prenom[0]}{u.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{u.prenom} {u.nom}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs font-bold ${STATUT_STYLE[u.statut]}`}>{u.statut}</span>
                  <span className="text-xs text-gray-400">{u.dateInscription}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick actions ───────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Actions rapides</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => onNavigate('utilisateurs')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Valider les comptes en attente ({stats.enAttente})
          </button>
          <button onClick={() => onNavigate('roles')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Gérer les rôles & permissions
          </button>
        </div>
      </div>
    </div>
  );
}