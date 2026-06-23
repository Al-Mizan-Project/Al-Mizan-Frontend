// components/UtilisateursView.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import Pagination from '@/components/Pagination';

const ROWS_PER_PAGE = 10;

const ROLES: ('Tous' | SystemUser['role'])[] = [
  'Tous', 'Administrateur Système', 'Chef de Commission',
  'Évaluateur', 'Évaluateur Administratif', 'Service Contractant', 'Opérateur Économique',
];
const STATUTS: ('Tous' | SystemUser['statut'])[] = ['Tous', 'Actif', 'En attente', 'Bloqué'];

const ROLE_BADGE: Record<SystemUser['role'], string> = {
  'Administrateur Système': 'bg-purple-50 text-purple-700 border border-purple-200',
  'Chef de Commission': 'bg-teal-50 text-teal-700 border border-teal-200',
  'Évaluateur': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Évaluateur Administratif': 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  'Service Contractant': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Opérateur Économique': 'bg-gray-50 text-gray-700 border border-gray-200',
};

const STATUT_STYLE: Record<SystemUser['statut'], string> = {
  'Actif': 'text-emerald-700',
  'En attente': 'text-amber-600',
  'Bloqué': 'text-red-600',
};

type SortDir = 'asc' | 'desc' | null;

// ─── Simulated action history per user ───────────────────────────────────────
function buildHistory(u: SystemUser) {
  return [
    { date: u.derniereAction, action: 'Dernière connexion', detail: '' },
    { date: u.dateInscription, action: 'Compte créé', detail: `Rôle: ${u.role}` },
  ];
}

