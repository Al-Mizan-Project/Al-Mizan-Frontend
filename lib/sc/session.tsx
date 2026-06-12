'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { normaliseRole, permissionsForRole, roleLabel, type SCRole, type Permission } from './permissions';
import { authedFetch } from './auth-tokens';

interface SCSession {
  ready: boolean;
  role: SCRole | null;
  roleRaw: string;
  membreId: string;
  orgId: string;
  serviceId: string;
  nom: string;
  prenom: string;
  email: string;
  displayName: string;
  initials: string;
  can: (p: Permission) => boolean;
  roleLabelText: (lang: string) => string;
}

const SessionContext = createContext<SCSession | undefined>(undefined);

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function readMemberInfo(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem('member_info') || '{}');
  } catch {
    return {};
  }
}

export function SCSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<SCSession, 'can' | 'roleLabelText'>>({
    ready: false,
    role: null,
    roleRaw: '',
    membreId: '',
    orgId: '',
    serviceId: '',
    nom: '',
    prenom: '',
    email: '',
    displayName: '',
    initials: 'U',
  });

  useEffect(() => {
    const token = window.localStorage.getItem('access_token') || '';
    const claims = decodeJwt(token);
    const info = readMemberInfo();
    const org = info.organisation || {};

    const roleRaw = String(info.role || claims.role || claims.role_name || '');
    const role = normaliseRole(roleRaw);
    const nom = info.nom || '';
    const prenom = info.prenom || '';
    const email = info.email || String(claims.email || '');
    const displayName = [prenom, nom].filter(Boolean).join(' ') || email || 'Utilisateur';
    const fallbackService = String(info.id_service || claims.service_id || org.id_organisation || '');

    const membreId = String(info.id_membre || window.localStorage.getItem('id_membre') || claims.id_membre || '');
    const base = {
      ready: true,
      role,
      roleRaw,
      membreId,
      orgId: String(org.id_organisation || claims.organisation_id || ''),
      serviceId: fallbackService,
      nom,
      prenom,
      email,
      displayName,
      initials: (prenom?.[0] || email?.[0] || 'U').toUpperCase(),
    };
    setState(base);

    // Resolve the authoritative numeric ServiceContractant.id_service and organisation details from the backend.
    (async () => {
      try {
        const [serviceRes, membreRes] = await Promise.all([
          authedFetch('/api/proxy/contractant?path=my-service', { headers: { Accept: 'application/json' } }),
          membreId
            ? authedFetch(`/api/proxy/acteurs?path=membres/${membreId}/`, { headers: { Accept: 'application/json' } })
            : Promise.resolve(null),
        ]);
        if (serviceRes.ok) {
          const data = await serviceRes.json();
          if (data?.id_service != null) {
            setState((s) => ({ ...s, serviceId: String(data.id_service) }));
          }
        }
        if (membreRes?.ok) {
          const data = await membreRes.json();
          const organisation = data?.organisation || {};
          setState((s) => ({
            ...s,
            orgId: s.orgId || String(organisation.id_organisation || ''),
            nom: s.nom || data?.nom || '',
            prenom: s.prenom || data?.prenom || '',
            displayName: s.displayName === 'Utilisateur'
              ? [data?.prenom, data?.nom].filter(Boolean).join(' ') || s.email || 'Utilisateur'
              : s.displayName,
          }));
        }
      } catch {
        /* keep fallback session */
      }
    })();
  }, []);

  const value = useMemo<SCSession>(() => {
    const perms = permissionsForRole(state.role);
    return {
      ...state,
      can: (p: Permission) => perms.has(p),
      roleLabelText: (lang: string) => roleLabel(state.role, lang),
    };
  }, [state]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSCSession(): SCSession {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSCSession must be used within SCSessionProvider');
  return ctx;
}
