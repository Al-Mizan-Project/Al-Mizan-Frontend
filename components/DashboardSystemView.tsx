// components/DashboardSystemView.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
  role?: { id: number; name: string } | string | null;
}

const getRoleName = (user: User): string => {
  if (!user.role) return 'Sans rôle';
  if (typeof user.role === 'string') return user.role;
  return user.role.name || 'Sans rôle';
};

export default function DashboardSystemView({ onNavigate }: { onNavigate: (page: 'utilisateurs' | 'roles') => void }) {
  const [stats, setStats] = useState({ total: 0, actifs: 0, bloques: 0 });
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: users } = await api.get('/users');
        const total = users.length;
        const actifs = users.filter((u: User) => u.is_active === true).length;
        const bloques = users.filter((u: User) => u.is_active === false).length;
        setStats({ total, actifs, bloques });

        const roles: Record<string, number> = {};
        users.forEach((user: User) => {
          const roleName = getRoleName(user);
          roles[roleName] = (roles[roleName] || 0) + 1;
        });
        setRoleCounts(roles);

        const recent = [...users]
          .sort((a, b) => new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime())
          .slice(0, 6);
        setRecentUsers(recent);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-12">Chargement du tableau de bord...</div>;
  }

  const StatCard = ({ label, value, sub, icon, color, onClick }: any) => (
    <div key={label} onClick={onClick} className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 transition-all' : ''}`}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}><span style={{ color }}>{icon}</span></div>
      <div><p className="text-xs text-gray-500 leading-tight mb-1">{label}</p><p className="text-3xl font-black" style={{ color: '#1C4532' }}>{value}</p>{sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}</div>
    </div>
  );

  const ROLE_BADGE: Record<string, string> = {
    'Administrateur Système': 'bg-purple-50 text-purple-700 border border-purple-200',
    'Chef de Commission': 'bg-teal-50 text-teal-700 border border-teal-200',
    'Évaluateur': 'bg-blue-50 text-blue-700 border border-blue-200',
    'Évaluateur Administratif': 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    'Service Contractant': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Opérateur Économique': 'bg-gray-50 text-gray-700 border border-gray-200',
  };
  const DEFAULT_BADGE = 'bg-gray-100 text-gray-600 border border-gray-200';
  const STATUT_STYLE: Record<string, string> = { 'Actif': 'text-emerald-700', 'En attente': 'text-amber-600', 'Bloqué': 'text-red-600' };

  return (
    <div className="flex flex-col gap-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="Utilisateurs actifs" value={stats.actifs} sub={`sur ${stats.total} comptes`} color="#1C4532" onClick={() => onNavigate('utilisateurs')} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        <StatCard label="Comptes bloqués" value={stats.bloques} color="#DC2626" onClick={() => onNavigate('utilisateurs')} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>} />
        <StatCard label="Total utilisateurs" value={stats.total} color="#00738C" onClick={() => onNavigate('utilisateurs')} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
      </div>

      {/* Role distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-5">Répartition par rôle</h3>
          <div className="space-y-3">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_BADGE[role] || DEFAULT_BADGE}`}>
                  {role}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${(count / stats.total) * 100}%`, background: '#00738C' }} />
                </div>
                <span className="text-xs font-bold text-gray-600 w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-800">Inscriptions récentes</h3>
            <button onClick={() => onNavigate('utilisateurs')} className="text-xs font-semibold text-[#00738C] hover:text-[#1C4532] transition-colors">Voir tous →</button>
          </div>
          <div className="space-y-3">
            {recentUsers.map((u, idx) => (
              <div key={u?.id ?? idx} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                  {(u.prenom?.[0] || '')}{(u.nom?.[0] || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{u.prenom} {u.nom}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs font-bold ${STATUT_STYLE[u.is_active ? 'Actif' : 'Bloqué']}`}>
                    {u.is_active ? 'Actif' : 'Bloqué'}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(u.date_joined).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Actions rapides</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => onNavigate('utilisateurs')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md" style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Gérer les utilisateurs
          </button>
          <button onClick={() => onNavigate('roles')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Gérer les rôles & permissions
          </button>
        </div>
      </div>
    </div>
  );
}