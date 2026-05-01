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
  serviceResolutionWarning: string;
  refreshContext: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const ContractantContext = createContext<ContractantContextValue | undefined>(undefined);

function permissionFromClaims(claims: string[], catalog: AuthPermission[]) {
  return claims.map((name, index) => {
    const permission = catalog.find((item) => item.nom_permission === name);
    return (
      permission || {
        id_permission: -(index + 1),
        nom_permission: name,
      }
    );
  });
}

async function resolveService(
  services: ServiceContractant[],
  organisation: Organisation | null,
  member: Membre | null
) {
  if (services.length === 0) {
    return {
      service: null as ServiceContractant | null,
      warning: 'Aucun service contractant n\'est exposé par le backend.',
    };
  }

  if (organisation) {
    const directMatch = services.find((item) => item.id_service === organisation.id_organisation);
    if (directMatch) {
      return { service: directMatch, warning: '' };
    }
  }

  if (member) {
    const membershipChecks = await Promise.allSettled(
      services.map(async (service) => {
        const linkedMembers = await serviceContractantApi.getServiceContractantMembers(service.id_service);
        return {
          service,
          includesMember: linkedMembers.some((item) => item.id_membre === member.id_membre),
        };
      })
    );

    const membershipMatch = membershipChecks.find(
      (result) => result.status === 'fulfilled' && result.value.includesMember
    );

    if (membershipMatch && membershipMatch.status === 'fulfilled') {
      return {
        service: membershipMatch.value.service,
        warning:
          'La liaison organisation-service a été déduite via les membres de commission, car le backend ne relie pas directement ces entités.',
      };
    }
  }

  if (services.length === 1) {
    return {
      service: services[0],
      warning:
        'Le seul service contractant disponible a été utilisé, car le backend ne relie pas directement l\'organisation au service.',
    };
  }

  return {
    service: null as ServiceContractant | null,
    warning:
      'Impossible d\'identifier automatiquement le service contractant, car le backend ne relie pas directement l\'organisation au service.',
  };
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
  const [serviceResolutionWarning, setServiceResolutionWarning] = useState('');

  // ✅ Refs pour casser la chaîne de dépendances circulaires
  const rolesRef = useRef<AuthRole[]>([]);
  const currentUserRef = useRef<AuthUser | null>(null);
  const currentPermissionsRef = useRef<AuthPermission[]>([]);
  const organisationRef = useRef<Organisation | null>(null);

  // Synchroniser les refs avec le state
  useEffect(() => { rolesRef.current = roles; }, [roles]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { currentPermissionsRef.current = currentPermissions; }, [currentPermissions]);
  useEffect(() => { organisationRef.current = organisation; }, [organisation]);

  // ✅ loadMembers n'a plus aucune dépendance — utilise les refs
  const loadMembers = useCallback(
    async (
      organisationId: number | null,
      usersOverride?: AuthUser[],
      rolesOverride?: AuthRole[],
      currentUserOverride?: AuthUser | null,
      currentPermissionsOverride?: AuthPermission[]
    ) => {
      if (!organisationId) {
        setMembers([]);
        return;
      }

      const effectiveRoles = rolesOverride ?? rolesRef.current;
      const effectiveUser = currentUserOverride ?? currentUserRef.current;
      const effectivePermissions = currentPermissionsOverride ?? currentPermissionsRef.current;

      const [organisationMembers, allUsers, rolePermissionsEntries] = await Promise.all([
        serviceContractantApi.getOrganisationMembres(organisationId),
        usersOverride ? Promise.resolve(usersOverride) : serviceContractantApi.getUsers(),
        Promise.allSettled(
          effectiveRoles.map(async (role) => ({
            roleId: role.id_role,
            permissions: await serviceContractantApi.getRolePermissions(role.id_role),
          }))
        ),
      ]);

      const usersByMemberId = new Map(allUsers.map((user) => [user.id_membre, user]));
      const rolesById = new Map(effectiveRoles.map((role) => [role.id_role, role]));
      const rolePermissions = new Map<number, AuthPermission[]>();

      rolePermissionsEntries.forEach((entry) => {
        if (entry.status === 'fulfilled') {
          rolePermissions.set(entry.value.roleId, entry.value.permissions);
        }
      });

      const mergedMembers = organisationMembers.map((organisationMember) => {
        const linkedUser = usersByMemberId.get(organisationMember.id_membre) || null;
        const linkedRole = linkedUser ? rolesById.get(linkedUser.id_role) || null : null;
        const linkedPermissions =
          linkedUser && effectiveUser && linkedUser.id_utilisateur === effectiveUser.id_utilisateur
            ? effectivePermissions
            : linkedUser
              ? rolePermissions.get(linkedUser.id_role) || []
              : [];

        return {
          member: organisationMember,
          user: linkedUser,
          role: linkedRole,
          permissions: linkedPermissions,
        };
      });

      setMembers(mergedMembers);
    },
    [] // ✅ tableau vide — plus de dépendances qui changent
  );

  // ✅ refreshContext ne dépend plus que de loadMembers (qui est maintenant stable)
  const refreshContext = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const claims = serviceContractantApi.getJwtClaims();
      const userId = claims?.user_id || null;

      if (!userId) {
        throw new Error('Utilisateur non authentifié.');
      }

      const [loadedRoles, loadedPermissions, loadedUsers, loadedUser] = await Promise.all([
        serviceContractantApi.getRoles().catch(() => []),
        serviceContractantApi.getPermissions().catch(() => []),
        serviceContractantApi.getUsers().catch(() => []),
        serviceContractantApi.getUser(userId),
      ]);

      const role = loadedRoles.find((item) => item.id_role === loadedUser.id_role) || null;
      const resolvedPermissions = await serviceContractantApi
        .getUserPermissions(userId)
        .catch(() => permissionFromClaims(claims?.permissions || [], loadedPermissions));

      const linkedMember = loadedUser.id_membre
        ? await serviceContractantApi.getMembre(loadedUser.id_membre).catch(() => null)
        : null;
      const linkedOrganisation =
        linkedMember?.id_organisation != null
          ? await serviceContractantApi.getOrganisation(linkedMember.id_organisation).catch(() => null)
          : null;

      const services = await serviceContractantApi.getServicesContractants().catch(() => []);
      const resolvedService = await resolveService(services, linkedOrganisation, linkedMember);
      const linkedTutelle =
        resolvedService.service?.id_tutelle != null
          ? await serviceContractantApi.getTutelle(resolvedService.service.id_tutelle).catch(() => null)
          : null;

      setCurrentUser(loadedUser);
      setCurrentRole(role);
      setCurrentPermissions(resolvedPermissions);
      setRoles(loadedRoles);
      setPermissions(loadedPermissions);
      setMember(linkedMember);
      setOrganisation(linkedOrganisation);
      setService(resolvedService.service);
      setTutelle(linkedTutelle);
      setServiceResolutionWarning(resolvedService.warning);

      await loadMembers(
        linkedOrganisation?.id_organisation || null,
        loadedUsers,
        loadedRoles,
        loadedUser,
        resolvedPermissions
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger le contexte contractant.');
    } finally {
      setIsLoading(false);
    }
  }, [loadMembers]); // ✅ loadMembers est stable → refreshContext est stable → useEffect ne reboucle pas

  // ✅ refreshMembers utilise les refs, pas le state
  const refreshMembers = useCallback(async () => {
    await loadMembers(
      organisationRef.current?.id_organisation || null,
      undefined,
      rolesRef.current,
      currentUserRef.current,
      currentPermissionsRef.current
    );
  }, [loadMembers]); // ✅ stable

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]); // ✅ refreshContext est maintenant stable → s'exécute une seule fois

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
      serviceResolutionWarning,
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
      serviceResolutionWarning,
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