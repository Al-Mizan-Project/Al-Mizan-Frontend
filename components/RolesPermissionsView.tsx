// components/RolesPermissionsView.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

type SubTab = 'matrice' | 'affectation';

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

export default function RolesPermissionsView() {
  const [activeTab, setActiveTab] = useState<SubTab>('matrice');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<number, number[]>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);

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

  if (loading) return <div className="p-6 text-gray-500">Chargement des rôles et permissions...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="flex flex-col gap-0">
      <div className="border-b border-gray-200 -mx-6 -mt-6 px-6 mb-6 flex items-center gap-0 bg-white">
        <button
          onClick={() => setActiveTab('matrice')}
          className={`px-5 py-3.5 text-sm font-semibold transition-all ${activeTab === 'matrice' ? 'text-[#00738C]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Matrice des permissions
        </button>
        <button
          onClick={() => setActiveTab('affectation')}
          className={`px-5 py-3.5 text-sm font-semibold transition-all ${activeTab === 'affectation' ? 'text-[#00738C]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Affectation des rôles
        </button>
      </div>

      {activeTab === 'matrice' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Permissions par rôle</h2>
            <div className="flex gap-2 items-center">
              {saved && <span className="text-xs text-emerald-600">Sauvegardé</span>}
              <button
                onClick={() => setEditMode(!editMode)}
                className="px-4 py-1.5 text-xs font-bold border border-gray-300 rounded-lg hover:border-[#00738C]"
              >
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

      {activeTab === 'affectation' && (
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold mb-4">Changer le rôle d'un utilisateur</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Rôle actuel</th>
                <th className="text-left p-2">Nouveau rôle</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const currentRole = roles.find(r => r.id_role === user.id_role);
                return (
                  <tr key={user.id_utilisateur} className="border-b">
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">{currentRole?.nom_role || 'Aucun'}</td>
                    <td className="p-2">
                      <select
                        defaultValue={user.id_role || ''}
                        className="border rounded p-1"
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}