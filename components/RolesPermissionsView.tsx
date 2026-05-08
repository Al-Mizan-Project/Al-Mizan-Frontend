// components/RolesPermissionsView.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';

type SubTab = 'matrice' | 'affectation' | 'affectation-permissions';

interface User {
  id_utilisateur: number;
  id_role: number | null;
  email: string;
  created_at: string;
  updated_at: string;
}
interface Role {
  id_role: number;
  nom_role: string;
}
interface Permission {
  id_permission: number;
  nom_permission: string;
}

interface Props {
  defaultTab?: SubTab;
}

export default function RolesPermissionsView({ defaultTab }: Props) {
  const [activeTab, setActiveTab] = useState<SubTab>(defaultTab || 'matrice');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<number, number[]>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [userPerms, setUserPerms] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const [roleSearch, setRoleSearch] = useState('');
  const [roleFilterId, setRoleFilterId] = useState<number | ''>('');

  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [permSearch, setPermSearch] = useState('');
  const [permUserSearch, setPermUserSearch] = useState('');
  const [savingPerms, setSavingPerms] = useState(false);
  const [permSaved, setPermSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, permsRes, usersRes] = await Promise.all([
          api.get('/roles'),
          api.get('/permissions'),
          api.get('/users'),
        ]);
        setRoles(rolesRes.data);
        setPermissions(permsRes.data);
        setUsers(usersRes.data);

        const permsMap: Record<number, number[]> = {};
        for (const role of rolesRes.data as Role[]) {
          try {
            const { data } = await api.get(`/roles/${role.id_role}/permissions`);
            permsMap[role.id_role] = data.map((p: any) => p.id_permission);
          } catch {
            permsMap[role.id_role] = [];
          }
        }
        setRolePerms(permsMap);
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('Erreur de chargement. Vérifiez que le backend est accessible.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchUserPerms = async (userId: number) => {
    if (userPerms[userId] !== undefined) return;
    try {
      const { data } = await api.get(`/users/${userId}/permissions`);
      setUserPerms(prev => ({ ...prev, [userId]: data.map((p: any) => p.id_permission) }));
    } catch {
      setUserPerms(prev => ({ ...prev, [userId]: [] }));
    }
  };

  const handleSelectUserForPerms = (user: User) => {
    setSelectedUserForPerms(user);
    fetchUserPerms(user.id_utilisateur);
  };

  const updateRolePermissions = async (roleId: number, permIds: number[]) => {
    try {
      await api.put(`/roles/${roleId}/permissions`, { permission_ids: permIds });
      setRolePerms(prev => ({ ...prev, [roleId]: permIds }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Erreur lors de la mise à jour des permissions');
    }
  };

  const handleRoleChange = async (userId: number, newRoleId: number) => {
    try {
      await api.patch(`/users/${userId}/role`, { id_role: newRoleId });
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {
      alert('Erreur lors du changement de rôle');
    }
  };

  const handleSaveUserPerms = async () => {
    if (!selectedUserForPerms) return;
    setSavingPerms(true);
    try {
      await api.put(`/users/${selectedUserForPerms.id_utilisateur}/permissions`, {
        permission_ids: userPerms[selectedUserForPerms.id_utilisateur] || [],
      });
      setPermSaved(true);
      setTimeout(() => setPermSaved(false), 2000);
    } catch {
      alert('Erreur lors de la sauvegarde des permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const toggleUserPerm = (permId: number) => {
    if (!selectedUserForPerms) return;
    const uid = selectedUserForPerms.id_utilisateur;
    const current = userPerms[uid] || [];
    setUserPerms(prev => ({
      ...prev,
      [uid]: current.includes(permId) ? current.filter(p => p !== permId) : [...current, permId],
    }));
  };

  const getRoleName = (id_role: number | null) => {
    if (!id_role) return 'Sans rôle';
    return roles.find(r => r.id_role === id_role)?.nom_role || `Rôle #${id_role}`;
  };

  const filteredRoleUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = roleSearch ? u.email.toLowerCase().includes(roleSearch.toLowerCase()) : true;
      const matchRole = roleFilterId !== '' ? u.id_role === roleFilterId : true;
      return matchSearch && matchRole;
    });
  }, [users, roleSearch, roleFilterId]);

  const filteredPermUsers = useMemo(() => {
    if (!permUserSearch) return users;
    return users.filter(u => u.email.toLowerCase().includes(permUserSearch.toLowerCase()));
  }, [users, permUserSearch]);

  const filteredPerms = useMemo(() => {
    if (!permSearch) return permissions;
    return permissions.filter(p => p.nom_permission.toLowerCase().includes(permSearch.toLowerCase()));
  }, [permissions, permSearch]);

  if (loading) return <div className="p-6 text-gray-500">Chargement des rôles et permissions...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'matrice', label: 'Matrice des permissions' },
    { id: 'affectation', label: 'Affectation des rôles' },
    { id: 'affectation-permissions', label: 'Affectation des permissions' },
  ];

  return (
    <div className="flex flex-col gap-0">
      <div className="border-b border-gray-200 -mx-6 -mt-6 px-6 mb-6 flex items-center gap-0 bg-white">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedUserForPerms(null); }}
            className={`px-5 py-3.5 text-sm font-semibold transition-all ${activeTab === tab.id ? 'text-[#00738C] border-b-2 border-[#00738C]' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1 — Matrice */}
      {activeTab === 'matrice' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Permissions par rôle</h2>
            <div className="flex gap-2 items-center">
              {saved && <span className="text-xs text-emerald-600">Sauvegardé</span>}
              <button onClick={() => setEditMode(!editMode)} className="px-4 py-1.5 text-xs font-bold border border-gray-300 rounded-lg hover:border-[#00738C]">
                {editMode ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>

          {roles.length === 0 && <p className="text-sm text-gray-400">Aucun rôle trouvé.</p>}

          {roles.map(role => (
            <div key={role.id_role} className="bg-white border rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-2">{role.nom_role}</h3>
              {permissions.length === 0 ? (
                <p className="text-xs text-gray-400">Aucune permission disponible.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {permissions.map(perm => {
                    const isChecked = rolePerms[role.id_role]?.includes(perm.id_permission) || false;
                    return (
                      <label key={perm.id_permission} className="flex items-center gap-1 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!editMode}
                          onChange={e => {
                            const newPerms = e.target.checked
                              ? [...(rolePerms[role.id_role] || []), perm.id_permission]
                              : (rolePerms[role.id_role] || []).filter(id => id !== perm.id_permission);
                            setRolePerms(prev => ({ ...prev, [role.id_role]: newPerms }));
                            updateRolePermissions(role.id_role, newPerms);
                          }}
                        />
                        {perm.nom_permission}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2 — Affectation des rôles */}
      {activeTab === 'affectation' && (
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold mb-4">Changer le rôle d'un utilisateur</h3>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Rechercher par email…"
                value={roleSearch}
                onChange={e => setRoleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#00738C] focus:outline-none"
              />
            </div>
            <select
              value={roleFilterId}
              onChange={e => setRoleFilterId(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00738C]"
            >
              <option value="">Tous les rôles</option>
              {roles.map(r => (
                <option key={r.id_role} value={r.id_role}>{r.nom_role}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-400 mb-3">{filteredRoleUsers.length} utilisateur{filteredRoleUsers.length !== 1 ? 's' : ''}</p>

          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Rôle actuel</th>
                <th className="text-left p-2">Nouveau rôle</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoleUsers.map(user => {
                const currentRole = roles.find(r => r.id_role === user.id_role);
                return (
                  <tr key={user.id_utilisateur} className="border-b hover:bg-gray-50">
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {currentRole?.nom_role || 'Aucun'}
                      </span>
                    </td>
                    <td className="p-2">
                      <select
                        defaultValue={user.id_role || ''}
                        className="border rounded p-1 text-sm focus:outline-none focus:border-[#00738C]"
                        onChange={async e => {
                          const newRoleId = parseInt(e.target.value);
                          if (!isNaN(newRoleId)) await handleRoleChange(user.id_utilisateur, newRoleId);
                        }}
                      >
                        <option value="">-- Sélectionner --</option>
                        {roles.map(role => (
                          <option key={role.id_role} value={role.id_role}>{role.nom_role}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filteredRoleUsers.length === 0 && (
                <tr><td colSpan={3} className="p-4 text-center text-sm text-gray-400">Aucun utilisateur trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3 — Affectation des permissions — user list */}
      {activeTab === 'affectation-permissions' && !selectedUserForPerms && (
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold mb-4">Sélectionner un utilisateur</h3>
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Rechercher par email…"
              value={permUserSearch}
              onChange={e => setPermUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#00738C] focus:outline-none"
            />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Rôle</th>
                <th className="text-left p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermUsers.map(user => (
                <tr key={user.id_utilisateur} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium text-gray-800">{user.email}</td>
                  <td className="p-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {getRoleName(user.id_role)}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => handleSelectUserForPerms(user)}
                      className="text-[#00738C] hover:underline font-semibold text-xs"
                    >
                      Gérer →
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPermUsers.length === 0 && (
                <tr><td colSpan={3} className="p-4 text-center text-sm text-gray-400">Aucun utilisateur trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3 — Affectation des permissions — detail */}
      {activeTab === 'affectation-permissions' && selectedUserForPerms && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedUserForPerms(null)} className="text-gray-500 hover:text-gray-800 text-sm font-semibold">
              ← Retour
            </button>
            <div className="h-4 w-px bg-gray-300" />
            <h3 className="font-bold text-gray-800">{selectedUserForPerms.email}</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {getRoleName(selectedUserForPerms.id_role)}
            </span>
          </div>

          <p className="text-xs text-gray-500">Permissions supplémentaires accordées à cet utilisateur, indépendamment de son rôle.</p>

          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Rechercher une permission…"
                  value={permSearch}
                  onChange={e => setPermSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#00738C] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                {permSaved && <span className="text-xs text-emerald-600">Sauvegardé ✓</span>}
                <button
                  onClick={handleSaveUserPerms}
                  disabled={savingPerms}
                  className="px-4 py-2 bg-[#00738C] text-white text-xs font-bold rounded-lg disabled:opacity-50 hover:bg-[#005f75] transition-colors"
                >
                  {savingPerms ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            {filteredPerms.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune permission disponible.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredPerms.map(perm => {
                  const isChecked = (userPerms[selectedUserForPerms.id_utilisateur] || []).includes(perm.id_permission);
                  return (
                    <label
                      key={perm.id_permission}
                      className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition-colors ${isChecked ? 'bg-[#D6EAD4] border-[#00738C] text-[#1C4532]' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#00738C]'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleUserPerm(perm.id_permission)}
                        className="accent-[#00738C]"
                      />
                      {perm.nom_permission}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}