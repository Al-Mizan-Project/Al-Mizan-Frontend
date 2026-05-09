'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import type { AuthPermission } from '@/lib/api/service-contractant';
import styles from './service-contractant.module.css';
import {
  permissions as permissionFallbacks,
  type BadgeData,
  type BadgeTone,
} from './service-contractant-data';

export type PermissionMeta = {
  pages: string[];
  features: string[];
};

export const CONTRACTANT_PERMISSIONS = {
  responsable:    'responsable_service_contratant',
  redacteur:      'rédacteur_cdc',
  technique:      'évaluer_offre_technique',
  financier:      'évaluer_offre_financiére',
  administratif:  'évaluer_offre_administrative',
  validateur:     'valider_offre_intern',
} as const;

export const CONTRACTANT_PERMISSION_OPTIONS = [
  { value: CONTRACTANT_PERMISSIONS.responsable,   label: 'Responsable service contractant' },
  { value: CONTRACTANT_PERMISSIONS.redacteur,      label: 'Rédacteur CDC' },
  { value: CONTRACTANT_PERMISSIONS.technique,      label: 'Évaluation technique' },
  { value: CONTRACTANT_PERMISSIONS.financier,      label: 'Évaluation financière' },
  { value: CONTRACTANT_PERMISSIONS.administratif,  label: 'Évaluation administrative' },
  { value: CONTRACTANT_PERMISSIONS.validateur,     label: 'Validation interne' },
];

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function notify(message: string) {
  if (typeof window !== 'undefined') {
    window.alert(message);
  }
}

export function ask(message: string) {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.confirm(message);
}

export function promptValue(message: string, defaultValue = '') {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.prompt(message, defaultValue);
}

function getBadgeClass(tone: BadgeTone) {
  const toneClass: Record<BadgeTone, string> = {
    info: styles.badgeInfo,
    success: styles.badgeSuccess,
    warn: styles.badgeWarn,
    danger: styles.badgeDanger,
    gray: styles.badgeGray,
  };

  return toneClass[tone];
}

export function Badge({
  badge,
  small = false,
  compact = false,
}: {
  badge: BadgeData;
  small?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        styles.badge,
        getBadgeClass(badge.tone),
        small && styles.badgeSmall,
        compact && styles.dashboardBadge
      )}
    >
      {badge.label}
    </span>
  );
}

export function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn(styles.field, full && styles.fieldFull)}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export function ReadonlyField({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <Field label={label} full={full}>
      <div className={styles.readonly}>{value}</div>
    </Field>
  );
}

export function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.sectionHead}>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function OrganisationTabs({
  active,
  showMembers = true,
}: {
  active: 'info' | 'membres';
  showMembers?: boolean;
}) {
  const params = useParams<{ lang: string }>();
  const lang = String(params.lang ?? 'fr');

  return (
    <div className={styles.subtabs}>
      <Link
        href={`/${lang}/dashboard/contractant/organisation`}
        className={cn(styles.subtab, active === 'info' && styles.subtabActive)}
      >
        Informations
      </Link>
      {showMembers && (
        <Link
          href={`/${lang}/dashboard/contractant/organisation/membres`}
          className={cn(styles.subtab, active === 'membres' && styles.subtabActive)}
        >
          Gestion des membres
        </Link>
      )}
    </div>
  );
}