function Dropdown<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const isActive = value !== options[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${isActive ? 'bg-[#1C4532] text-white border-[#1C4532]' : 'bg-white text-gray-700 border-gray-200 hover:bg-[#F4F7F4]'
          }`}>
        {isActive ? value : label}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[200px] py-1">
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === opt ? 'text-[#1C4532] font-bold bg-[#F4F7F4]' : 'text-gray-600 hover:bg-[#F4F7F4]'
                }`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColHeader({ label, sortKey, sortBy, sortDir, onSort }: { label: string; sortKey: string; sortBy: string | null; sortDir: 'asc' | 'desc' | null; onSort: (k: string) => void }) {
  const active = sortBy === sortKey;
  return (
    <button onClick={() => onSort(sortKey)} className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wider hover:text-[#1C4532] transition-colors">
      {label}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={active ? 'text-[#1C4532]' : 'text-gray-400'}>
        <polyline points={(!active || sortDir === 'asc') ? '6 9 12 15 18 9' : '18 15 12 9 6 15'} />
      </svg>
    </button>
  );
}

function ConfirmModal({ message, onConfirm, onCancel, danger = false }: { message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
        <p className="text-base font-bold text-gray-800 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-all">
            Annuler
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 text-white font-bold text-sm rounded-xl transition-all ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#00738C] hover:bg-[#005f75]'
              }`}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDrawer({ user, roleName, onClose, onAction, onNavigateToRoles, onNavigateToPermissions }: {
  user: User;
  roleName: string;
  onClose: () => void;
  onAction: (id: number, action: 'supprimer' | 'bloquer' | 'debloquer') => void;
  onNavigateToRoles: () => void;
  onNavigateToPermissions: () => void;
}) {
  const initials = user.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
              {initials}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">{user.email}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{roleName}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none mt-1">×</button>
        </div>

        <div className="p-6 border-b border-gray-100 space-y-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Informations</h4>
          {[
            ['ID', user.id],
            ['Email', user.email],
            ['Statut', user.statut],
            ['Date d\'inscription', user.dateInscription],
            ['Dernière action', user.derniereAction],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">{k}</span>
              <span className="font-semibold text-gray-800">{String(v)}</span>
            </div>
          ))}
        </div>

        <div className="p-6 flex flex-col gap-2 mt-auto">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Actions</h4>
          <button
            onClick={onNavigateToRoles}
            className="w-full py-2.5 rounded-xl text-sm font-bold border-2 border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] transition-all"
          >
            Modifier le rôle
          </button>
          <button
            onClick={onNavigateToPermissions}
            className="w-full py-2.5 rounded-xl text-sm font-bold border-2 border-blue-300 text-blue-600 hover:bg-blue-50 transition-all"
          >
            Modifier les permissions
          </button>
          <button
            onClick={() => onAction(user.id_utilisateur, user.is_active ? 'bloquer' : 'debloquer')}
            className={`w-full py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${user.is_active ? 'border-orange-300 text-orange-600 hover:bg-orange-50' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}`}
          >
            {user.is_active ? 'Bloquer' : 'Débloquer'}
          </button>
          <button
            onClick={() => onAction(user.id_utilisateur, 'supprimer')}
            className="w-full py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 transition-all"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function UtilisateursView() {
  const [users, setUsers] = useState<SystemUser[]>(USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<typeof ROLES[number]>('Tous');
  const [statutFilter, setStatutFilter] = useState<typeof STATUTS[number]>('Tous');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; action: () => void; danger?: boolean } | null>(null);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchSearch = !q
        || u.nom.toLowerCase().includes(q)
        || u.prenom.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q)
        || u.id.toLowerCase().includes(q);
      const matchRole = roleFilter === 'Tous' || u.role === roleFilter;
      const matchStatut = statutFilter === 'Tous' || u.statut === statutFilter;
      return matchSearch && matchRole && matchStatut;
    });
  }, [users, search, roleFilter, statutFilter]);

  const sorted = useMemo(() => {
    if (!sortBy) return filtered;
    return [...filtered].sort((a, b) => {
      const av = sortBy === 'nom' ? `${a.nom} ${a.prenom}` : sortBy === 'email' ? a.email
        : sortBy === 'role' ? a.role : sortBy === 'date' ? a.dateInscription : a.statut;
      const bv = sortBy === 'nom' ? `${b.nom} ${b.prenom}` : sortBy === 'email' ? b.email
        : sortBy === 'role' ? b.role : sortBy === 'date' ? b.dateInscription : b.statut;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortBy, sortDir, roles]);

  const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE);
  const paged = sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // ─── Action handlers ────────────────────────────────────────────────────────
  const applyAction = (id: string, action: 'valider' | 'bloquer' | 'debloquer' | 'supprimer') => {
    const user = users.find(u => u.id === id)!;
    const messages: Record<string, string> = {
      valider: `Valider le compte de ${user.prenom} ${user.nom} ?`,
      bloquer: `Bloquer le compte de ${user.prenom} ${user.nom} ? L'utilisateur sera notifié.`,
      debloquer: `Débloquer le compte de ${user.prenom} ${user.nom} ?`,
      supprimer: `Supprimer définitivement le compte de ${user.prenom} ${user.nom} ? Cette action est irréversible.`,
    };
    setConfirmModal({
      message: messages[action],
      danger: action === 'supprimer' || action === 'bloquer',
      action: () => {
        setUsers(prev => {
          if (action === 'supprimer') return prev.filter(u => u.id !== id);
          return prev.map(u => u.id !== id ? u : {
            ...u,
            statut: action === 'valider' ? 'Actif' : action === 'bloquer' ? 'Bloqué' : 'Actif',
          });
        });
        setConfirmModal(null);
        setSelectedUser(null);
      },
    });
  };

  const resetFilters = () => { setSearch(''); setStatutFilter('Tous'); setPage(1); };

  if (loading) return <div className="flex justify-center p-12">Chargement des utilisateurs...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Rechercher par nom, email, ID…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:border-[#97A675] focus:outline-none transition-all placeholder-gray-400"
            style={{ color: '#1C4532' }} />
        </div>
        <Dropdown label="Rôle" options={ROLES} value={roleFilter} onChange={v => { setRoleFilter(v); setPage(1); }} />
        <Dropdown label="Statut" options={STATUTS} value={statutFilter} onChange={v => { setStatutFilter(v); setPage(1); }} />
      </div>

      <p className="text-xs text-gray-500">
        <span className="font-bold text-gray-700">{filtered.length}</span> utilisateur{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
      </p>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <h3 className="text-2xl font-black text-gray-800">Aucun utilisateur trouvé</h3>
          <button onClick={resetFilters} className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#00738C] text-[#00738C] font-bold text-sm rounded-xl hover:bg-[#D6EAD4] transition-all">Réinitialiser les filtres</button>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F4F7F4]">
                  <th className="px-5 py-3 text-left"><ColHeader label="ID" sortKey="id" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
                  <th className="px-5 py-3 text-left"><ColHeader label="Email" sortKey="email" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
                  <th className="px-5 py-3 text-left"><ColHeader label="Rôle" sortKey="role" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
                  <th className="px-5 py-3 text-left"><ColHeader label="Créé le" sortKey="date" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(u => {
                  const roleName = getRoleName(u.id_role);
                  return (
                    <tr key={u.id_utilisateur} className="border-b border-gray-50 hover:bg-[#F4F7F4]/60 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-500">{u.id_utilisateur}</td>
                      <td className="px-5 py-3 text-sm text-gray-800 font-medium">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[roleName] || ROLE_BADGE['default']}`}>{roleName}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:border-[#00738C] hover:text-[#00738C] transition-all"
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={sorted.length} rowsPerPage={ROWS_PER_PAGE} />
          )}
        </>
      )}

      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          roleName={getRoleName(selectedUser.id_role)}
          onClose={() => setSelectedUser(null)}
          onAction={applyAction}
          onNavigateToRoles={() => { setSelectedUser(null); onNavigateToRoles?.(); }}
          onNavigateToPermissions={() => { setSelectedUser(null); onNavigateToPermissions?.(); }}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          danger={confirmModal.danger}
          onConfirm={confirmModal.action}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
