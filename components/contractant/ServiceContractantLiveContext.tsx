'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type AuthPermission,
  type AuthRole,
  type AuthUser,
  type EntityId,
  type Membre,
  type Organisation,
  type ServiceContractant,
  type Tutelle,
  serviceContractantApi,
} from '@/lib/api/service-contractant';

export interface ContractantMemberRecord {
  member: Membre;
  user: AuthUser | null;
  role: AuthRole | null;
  permissions: AuthPermission[];
}

interface ContractantContextValue {
  isLoading: boolean;
  error: string;
  currentUser: AuthUser | null;
  currentRole: AuthRole | null;
  currentPermissions: AuthPermission[];
  roles: AuthRole[];
  permissions: AuthPermission[];
  organisation: Organisation | null;
  service: ServiceContractant | null;
  tutelle: Tutelle | null;
  member: Membre | null;
  members: ContractantMemberRecord[];
  refreshContext: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const ContractantContext = createContext<ContractantContextValue | undefined>(undefined);

function permissionsFromNames(names: string[]) {
  return names.map((name, index) => ({
    id_permission: -(index + 1),
    nom_permission: name,
  }));
}

function roleFromName(roleName: string | null | undefined, idRole: number | null | undefined) {
  if (!roleName && !idRole) {
    return null;
  }

  return {
    id_role: idRole || 0,
    nom_role: roleName || 'Partie contractante',
  };
}

function resolveOrganisation(member: Membre | null) {
  return member?.organisation || null;
}

async function resolveService(
  services: ServiceContractant[],
  organisation: Organisation | null
) {
  if (services.length === 0) {
    return null;
  }

  const code = organisation?.code_service || null;
  if (code) {
    const byCode = services.find((item) => item.code_ordonnateur === code);
    if (byCode) {
      return byCode;
    }
  }

  if (services.length === 1) {
    return services[0];
  }

  return services.find((item) => item.code_ordonnateur?.startsWith('SC-DEMO')) || services[0] || null;
}

export function ServiceContractantProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentRole, setCurrentRole] = useState<AuthRole | null>(null);
  const [currentPermissions, setCurrentPermissions] = useState<AuthPermission[]>([]);
  const [roles, setRoles] = useState<AuthRole[]>([]);
  const [permissions, setPermissions] = useState<AuthPermission[]>([]);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [service, setService] = useState<ServiceContractant | null>(null);
  const [tutelle, setTutelle] = useState<Tutelle | null>(null);
  const [member, setMember] = useState<Membre | null>(null);
  const [members, setMembers] = useState<ContractantMemberRecord[]>([]);

  const currentUserRef = useRef<AuthUser | null>(null);
  const organisationRef = useRef<Organisation | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    organisationRef.current = organisation;
  }, [organisation]);

  const loadMembers = useCallback(async (organisationId: EntityId | null) => {
    if (!organisationId) {
      setMembers([]);
      return;
    }

    const organisationMembers = await serviceContractantApi.getOrganisationMembres(organisationId);
    const records = organisationMembers.map((organisationMember) => {
      const account = organisationMember.compte_auth || null;
      const memberPermissions = permissionsFromNames(account?.permissions || []);
      const role = roleFromName(account?.role, account?.id_role);
      const user = account
        ? {
            id_utilisateur: account.id_utilisateur,
            id_role: account.id_role,
            id_membre: organisationMember.id_membre,
            email: account.email,
            is_active: account.is_active,
          }
        : null;

      return {
        member: organisationMember,
        user,
        role,
        permissions: memberPermissions,
      };
    });

    setMembers(records);
  }, []);

  const refreshContext = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const claims = serviceContractantApi.getJwtClaims();
      const userId = claims?.user_id || null;

      if (!userId) {
        throw new Error('Utilisateur non authentifie.');
      }

      const loadedUser = await serviceContractantApi.getUser(userId);
      const resolvedPermissions = await serviceContractantApi
        .getUserPermissions(userId)
        .catch(() => permissionsFromNames(claims?.permissions || []));

      const linkedMember = loadedUser.id_membre
        ? await serviceContractantApi.getMembre(loadedUser.id_membre).catch(() => null)
        : null;
      const linkedOrganisation = resolveOrganisation(linkedMember);
      const services = await serviceContractantApi.getServicesContractants().catch(() => []);
      const resolvedService = await resolveService(services, linkedOrganisation);
      const linkedTutelle =
        resolvedService?.id_tutelle != null
          ? await serviceContractantApi.getTutelle(resolvedService.id_tutelle).catch(() => null)
          : null;
      const role = roleFromName(claims?.role || loadedUser.id_role?.toString(), loadedUser.id_role);

      setCurrentUser(loadedUser);
      setCurrentRole(role);
      setCurrentPermissions(resolvedPermissions);
      setRoles(role ? [role] : []);
      setPermissions(resolvedPermissions);
      setMember(linkedMember);
      setOrganisation(linkedOrganisation);
      setService(resolvedService);
      setTutelle(linkedTutelle);

      await loadMembers(linkedOrganisation?.id_organisation || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger le contexte contractant.');
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadMembers]);

  const refreshMembers = useCallback(async () => {
    await loadMembers(organisationRef.current?.id_organisation || null);
  }, [loadMembers]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  const value = useMemo<ContractantContextValue>(
    () => ({
      isLoading,
      error,
      currentUser,
      currentRole,
      currentPermissions,
      roles,
      permissions,
      organisation,
      service,
      tutelle,
      member,
      members,
      refreshContext,
      refreshMembers,
    }),
    [
      currentPermissions,
      currentRole,
      currentUser,
      error,
      isLoading,
      member,
      members,
      organisation,
      permissions,
      refreshContext,
      refreshMembers,
      roles,
      service,
      tutelle,
    ]
  );

  return <ContractantContext.Provider value={value}>{children}</ContractantContext.Provider>;
}

export function useServiceContractant() {
  const context = useContext(ContractantContext);

  if (!context) {
    throw new Error('useServiceContractant must be used within ServiceContractantProvider');
  }

  return context;
}
