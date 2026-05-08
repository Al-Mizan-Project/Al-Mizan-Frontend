'use client';

import { useEffect, useMemo, useState } from 'react';
import { serviceContractantApi } from '@/lib/api/service-contractant';
import { useServiceContractant } from './ServiceContractantLiveContext';
import {
  ORGANISATION_FEATURE_OPTIONS,
  ORGANISATION_PAGE_OPTIONS,
} from './service-contractant-data';
import styles from './service-contractant.module.css';
import {
  Field,
  OrganisationTabs,
  ReadonlyField,
  SectionHeader,
  TokenEditor,
  ask,
  cn,
  getPermissionMeta,
  notify,
  readPermissionMeta,
  writePermissionMeta,
} from './ServiceContractantLiveShared';

export default function OrganizationPermissionsLiveSection() {
  const { organisation, permissions, refreshContext } = useServiceContractant();
  const [permissionMetaOverrides, setPermissionMetaOverrides] = useState<Record<string, { pages: string[]; features: string[] }>>({});
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPages, setEditPages] = useState<string[]>([]);
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [createName, setCreateName] = useState('nouvelle_permission');
  const [createPages, setCreatePages] = useState<string[]>([]);
  const [createFeatures, setCreateFeatures] = useState<string[]>([]);

  useEffect(() => {
    setPermissionMetaOverrides(readPermissionMeta(organisation?.id_organisation || null));
  }, [organisation]);

  useEffect(() => {
    if (selectedPermissionId && !permissions.some((permission) => permission.id_permission === selectedPermissionId)) {
      setSelectedPermissionId(permissions[0]?.id_permission || null);
      return;
    }
    if (!selectedPermissionId && permissions[0]) {
      setSelectedPermissionId(permissions[0].id_permission);
    }
  }, [permissions, selectedPermissionId]);

  const enrichedPermissions = useMemo(
    () =>
      permissions.map((permission) => ({
        permission,
        meta: getPermissionMeta(permission, permissionMetaOverrides),
      })),
    [permissionMetaOverrides, permissions]
  );

  const selectedPermission = enrichedPermissions.find(
    (item) => item.permission.id_permission === selectedPermissionId
  );

  useEffect(() => {
    if (!selectedPermission) {
      setEditName('');
      setEditPages([]);
      setEditFeatures([]);
      return;
    }
    setEditName(selectedPermission.permission.nom_permission);
    setEditPages(selectedPermission.meta.pages);
    setEditFeatures(selectedPermission.meta.features);
  }, [selectedPermission]);

  const persistOverrides = (next: Record<string, { pages: string[]; features: string[] }>) => {
    setPermissionMetaOverrides(next);
    writePermissionMeta(organisation?.id_organisation || null, next);
  };

  const saveEditedPermission = async () => {
    if (!selectedPermission) {
      notify('Sélectionnez une permission.');
      return;
    }

    try {
      await serviceContractantApi.updatePermission(selectedPermission.permission.id_permission, {
        nom_permission: editName,
      });

      const nextOverrides = {
        ...permissionMetaOverrides,
        [String(selectedPermission.permission.id_permission)]: {
          pages: editPages,
          features: editFeatures,
        },
      };
      persistOverrides(nextOverrides);
      await refreshContext();
      notify('Permission mise à jour.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Mise à jour impossible.');
    }
  };

  const deletePermission = async (permissionId: number) => {
    if (!ask('Supprimer cette permission ?')) {
      return;
    }

    try {
      await serviceContractantApi.deletePermission(permissionId);
      const nextOverrides = { ...permissionMetaOverrides };
      delete nextOverrides[String(permissionId)];
      persistOverrides(nextOverrides);
      await refreshContext();
      notify('Permission supprimée.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Suppression impossible.');
    }
  };

  const createPermission = async () => {
    try {
      const createdPermission = await serviceContractantApi.createPermission({
        nom_permission: createName,
      });

      const nextOverrides = {
        ...permissionMetaOverrides,
        [String(createdPermission.id_permission)]: {
          pages: createPages,
          features: createFeatures,
        },
      };
      persistOverrides(nextOverrides);
      await refreshContext();
      setCreateName('nouvelle_permission');
      setCreatePages([]);
      setCreateFeatures([]);
      notify('Permission créée.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Création impossible.');
    }
  };

  return (
    <>
      <SectionHeader title="Organisation" description="Vue de l’organisation et des profils." />
      <OrganisationTabs active="permissions" />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h4>Permissions</h4>
          </div>
          <div className={styles.btnRow} style={{ marginTop: 0 }}>
            <button
              type="button"
              className={cn(styles.btn, styles.btnPrimary)}
              onClick={() => notify('Le formulaire Créer une permission est disponible plus bas sur la page.')}
            >
              Créer une permission
            </button>
          </div>
        </div>
        <div className={styles.cardBodyCompact}>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Permission</th>
                  <th>Pages</th>
                  <th>Fonctionnalités</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrichedPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Aucune permission disponible.</td>
                  </tr>
                ) : (
                  enrichedPermissions.map((item) => (
                    <tr key={item.permission.id_permission}>
                      <td>
                        <strong>{item.permission.nom_permission}</strong>
                      </td>
                      <td>{item.meta.pages.join(' · ') || '—'}</td>
                      <td>{item.meta.features.join(' · ') || '—'}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <button
                            type="button"
                            className={cn(styles.btn, styles.btnGhost, styles.btnSm)}
                            onClick={() => setSelectedPermissionId(item.permission.id_permission)}
                          >
                            Éditer
                          </button>
                          <button
                            type="button"
                            className={cn(styles.btn, styles.btnDanger, styles.btnSm)}
                            onClick={() => void deletePermission(item.permission.id_permission)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
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
              <h4>Éditer une permission</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <ReadonlyField
                label="id_permission"
                value={selectedPermission ? String(selectedPermission.permission.id_permission) : '—'}
              />
              <Field label="nom_permission">
                <input value={editName} onChange={(event) => setEditName(event.target.value)} />
              </Field>
              <div className={cn(styles.field, styles.fieldFull)}>
                <label>pages accessibles</label>
                <TokenEditor
                  tokens={editPages}
                  options={ORGANISATION_PAGE_OPTIONS}
                  emptyLabel="Aucune page sélectionnée"
                  addLabel="+ Ajouter une page"
                  selectLabel="Choisir une page…"
                  onChange={setEditPages}
                />
              </div>
              <div className={cn(styles.field, styles.fieldFull)}>
                <label>fonctionnalités</label>
                <TokenEditor
                  tokens={editFeatures}
                  options={ORGANISATION_FEATURE_OPTIONS}
                  emptyLabel="Aucune fonctionnalité sélectionnée"
                  addLabel="+ Ajouter une fonctionnalité"
                  selectLabel="Choisir une fonctionnalité…"
                  onChange={setEditFeatures}
                />
              </div>
            </div>
            <div className={styles.btnRow} style={{ marginTop: 16 }}>
              <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void saveEditedPermission()}>
                Enregistrer
              </button>
              <button
                type="button"
                className={cn(styles.btn, styles.btnDanger)}
                onClick={() =>
                  selectedPermission
                    ? void deletePermission(selectedPermission.permission.id_permission)
                    : notify('Sélectionnez une permission.')
                }
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Créer une permission</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <Field label="nom_permission">
                <input value={createName} onChange={(event) => setCreateName(event.target.value)} />
              </Field>
              <div className={cn(styles.field, styles.fieldFull)}>
                <label>pages accessibles</label>
                <TokenEditor
                  tokens={createPages}
                  options={ORGANISATION_PAGE_OPTIONS}
                  emptyLabel="Aucune page sélectionnée"
                  addLabel="+ Ajouter une page"
                  selectLabel="Choisir une page…"
                  onChange={setCreatePages}
                />
              </div>
              <div className={cn(styles.field, styles.fieldFull)}>
                <label>fonctionnalités</label>
                <TokenEditor
                  tokens={createFeatures}
                  options={ORGANISATION_FEATURE_OPTIONS}
                  emptyLabel="Aucune fonctionnalité sélectionnée"
                  addLabel="+ Ajouter une fonctionnalité"
                  selectLabel="Choisir une fonctionnalité…"
                  onChange={setCreateFeatures}
                />
              </div>
            </div>
            <div className={styles.btnRow} style={{ marginTop: 16 }}>
              <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={() => void createPermission()}>
                Créer
              </button>
              <button
                type="button"
                className={cn(styles.btn, styles.btnGhost)}
                onClick={() => {
                  setCreateName('nouvelle_permission');
                  setCreatePages([]);
                  setCreateFeatures([]);
                }}
              >
                Annuler
              </button>
            </div>
            <div className={styles.footerNote}>
              Les champs pages et fonctionnalités sont conservés côté frontend tant que le backend auth ne les modélise pas encore.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
