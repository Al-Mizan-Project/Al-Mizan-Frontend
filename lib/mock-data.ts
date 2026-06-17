import { DemandeOE, Organisation, Membre } from './types';

export const mockDemandes: DemandeOE[] = [
  {
    id_demande: 1,
    nom_officiel: 'SNC Bâtisseurs',
    adresse_siege: '12 Rue Didouche Mourad, Alger',
    email_contact: 'contact@batisseurs.dz',
    type_entite: 'SARL',
    nif: '123456789',
    registre_commerce_num: 'RC/ALG/2021/001',
    casnos_vrt: 'CASNOS-001',
    cnas_vrt: 'CNAS-001',
    rib_bancaire: 'DZ58 0001 0001 0000001',
    statut: 'en_attente',
    documents: [
      { nom: 'Registre de commerce', url: '#' },
      { nom: 'Attestation CNAS', url: '#' },
    ],
  },
  {
    id_demande: 2,
    nom_officiel: 'EURL TechPro',
    adresse_siege: '5 Boulevard Krim Belkacem, Oran',
    email_contact: 'info@techpro.dz',
    type_entite: 'EURL',
    nif: '987654321',
    registre_commerce_num: 'RC/ORA/2022/045',
    casnos_vrt: 'CASNOS-002',
    cnas_vrt: 'CNAS-002',
    rib_bancaire: 'DZ58 0002 0002 0000002',
    statut: 'en_attente',
    documents: [
      { nom: 'Registre de commerce', url: '#' },
    ],
  },
];

export const mockOrganisations: Organisation[] = [];
export const mockMembres: Membre[] = [];