export interface DashboardStats{
    waiting: number;
    inprogress: number;
    delayed: number;
    ready: number;

}

export interface DelayData{
    period : string;
    count: number;
}

export interface EmployeeData {
    employee: string;
    evaluation: number;
    delayed: number;
    ready: number;
}

export interface fileRecord{
    id : string;
    reference: string;
    economicOperator:string;
    validator?:{
        name:string;
        id:string;
    };
    submissionDate?:string;
    assignmentDate?:string;
    validationDeadline:string;
    status:'En Attente'|'En Cours'|'En Retard'|'Prêt'|'Soumis';
    delayDays?:number;
    etape?: 'Evaluation Administrative' | 'Evaluation des Offres'; // ← AJOUTER CECI

}
export interface Validator {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  chargeActuelle: number;
  disponibilite: 'Recommandé' | 'Conflit' | 'Indisponible' |'Disponible';
}

export interface DossierInfo {
  operateurEconomique: string;
  operateur: string;
  delaisValidation: string;
  serviceContractant: string;
  domaine: string;
  etapeValidation: string;
}
