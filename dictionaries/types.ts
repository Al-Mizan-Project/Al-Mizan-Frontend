// Types pour les dictionnaires de traduction

export type Locale = 'fr' | 'ar';

export interface DashboardDictionary {
  title: string;
  subtitle?: string;
  tabs: {
    overview: string;
    waiting: string;
    inProgress: string;
    delayed: string;
    ready: string;
  };
  stats: {
    waitingAssignment: string;
    inValidation: string;
    delayed: string;
    readyToTransmit: string;
  };
  charts: {
    delayByDuration: string;
    byEmployee: string;
    numberOfDelayed: string;
    inEvaluation: string;
    delayed: string;
    readyToTransmit: string;
  };
  navigation: {
    globalView: string;
    files: string;
    assignment: string;
    history: string;
    references: string;
  };
}

export interface CommonDictionary {
  title: string;
  subtitle?: string;
  button: string;
  search: string;
  noResults: string;
  resetFilters: string;
  actions: {
    view: string;
    assign: string;
    reassign: string;
    transmit: string;
    download: string;
  };
  status: {
    waiting: string;
    inProgress: string;
    delayed: string;
    ready: string;
    submitted: string;
  };
}
export interface FilesDictionary {
  table: {
    headers: {
      file: string;
      validator: string;
      economicOperator: string;
      submissionDate: string;
      assignmentDate: string;
      delayDays: string;
      validationDeadline: string;
      status: string;
      actions: string;
    };
    status: {
      waiting: string;
      'in-progress': string;
      delayed: string;
      ready: string;
    };
    actions: {
      assign: string;
      reassign: string;
      transmit: string;
      view: string;
    };
    pagination: {
      previous: string;
      next: string;
      page: string;
      of: string;
    };
  };
}

export interface Dictionary {
  common: CommonDictionary;
  dashboard: DashboardDictionary;
  files?: FilesDictionary;  // ← Ajout
  assignment?: Record<string, string>;
  history?: Record<string, string>;
  references?: Record<string, string>;
}