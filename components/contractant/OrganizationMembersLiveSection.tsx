'use client';

import { useState } from 'react';
import type { AuthPermission, EntityId, Membre } from '@/lib/api/service-contractant';
import { serviceContractantApi } from '@/lib/api/service-contractant';
import styles from './service-contractant.module.css';
import { useServiceContractant } from './ServiceContractantLiveContext';
import {
  Badge,
  CONTRACTANT_PERMISSION_OPTIONS,
  Field,
  OrganisationTabs,
  SectionHeader,
  ask,
  canManageMembers,
  cn,
  notify,
  toBadgeFromStatus,
} from './ServiceContractantLiveShared';

type MemberRowData = {
  member: Membre;
  userId: number | null;
  email: string;
  isActive: boolean | null;
  permissions: AuthPermission[];
};

function permissionLabel(value: string) {
  return CONTRACTANT_PERMISSION_OPTIONS.find((item) => item.value === value)?.label || value;
}

function MemberRow({
  record,
  onSaved,
  onToggled,
  onDeleted,
}: {
  record: MemberRowData;
  onSaved: (payload: {
    memberId: EntityId;
    userId: number | null;
    prenom: string;
    nom: string;
    telephone: string;
    fonction: string;
    permission: string;
  }) => Promise<void>;
  onToggled: (userId: number, nextState: boolean) => Promise<void>;
  onDeleted: (payload: { memberId: EntityId; userId: number | null }) => Promise<void>;
}) {
  const [prenom, setPrenom] = useState(record.member.prenom);
  const [nom, setNom] = useState(record.member.nom);
  const [telephone, setTelephone] = useState(record.member.telephone);
  const [fonction, setFonction] = useState(record.member.fonction);
  const [permission, setPermission] = useState(record.permissions[0]?.nom_permission || '');

  return (
    <tr>
      <td>
        <strong>
          {record.member.prenom} {record.member.nom}
        </strong>
        <div className={styles.tableSub}>{record.member.fonction || '-'}</div>
      </td>
      <td>
        <span>{record.email}</span>
        <div className={styles.tableSub}>{record.member.telephone || '-'}</div>
      </td>
      <td>
        {record.permissions.length === 0 ? (
          <Badge badge={{ label: 'Aucune', tone: 'gray' }} small />
        ) : (
          record.permissions.map((item) => (
            <Badge
              key={`${record.member.id_membre}-${item.nom_permission}`}
              badge={{ label: permissionLabel(item.nom_permission), tone: 'info' }}
              small
            />
          ))
        )}
      </td>
      <td>
        <Badge badge={toBadgeFromStatus(record.isActive ? 'actif' : 'inactif')} />
      </td>
      <td>
        <div className={styles.tableActions}>
          <details className={styles.actionMenu}>
            <summary className={cn(styles.btn, styles.btnGhost, styles.btnSm)}>Modifier</summary>
            <div className={styles.actionCard}>
              <Field label="Prenom">
                <input value={prenom} onChange={(event) => setPrenom(event.target.value)} />
              </Field>
              <Field label="Nom">
                <input value={nom} onChange={(event) => setNom(event.target.value)} />
              </Field>
              <Field label="Telephone">
                <input value={telephone} onChange={(event) => setTelephone(event.target.value)} />
              </Field>
              <Field label="Fonction">
                <input value={fonction} onChange={(event) => setFonction(event.target.value)} />
              </Field>
              <Field label="Permission">
                <select value={permission} onChange={(event) => setPermission(event.target.value)}>
                  <option value="">Aucune</option>
                  {CONTRACTANT_PERMISSION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
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
                      telephone,
                      fonction,
                      permission,
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
              {record.isActive ? 'Desactiver' : 'Activer'}
            </button>
          ) : null}

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
  const { currentPermissions, refreshContext, refreshMembers, members } = useServiceContractant();
  const [createForm, setCreateForm] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    fonction: '',
    email: '',
    password: '',
    permission: CONTRACTANT_PERMISSION_OPTIONS[1]?.value || '',
  });

  const canAccess = canManageMembers(currentPermissions);
  const tableRows = members.map((item) => ({
    member: item.member,
    userId: item.user?.id_utilisateur || null,
    email: item.user?.email || '-',
    isActive: item.user?.is_active ?? null,
    permissions: item.permissions,
  }));

  const resetCreateForm = () => {
    setCreateForm({
      prenom: '',
      nom: '',
      telephone: '',
      fonction: '',
      email: '',
      password: '',
      permission: CONTRACTANT_PERMISSION_OPTIONS[1]?.value || '',
    });
  };

  const createMember = async () => {
    if (!createForm.permission) {
      notify('Selectionnez une permission.');
      return;
    }

    try {
      await serviceContractantApi.createCollaborateur({
        prenom: createForm.prenom,
        nom: createForm.nom,
        telephone: createForm.telephone,
        fonction: createForm.fonction,
        email: createForm.email,
        password: createForm.password,
        permissions: [createForm.permission],
      });
      await refreshContext();
      resetCreateForm();
      notify('Membre cree.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Creation impossible.');
    }
  };

  const saveMember = async (payload: {
    memberId: EntityId;
    userId: number | null;
    prenom: string;
    nom: string;
    telephone: string;
    fonction: string;
    permission: string;
  }) => {
    try {
      await serviceContractantApi.updateMembre(payload.memberId, {
        prenom: payload.prenom,
        nom: payload.nom,
        telephone: payload.telephone,
        fonction: payload.fonction,
      });
      if (payload.userId) {
        await serviceContractantApi.setUserPermissions(payload.userId, payload.permission ? [payload.permission] : []);
      }
      await refreshMembers();
      notify('Membre mis a jour.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Mise a jour impossible.');
    }
  };

  const toggleMember = async (userId: number, nextState: boolean) => {
    try {
      await serviceContractantApi.updateUser(userId, { is_active: nextState });
      await refreshMembers();
      notify('Statut mis a jour.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Mise a jour impossible.');
    }
  };

  const deleteMember = async (payload: { memberId: EntityId; userId: number | null }) => {
    if (!ask('Supprimer ce membre et son compte ?')) {
      return;
    }

    try {
      if (payload.userId) {
        await serviceContractantApi.deleteUser(payload.userId);
      }
      await serviceContractantApi.deleteMembre(payload.memberId);
      await refreshContext();
      notify('Membre supprime.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Suppression impossible.');
    }
  };

  if (!canAccess) {
    return (
      <>
        <SectionHeader title="Organisation" description="Informations du service et du profil connecte." />
        <OrganisationTabs active="info" showMembers={false} />
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.hintBox}>
              <h5>Acces reserve</h5>
              <p>La gestion des membres est reservee au responsable du service contractant.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Organisation" description="Gestion des collaborateurs du service." />
      <OrganisationTabs active="membres" showMembers />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h4>Membres</h4>
          </div>
        </div>
        <div className={styles.cardBodyCompact}>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Collaborateur</th>
                  <th>Contact</th>
                  <th>Permission</th>
                  <th>Statut</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Aucun membre charge.</td>
                  </tr>
                ) : (
                  tableRows.map((row) => (
                    <MemberRow
                      key={row.member.id_membre}
                      record={row}
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

      <div className={styles.card} style={{ marginTop: 18 }}>
        <div className={styles.cardHeader}>
          <div>
            <h4>Nouveau membre</h4>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.formGrid}>
            <Field label="Prenom">
              <input
                value={createForm.prenom}
                onChange={(event) => setCreateForm((current) => ({ ...current, prenom: event.target.value }))}
              />
            </Field>
            <Field label="Nom">
              <input
                value={createForm.nom}
                onChange={(event) => setCreateForm((current) => ({ ...current, nom: event.target.value }))}
              />
            </Field>
            <Field label="Telephone">
              <input
                value={createForm.telephone}
                onChange={(event) => setCreateForm((current) => ({ ...current, telephone: event.target.value }))}
              />
            </Field>
            <Field label="Fonction">
              <input
                value={createForm.fonction}
                onChange={(event) => setCreateForm((current) => ({ ...current, fonction: event.target.value }))}
              />
            </Field>
            <Field label="Email">
              <input
                value={createForm.email}
                onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
              />
            </Field>
            <Field label="Mot de passe">
              <input
                type="password"
                value={createForm.password}
                onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
              />
            </Field>
            <Field label="Permission" full>
              <select
                value={createForm.permission}
                onChange={(event) => setCreateForm((current) => ({ ...current, permission: event.target.value }))}
              >
                {CONTRACTANT_PERMISSION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className={styles.btnRow} style={{ marginTop: 16 }}>
            <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void createMember()}>
              Creer le membre
            </button>
            <button type="button" className={cn(styles.btn, styles.btnGhost)} onClick={resetCreateForm}>
              Reinitialiser
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
