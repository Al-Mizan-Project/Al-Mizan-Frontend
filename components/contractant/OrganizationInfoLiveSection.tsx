'use client';

import styles from './service-contractant.module.css';
import { useServiceContractant } from './ServiceContractantLiveContext';
import {
  Badge,
  OrganisationTabs,
  ReadonlyField,
  SectionHeader,
  cn,
} from './ServiceContractantLiveShared';

export default function OrganizationInfoLiveSection() {
  const {
    currentPermissions,
    currentRole,
    currentUser,
    member,
    organisation,
    service,
    serviceResolutionWarning,
    tutelle,
  } = useServiceContractant();

  const organisationInfoFields = [
    { label: 'id_organisation', value: organisation ? String(organisation.id_organisation) : '—' },
    { label: 'nom_officiel', value: organisation?.nom_officiel || '—' },
    { label: 'adresse_siege', value: organisation?.adresse_siege || '—' },
    { label: 'email_contact', value: organisation?.email_contact || '—' },
    { label: 'type_entite', value: organisation?.type_entite || '—' },
  ];

  const serviceFields = [
    { label: 'id_tutelle', value: service?.id_tutelle != null ? String(service.id_tutelle) : '—' },
    { label: 'categorie', value: service?.categorie || '—' },
    { label: 'code_ordonnateur', value: service?.code_ordonnateur || '—' },
  ];

  const tutelleFields = [
    { label: 'id_tutelle', value: tutelle ? String(tutelle.id_tutelle) : '—' },
    { label: 'nom_tutelle', value: tutelle?.nom_tutelle || '—' },
    { label: 'identite_autorite', value: tutelle?.identite_autorite || '—', full: true },
  ];

  const memberFields = [
    { label: 'id_membre', value: member ? String(member.id_membre) : '—' },
    { label: 'id_utilisateur', value: currentUser ? String(currentUser.id_utilisateur) : '—' },
    { label: 'prenom', value: member?.prenom || '—' },
    { label: 'nom', value: member?.nom || '—' },
    { label: 'telephone', value: member?.telephone || '—' },
    { label: 'fonction', value: member?.fonction || '—' },
    { label: 'email', value: currentUser?.email || '—' },
    { label: 'is_active', value: currentUser ? String(currentUser.is_active) : '—' },
    { label: 'rôle', value: currentRole?.nom_role || '—' },
  ];

  const accessItems = [
    {
      badge: { label: 'rôle', tone: 'info' as const },
      title: currentRole?.nom_role || 'rôle inconnu',
      text: 'Rôle backend actuellement attribué à l’utilisateur connecté.',
    },
    {
      badge: { label: 'permissions', tone: 'gray' as const },
      title:
        currentPermissions.length > 0
          ? currentPermissions.map((item) => item.nom_permission).join(' · ')
          : 'Aucune permission chargée',
      text: 'Permissions backend réellement chargées depuis le service auth.',
    },
    {
      badge: {
        label: 'liaison',
        tone: serviceResolutionWarning ? ('warn' as const) : ('success' as const),
      },
      title: service ? `Service #${service.id_service}` : 'Service non résolu',
      text: serviceResolutionWarning || 'Le service contractant a été relié au contexte utilisateur.',
    },
  ];

  return (
    <>
      <SectionHeader title="Organisation" description="Vue de l’organisation et des profils." />
      <OrganisationTabs active="info" />

      <div className={cn(styles.grid, styles.split55)}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Organisation</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              {organisationInfoFields.map((field) => (
                <ReadonlyField key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.stack}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Service contractant</h4>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                {serviceFields.map((field) => (
                  <ReadonlyField key={field.label} label={field.label} value={field.value} />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Tutelle</h4>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                {tutelleFields.map((field) => (
                  <ReadonlyField key={field.label} label={field.label} value={field.value} full={field.full} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(styles.grid, styles.split55)} style={{ marginTop: 18 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Membre connecté</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              {memberFields.map((field) => (
                <ReadonlyField key={field.label} label={field.label} value={field.value} />
              ))}
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
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Accès</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.list}>
              {accessItems.map((item) => (
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
