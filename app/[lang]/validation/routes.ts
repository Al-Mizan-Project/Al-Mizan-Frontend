// app/validation/routes.ts

export const commissionRoutes = {
  dashboard: '/validation/dashboard/commission',
  dossierDetail: (id: string) => `/validation/dossier/${id}/commission`,
  affectation: '/validation/affectation',
  affectationDossiers: '/validation/AffectationDossiers',             
  tousLesDossiers: '/validation/ToutLesDossiers/commission',
  historique: '/validation/historique',
  references: '/validation/references/commission',
  profile: '/validation/Profile/commission',
  parametres: '/validation/Parametres/commission',
  notifications: '/validation/Notifications/commission',
};

export const validatorRoutes = {
  dashboard: '/validation/dashboard/validator',
  dossierDetail: (id: string) => `/validation/dossier/${id}/validator`,
  tousLesDossiers: '/validation/ToutLesDossiers/validator',
  references: '/validation/references/validator',
  profile: '/validation/Profile/validator',
  parametres: '/validation/Parametres/validator',
  notifications: '/validation/Notifications/validator',
};