export function TokenEditor({
  tokens,
  options,
  emptyLabel,
  addLabel,
  selectLabel,
  onChange,
}: {
  tokens: string[];
  options: string[];
  emptyLabel: string;
  addLabel: string;
  selectLabel: string;
  onChange: (next: string[]) => void;
}) {
  const [selectedToken, setSelectedToken] = useState('');

  const handleAdd = () => {
    if (!selectedToken || tokens.includes(selectedToken)) {
      return;
    }
    onChange([...tokens, selectedToken]);
    setSelectedToken('');
  };

  return (
    <div className={styles.tokenBuilder}>
      <div className={styles.tokenList}>
        {tokens.length === 0 ? (
          <span className={styles.tokenEmpty}>{emptyLabel}</span>
        ) : (
          tokens.map((token) => (
            <span key={token} className={styles.tokenPill}>
              {token}
              <button
                type="button"
                aria-label="Retirer"
                onClick={() => onChange(tokens.filter((item) => item !== token))}
              >
                x
              </button>
            </span>
          ))
        )}
      </div>
      <div className={styles.tokenActions}>
        <button
          type="button"
          className={cn(styles.btn, styles.btnGhost, styles.btnSm)}
          onClick={handleAdd}
        >
          {addLabel}
        </button>
        <select
          className={styles.tokenSelect}
          value={selectedToken}
          onChange={(event) => setSelectedToken(event.target.value)}
        >
          <option value="">{selectLabel}</option>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('fr-DZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateInput(value: string | null | undefined) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function formatDateTimeInput(value: string | null | undefined) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function toIsoDateTime(value: string) {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}

export function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return '—';
  }
  return `${new Intl.NumberFormat('fr-DZ').format(amount)} DZD`;
}

export function formatFileSize(value: number | undefined) {
  if (!value || value <= 0) {
    return '—';
  }
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} Mo`;
  }
  if (value >= 1024) {
    return `${Math.round(value / 1024)} Ko`;
  }
  return `${value} o`;
}

export function toBadgeFromStatus(value: string | null | undefined): BadgeData {
  const normalized = String(value || '').toLowerCase();
  if (['publie', 'en_evaluation', 'en_examen', 'depose', 'en_instruction'].includes(normalized)) {
    return { label: value || '—', tone: 'info' };
  }
  if (['plis_ouverts', 'attribue', 'signe', 'accepte', 'conforme', 'valide', 'actif'].includes(normalized)) {
    return { label: value || '—', tone: 'success' };
  }
  if (['brouillon', 'pending', 'anomaly', 'pieces_manquantes', 'a revoir'].includes(normalized)) {
    return { label: value || '—', tone: 'warn' };
  }
  if (['annule', 'rejete', 'non_conforme', 'inactif', 'cloture'].includes(normalized)) {
    return { label: value || '—', tone: 'danger' };
  }
  return { label: value || '—', tone: 'gray' };
}

export function normalizePermissionName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

const permissionFallbackMap = new Map(
  permissionFallbacks.map((permission) => [
    normalizePermissionName(permission.name),
    { pages: permission.pages, features: permission.features } satisfies PermissionMeta,
  ])
);

export function hasContractantPermission(permissions: AuthPermission[], ...required: string[]) {
  const owned = new Set(permissions.map((permission) => normalizePermissionName(permission.nom_permission)));
  return required.some((permission) => owned.has(normalizePermissionName(permission)));
}

export function canManageMembers(permissions: AuthPermission[]) {
  return hasContractantPermission(permissions, CONTRACTANT_PERMISSIONS.responsable);
}

export function canUseMarches(permissions: AuthPermission[]) {
  return hasContractantPermission(
    permissions,
    CONTRACTANT_PERMISSIONS.responsable,
    CONTRACTANT_PERMISSIONS.redacteur,
    CONTRACTANT_PERMISSIONS.technique,
    CONTRACTANT_PERMISSIONS.financier,
    CONTRACTANT_PERMISSIONS.administratif,
    CONTRACTANT_PERMISSIONS.validateur
  );
}

export function permissionStorageKey(organisationId: string | null) {
  return `contractant.permission-meta.${organisationId || 'default'}`;
}

export function readPermissionMeta(organisationId: string | null) {
  if (typeof window === 'undefined') {
    return {} as Record<string, PermissionMeta>;
  }
  try {
    const raw = window.localStorage.getItem(permissionStorageKey(organisationId));
    return raw ? (JSON.parse(raw) as Record<string, PermissionMeta>) : {};
  } catch {
    return {};
  }
}

export function writePermissionMeta(organisationId: string | null, value: Record<string, PermissionMeta>) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(permissionStorageKey(organisationId), JSON.stringify(value));
}

export function getPermissionMeta(
  permission: AuthPermission,
  overrides: Record<string, PermissionMeta>
): PermissionMeta {
  const normalizedPermissionName = normalizePermissionName(permission.nom_permission);
  return (
    overrides[String(permission.id_permission)] ||
    overrides[permission.nom_permission] ||
    overrides[normalizedPermissionName] ||
    permissionFallbackMap.get(normalizedPermissionName) || {
      pages: [],
      features: [],
    }
  );
}

export function LoadingOrErrorBlock({
  isLoading,
  error,
}: {
  isLoading: boolean;
  error: string;
}) {
  if (!isLoading && !error) {
    return null;
  }

  return (
    <div className={styles.card} style={{ marginBottom: 18 }}>
      <div className={styles.cardBody}>
        <div className={styles.hintBox}>
          <h5>{isLoading ? 'Chargement en cours' : 'Chargement partiel'}</h5>
          <p>{isLoading ? 'Les données backend sont en cours de récupération.' : error}</p>
        </div>
      </div>
    </div>
  );
}
