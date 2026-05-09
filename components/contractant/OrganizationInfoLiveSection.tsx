'use client';

import styles from './service-contractant.module.css';
import { useServiceContractant } from './ServiceContractantLiveContext';
import {
  Badge,
  CONTRACTANT_PERMISSION_OPTIONS,
  OrganisationTabs,
  SectionHeader,
  canManageMembers,
  cn,
  normalizePermissionName,
} from './ServiceContractantLiveShared';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value || '—'}</span>
    </div>
  );
}

export default function OrganizationInfoLiveSection() {
  const {
    currentPermissions,
    currentRole,
    member,
    organisation,
    tutelle,
  } = useServiceContractant();

  const showMembers = canManageMembers(currentPermissions);

  const permBadges = currentPermissions
    .filter((p) =>
      CONTRACTANT_PERMISSION_OPTIONS.some(
        (o) => normalizePermissionName(o.value) === normalizePermissionName(p.nom_permission)
      )
    )
    .map((p) => {
      const opt = CONTRACTANT_PERMISSION_OPTIONS.find(
        (o) => normalizePermissionName(o.value) === normalizePermissionName(p.nom_permission)
      );
      return { label: opt?.label ?? p.nom_permission, tone: 'info' as const };
    });

  const hasData = !!(member || organisation);

  return (
    <>
      <SectionHeader title="Organisation" description="Informations sur votre organisation et votre profil." />
      <OrganisationTabs active="info" showMembers={showMembers} />

      {!hasData && (
        <div className={styles.hintBox} style={{ marginBottom: 18 }}>
          <p>
            Aucune donnée de profil disponible. Assurez-vous que les seeds ont été exécutés
            (<code>seed_auth --flush</code> et <code>seed_acteurs --flush</code>), puis reconnectez-vous.
          </p>
        </div>
      )}

      <div className={cn(styles.grid, styles.split55)}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h4>Organisation</h4>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.infoList}>
              <InfoRow label="Nom officiel" value={organisation?.nom_officiel || '—'} />
              <InfoRow label="Adresse" value={organisation?.adresse_siege || '—'} />
              <InfoRow label="Email de contact" value={organisation?.email_contact || '—'} />
              {tutelle && <InfoRow label="Tutelle" value={tutelle.nom_tutelle} />}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h4>Mon profil</h4>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.infoList}>
              <InfoRow label="Prénom" value={member?.prenom || '—'} />
              <InfoRow label="Nom" value={member?.nom || '—'} />
              <InfoRow label="Fonction" value={member?.fonction || '—'} />
              <InfoRow label="Téléphone" value={member?.telephone || '—'} />
              <InfoRow label="Rôle" value={currentRole?.nom_role || '—'} />
            </div>

            {permBadges.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p className={styles.infoLabel} style={{ marginBottom: 8 }}>Permission</p>
                <div className={styles.badgesInline}>
                  {permBadges.map((badge, i) => (
                    <Badge key={i} badge={badge} small />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
