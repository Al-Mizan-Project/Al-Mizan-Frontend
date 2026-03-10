import { Metadata } from 'next';
import ValidatorList from '../components/AffectationDossier/ValidatorList';
import { Validator, DossierInfo } from '../types';
import '../validation.css';



// Données de démonstration (à remplacer par des données réelles)
const dossierInfo: DossierInfo = {
  operateurEconomique: 'Opérateur économique',
  operateur: 'Opérateur',
  delaisValidation: '2026-02-31',
  serviceContractant: 'Service Contractant',
  domaine: 'Domaine',
  etapeValidation: 'Validation Externe',
};

const validators: Validator[] = [
  {
    id: '1',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 2,
    disponibilite: 'Recommandé',
  },
  {
    id: '2',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 4,
    disponibilite: 'Conflit',
  },
  {
    id: '3',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 7,
    disponibilite: 'Indisponible',
  },
  {
    id: '4',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 8,
    disponibilite: 'Indisponible',
  },
  {
    id: '5',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 12,
    disponibilite: 'Indisponible',
  },
  {
    id: '6',
    nom: 'Nom',
    prenom: 'Prénom',
    matricule: 'Matricule',
    chargeActuelle: 14,
    disponibilite: 'Indisponible',
  },
];

export default function AffectationDossierPage() {
  return (
    <div className="space-y-6">
        {/* Informations du dossier */}
<div className="val-dossier-info">
  <div className="val-dossier-info-grid">
    <div className="val-dossier-info-column">
      <div className="val-dossier-info-item">
        <p className="val-dossier-info-label">Dossier</p>
        <p className="val-dossier-info-value val-dossier-info-value-semibold">
          {dossierInfo.operateurEconomique}
        </p>
      </div>
      <div className="val-dossier-info-item">
        <p className="val-dossier-info-label">Opérateur économique</p>
        <p className="val-dossier-info-value">
          {dossierInfo.operateur}
        </p>
      </div>
      <div className="val-dossier-info-item">
        <p className="val-dossier-info-label">Délais de validateur</p>
        <p className="val-dossier-info-value">
          {dossierInfo.delaisValidation}
        </p>
      </div>
    </div>
    
    <div className="val-dossier-info-column">
      <div className="val-dossier-info-item">
        <p className="val-dossier-info-label">Service Contractant</p>
        <p className="val-dossier-info-value">
          {dossierInfo.serviceContractant}
        </p>
      </div>
      <div className="val-dossier-info-item">
        <p className="val-dossier-info-label">Domaine</p>
        <p className="val-dossier-info-value">
          {dossierInfo.domaine}
        </p>
      </div>
      <div className="val-dossier-info-item">
        <p className="val-dossier-info-label">Etape de validation</p>
        <p className="val-dossier-info-value">
          {dossierInfo.etapeValidation}
        </p>
      </div>
    </div>
  </div>
</div>

      {/* Liste des validateurs */}
<ValidatorList 
  validators={validators}/>
    </div>
  );
}