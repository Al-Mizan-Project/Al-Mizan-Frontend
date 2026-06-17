'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import Pagination from '@/components/Pagination';

interface User {
  id_utilisateur: number;
  email: string;
  nom?: string;
  prenom?: string;
  created_at: string;
  is_active: boolean;
}

interface Props {
  roleId: number;
  roleName: string;
  onCreateClick: () => void;
}

const ROWS_PER_PAGE = 10;

export default function UsersListPage({ roleId, roleName, onCreateClick }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Actif' | 'Bloqué'>('Tous');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users?role_id=${roleId}`);
        setUsers(data);
      } catch (error) {
        console.error('Erreur chargement utilisateurs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [roleId]);

  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.email.toLowerCase().includes(q) ||
        u.nom?.toLowerCase().includes(q) ||
        u.prenom?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'Tous') {
      result = result.filter(u =>
        statusFilter === 'Actif' ? u.is_active : !u.is_active
      );
    }
    return result;
  }, [users, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('Tous');
    setCurrentPage(1);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          Utilisateurs - {roleName}
        </h2>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#00738C] hover:bg-[#005f75] text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Créer un compte
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher par email, nom..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:border-[#97A675] focus:outline-none transition-all placeholder-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700"
        >
          <option value="Tous">Tous</option>
          <option value="Actif">Actif</option>
          <option value="Bloqué">Bloqué</option>
        </select>
        {(search || statusFilter !== 'Tous') && (
          <button onClick={resetFilters} className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl">
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-4">📭</span>
          <p className="text-sm font-medium">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F7F4] border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Nom complet</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Créé le</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(user => (
                <tr key={user.id_utilisateur} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-800">{user.email}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {user.nom} {user.prenom}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      user.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {user.is_active ? 'Actif' : 'Bloqué'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          rowsPerPage={ROWS_PER_PAGE}
        />
      )}
    </div>
  );
}