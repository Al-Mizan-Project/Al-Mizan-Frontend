'use client';

import type { AuthPermission, AuthRole, Membre } from '@/lib/api/service-contractant';
import { serviceContractantApi } from '@/lib/api/service-contractant';
import styles from './service-contractant.module.css';
import { useServiceContractant } from './ServiceContractantLiveContext';
import { managedFields } from './service-contractant-data';
import {
  Badge,
  Field,
  OrganisationTabs,
  SectionHeader,
  ask,
  cn,
  notify,
  toBadgeFromStatus,
} from './ServiceContractantLiveShared';
import { useState } from 'react';

function MemberRow({
  record,
  roles,
  onSaved,
  onToggled,
  onDeleted,
}: {
  record: {
    member: Membre;
    userId: number | null;
    email: string;
    isActive: boolean | null;
    role: AuthRole | null;
    permissions: AuthPermission[];
  };
  roles: AuthRole[];
  onSaved: (payload: {
    memberId: number;
    userId: number | null;
    prenom: string;
    nom: string;
    fonction: string;
    roleId: number | null;
  }) => Promise<void>;
  onToggled: (userId: number, nextState: boolean) => Promise<void>;
  onDeleted: (payload: { memberId: number; userId: number | null }) => Promise<void>;
}) {
  const [prenom, setPrenom] = useState(record.member.prenom);
  const [nom, setNom] = useState(record.member.nom);
  const [fonction, setFonction] = useState(record.member.fonction);
  const [roleId, setRoleId] = useState<string>(record.role ? String(record.role.id_role) : '');

  return (
    <tr>
      <td>
        <strong>
          {record.member.prenom} {record.member.nom}
        </strong>
        <div className={styles.tableSub}>
          M-{record.member.id_membre} · {record.userId ? `USR-${record.userId}` : 'Sans compte'} · {record.email}
        </div>
      </td>
      <td>
        <Badge badge={toBadgeFromStatus(record.isActive ? 'actif' : 'inactif')} />
      </td>
      <td>{record.role?.nom_role || '—'}</td>
      <td>{record.permissions.map((permission) => permission.nom_permission).join(' · ') || '—'}</td>
      <td>
        <div className={styles.tableActions}>
          <details className={styles.actionMenu}>
            <summary className={cn(styles.btn, styles.btnGhost, styles.btnSm)}>Éditer</summary>
            <div className={styles.actionCard}>
              <Field label="prenom">
                <input value={prenom} onChange={(event) => setPrenom(event.target.value)} />
              </Field>
              <Field label="nom">
                <input value={nom} onChange={(event) => setNom(event.target.value)} />
              </Field>
              <Field label="fonction">
                <input value={fonction} onChange={(event) => setFonction(event.target.value)} />
              </Field>
              <Field label="id_role">
                <select value={roleId} onChange={(event) => setRoleId(event.target.value)}>
                  <option value="">—</option>
                  {roles.map((role) => (
                    <option key={role.id_role} value={role.id_role}>
                      {role.nom_role}
                    </option>
                  ))}
                </select>
              </Field>
              <div className={styles.field}>
                <label>permissions</label>
                <div className={styles.badgesInline}>
                  {record.permissions.length === 0 ? (
                    <Badge badge={{ label: 'aucune', tone: 'gray' }} small />
                  ) : (
                    record.permissions.map((permission) => (
                      <Badge
                        key={permission.id_permission}
                        badge={{ label: permission.nom_permission, tone: 'info' }}
                        small
                      />
                    ))
                  )}
                </div>
              </div>
              <div className={cn(styles.btnRow, styles.smallGap)}>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnPrimary, styles.btnSm)}
                  onClick={() =>
                    void onSaved({
                      memberId: record.member.id_membre,
                      userId: record.userId,
                      prenom,
                      nom,
                      fonction,
                      roleId: roleId ? Number(roleId) : null,
                    })
                  }
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </details>
          {record.userId ? (
            <button
              type="button"
              className={cn(styles.btn, styles.btnSoft, styles.btnSm)}
              onClick={() => void onToggled(record.userId!, !record.isActive)}
            >
              {record.isActive ? 'Désactiver' : 'Activer'}
            </button>
          ) : (
            <button type="button" className={cn(styles.btn, styles.btnSoft, styles.btnSm)} disabled>
              Activer
            </button>
          )}
          <button
            type="button"
            className={cn(styles.btn, styles.btnDanger, styles.btnSm)}
            onClick={() => void onDeleted({ memberId: record.member.id_membre, userId: record.userId })}
          >
            Supprimer
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function OrganizationMembersLiveSection() {
  const {
    currentPermissions,
    organisation,
    refreshContext,
    refreshMembers,
    roles,
    members,
  } = useServiceContractant();
  const [createForm, setCreateForm] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    fonction: '',
    email: '',
    password: '',
    roleId: '',
    isActive: 'true',
  });

  const tableRows = members.map((item) => ({
    member: item.member,
    userId: item.user?.id_utilisateur || null,
    email: item.user?.email || 'Sans compte',
    isActive: item.user?.is_active ?? null,
    role: item.role,
    permissions: item.permissions,
  }));

  const createMember = async () => {
    if (!organisation) {
      notify('Organisation non chargée.');
      return;
    }
    if (!createForm.roleId) {
      notify('Sélectionnez un rôle backend.');
      return;
    }

    try {
      const createdMember = await serviceContractantApi.createMembre({
        id_organisation: organisation.id_organisation,
        prenom: createForm.prenom,
        nom: createForm.nom,
        telephone: createForm.telephone,
        fonction: createForm.fonction,
      });

      try {
        await serviceContractantApi.createUser({
          id_role: Number(createForm.roleId),
          id_membre: createdMember.id_membre,
          email: createForm.email,
          password: createForm.password,
        });

        if (createForm.isActive === 'false') {
          const refreshedUsers = await serviceContractantApi.getUsers();
          const createdUser = refreshedUsers.find((user) => user.id_membre === createdMember.id_membre);
          if (createdUser) {
            await serviceContractantApi.updateUser(createdUser.id_utilisateur, { is_active: false });
          }
        }
      } catch (error) {
        await serviceContractantApi.deleteMembre(createdMember.id_membre).catch(() => null);
        throw error;
      }

      await refreshContext();
      setCreateForm({
        prenom: '',
        nom: '',
        telephone: '',
        fonction: '',
        email: '',
        password: '',
        roleId: '',
        isActive: 'true',
      });
      notify('Membre créé.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Création impossible.');
    }
  };

  const saveMember = async (payload: {
    memberId: number;
    userId: number | null;
    prenom: string;
    nom: string;
    fonction: string;
    roleId: number | null;
  }) => {
    try {
      await serviceContractantApi.updateMembre(payload.memberId, {
        prenom: payload.prenom,
        nom: payload.nom,
        fonction: payload.fonction,
      });
      if (payload.userId && payload.roleId) {
        await serviceContractantApi.updateUserRole(payload.userId, payload.roleId);
      }
      await refreshContext();
      notify('Membre mis à jour.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Mise à jour impossible.');
    }
  };

  const toggleMember = async (userId: number, nextState: boolean) => {
    try {
      await serviceContractantApi.updateUser(userId, { is_active: nextState });
      await refreshMembers();
      notify('Statut utilisateur mis à jour.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Mise à jour impossible.');
    }
  };

  const deleteMember = async (payload: { memberId: number; userId: number | null }) => {
    if (!ask('Supprimer ce membre et son compte associé ?')) {
      return;
    }

    try {
      if (payload.userId) {
        await serviceContractantApi.deleteUser(payload.userId);
      }
      await serviceContractantApi.deleteMembre(payload.memberId);
      await refreshContext();
      notify('Membre supprimé.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Suppression impossible.');
    }
  };

  return (
    <>
      <SectionHeader title="Organisation" description="Vue de l’organisation et des profils." />
      <OrganisationTabs active="membres" />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h4>Gestion membres</h4>
          </div>
          <div className={styles.btnRow} style={{ marginTop: 0 }}>
            <button
              type="button"
              className={cn(styles.btn, styles.btnPrimary)}
              onClick={() => notify('Utilisez le formulaire Nouveau membre en bas de page.')}
            >
              Créer un membre
            </button>
          </div>
        </div>
        <div className={styles.cardBodyCompact}>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Membre / utilisateur</th>
                  <th>Actif</th>
                  <th>Rôle</th>
                  <th>Permissions</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Aucun membre chargé.</td>
                  </tr>
                ) : (
                  tableRows.map((row) => (
                    <MemberRow
                      key={row.member.id_membre}
                      record={row}
                      roles={roles}
                      onSaved={saveMember}
                      onToggled={toggleMember}
                      onDeleted={deleteMember}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={cn(styles.grid, styles.split55)} style={{ marginTop: 18 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Nouveau membre</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <Field label="prenom">
                <input
                  value={createForm.prenom}
                  onChange={(event) => setCreateForm((current) => ({ ...current, prenom: event.target.value }))}
                />
              </Field>
              <Field label="nom">
                <input
                  value={createForm.nom}
                  onChange={(event) => setCreateForm((current) => ({ ...current, nom: event.target.value }))}
                />
              </Field>
              <Field label="telephone">
                <input
                  value={createForm.telephone}
                  onChange={(event) => setCreateForm((current) => ({ ...current, telephone: event.target.value }))}
                />
              </Field>
              <Field label="fonction">
                <input
                  value={createForm.fonction}
                  onChange={(event) => setCreateForm((current) => ({ ...current, fonction: event.target.value }))}
                />
              </Field>
              <Field label="email">
                <input
                  value={createForm.email}
                  onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                />
              </Field>
              <Field label="password">
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
                />
              </Field>
              <Field label="id_role">
                <select
                  value={createForm.roleId}
                  onChange={(event) => setCreateForm((current) => ({ ...current, roleId: event.target.value }))}
                >
                  <option value="">—</option>
                  {roles.map((role) => (
                    <option key={role.id_role} value={role.id_role}>
                      {role.nom_role}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="is_active">
                <select
                  value={createForm.isActive}
                  onChange={(event) => setCreateForm((current) => ({ ...current, isActive: event.target.value }))}
                >
                  <option>true</option>
                  <option>false</option>
                </select>
              </Field>
            </div>
            <div style={{ marginTop: 16 }}>
              <label className={styles.freeLabel} style={{ display: 'block', marginBottom: 8 }}>
                permissions
              </label>
              <div className={styles.badgesInline}>
                {currentPermissions.length === 0 ? (
                  <Badge badge={{ label: 'aucune', tone: 'gray' }} small />
                ) : (
                  currentPermissions.map((permission) => (
                    <Badge
                      key={permission.id_permission}
                      badge={{ label: permission.nom_permission, tone: 'info' }}
                      small
                    />
                  ))
                )}
              </div>
            </div>
            <div className={styles.btnRow} style={{ marginTop: 16 }}>
              <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void createMember()}>
                Créer le membre
              </button>
              <button
                type="button"
                className={cn(styles.btn, styles.btnGhost)}
                onClick={() =>
                  setCreateForm({
                    prenom: '',
                    nom: '',
                    telephone: '',
                    fonction: '',
                    email: '',
                    password: '',
                    roleId: '',
                    isActive: 'true',
                  })
                }
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Champs gérés</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.list}>
              {managedFields.map((item) => (
                <div key={item.title} className={styles.listItem}>
                  <Badge badge={item.badge} />
                  <div className={styles.grow}>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
