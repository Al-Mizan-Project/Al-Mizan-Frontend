'use client';

import { useState, useMemo, useEffect } from 'react';
import DossiersFilters from '../../components/ToutLesDossiers/DossierFilters';
import FilesTable from '../dashboard/FilesTable';
import { Validator, fileRecord } from '@/app/[lang]/validation/types';
import { useAuth } from '@/contexts/AuthContext';
import { appelsApi } from '@/lib/api/appels';

interface ValidateursViewProps {
  lang: string;
  dict?: any;
}

export default function ValidateursView({ lang, dict }: ValidateursViewProps) {
  const { token, user } = useAuth();
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [activeTab, setActiveTab] = useState<'en-cours' | 'en-retard'>('en-cours');
  const [validators, setValidators] = useState<Validator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Nouveaux états pour les statistiques des validateurs
  const [validatorStats, setValidatorStats] = useState<Record<string, { enCours: number, enRetard: number }>>({});
  
  // État pour le formulaire d'ajout de membre
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberStep, setAddMemberStep] = useState<'user' | 'member'>('user');
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState(false);
  
  // Formulaire utilisateur
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom_role: 'VALIDATEUR_EXTERNE_CDC',
  });
  
  // Formulaire membre
  const [memberFormData, setMemberFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    fonction: '',
  });

  // Load all experts/validators on component mount
  useEffect(() => {
    async function loadExperts() {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Loading all members without filters from new endpoint:', { 
          id_membre: user?.id_membre, 
          role: user?.role,
          email: user?.email 
        });
        
        // Get ALL members without CDC/marche filters from the new endpoint
        let experts = await appelsApi.getAllMembers();
        console.log('Experts loaded from getAllMembers():', experts?.length || 0);
        
        // If no experts from the new endpoint, try the context-based approach as fallback
        if (!experts || experts.length === 0) {
          console.log('No experts found with new endpoint, trying context-based fallback');
          experts = await appelsApi.getExpertsForUserContext();
          console.log('Experts loaded from getExpertsForUserContext():', experts?.length || 0);
        }

        // Last resort fallback: try getting all experts
        if (!experts || experts.length === 0) {
          console.log('Still no experts, trying getAllExperts() as last resort');
          experts = await appelsApi.getAllExperts();
          console.log('Experts loaded from getAllExperts():', experts?.length || 0);
        }

        console.log('Total experts after all attempts:', experts?.length || 0);

        const mapped: Validator[] = (experts || [])
          .filter((m: any) => m.id_utilisateur != null)
          .map((m: any) => ({
          id: String(m.id_utilisateur || m.id_membre || m.id || m.user_id),
          utilisateurId: m.id_utilisateur ?? null,
          nom: m.nom || m.lastName || m.last_name || 'Inconnu',
          prenom: m.prenom || m.firstName || m.first_name || '',
          matricule: m.matricule || `EXP-${m.id || m.id_membre || ''}`,
          chargeActuelle: m.charge_actuelle || 0,
          disponibilite: (m.charge_actuelle || 0) > 3 ? 'Surchargé' : 'Disponible',
          role: m.role || '',
          fonction: m.fonction || ''
        }));

        setValidators(mapped);
        if (mapped.length === 0) {
          setError('Aucun validateur trouvé');
        } else {
          console.log(`Successfully loaded ${mapped.length} validators`);
        }
      } catch (err) {
        console.error('Erreur chargement experts:', err);
        setError(err instanceof Error ? err.message : 'Erreur chargement des validateurs');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      loadExperts();
    } else {
      setError('Vous devez être connecté');
      setIsLoading(false);
    }
  }, [token, user]);

  // Récupérer les stats (en cours / en retard) pour chaque validateur
  useEffect(() => {
    if (!token || validators.length === 0) return;

    const fetchStats = async () => {
      const statsMap: Record<string, { enCours: number, enRetard: number }> = {};

      await Promise.all(
        validators.map(async (v) => {
          let enCours = 0;
          let enRetard = 0;
          try {
            if (v.role === 'VALIDATEUR_EXTERNE_CDC' || v.role === 'VALIDATEUR_INTERNE_CDC') {
              const res = await fetch(`/api/proxy/appels?path=appels-offres&validated_by=${v.id}&statut=non_valide,provisoire`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) {
                const data = await res.json();
                const items = Array.isArray(data) ? data : (data.results || []);
                items.forEach((item: any) => {
                  const status = item.status || 'En Cours';
                  if (status === 'En Cours') enCours++;
                  if (status === 'En Retard') enRetard++;
                });
              }
            } else if (v.role === 'VALIDATEUR_EXTERNE_MARCHE' || v.role === 'VALIDATEUR_INTERNE_MARCHE') {
              const res = await fetch(`/api/proxy/contrats/validator-attributions?user_id=${v.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) {
                const data = await res.json();
                const items = data.attributions || (Array.isArray(data) ? data : (data.results || []));
                items.forEach((item: any) => {
                  const status = item.status || 'En Cours';
                  if (status === 'En Cours') enCours++;
                  if (status === 'En Retard') enRetard++;
                });
              }
            }
          } catch (e) {
            console.error(`Failed to fetch stats for validator ${v.id}`, e);
          }
          statsMap[v.id] = { enCours, enRetard };
        })
      );

      setValidatorStats(statsMap);
    };

    fetchStats();
  }, [validators, token]);

  // Handler pour créer un nouveau membre
  const handleCreateNewMember = async () => {
    if (addMemberStep === 'user') {
      // Validation du formulaire utilisateur
      if (!userFormData.email || !userFormData.password || !userFormData.confirmPassword) {
        setAddMemberError('Tous les champs sont requis');
        return;
      }
      if (userFormData.password !== userFormData.confirmPassword) {
        setAddMemberError('Les mots de passe ne correspondent pas');
        return;
      }
      if (userFormData.password.length < 6) {
        setAddMemberError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      
      setAddMemberError(null);
      setMemberFormData({ ...memberFormData, fonction: userFormData.nom_role });
      setAddMemberStep('member');
      return;
    }

    // Si on est à l'étape 2 (member)
    if (!memberFormData.nom || !memberFormData.prenom) {
      setAddMemberError('Le nom et prénom sont requis');
      return;
    }

    setIsSubmittingMember(true);
    setAddMemberError(null);
    
    try {
      // Single unified endpoint that creates member, user, discovers the current user's commission,
      // and associates the created member with that external commission.
      console.log('Creating member and user via unified endpoint:', { 
        email: userFormData.email,
        nom: memberFormData.nom,
        prenom: memberFormData.prenom,
        role_nom: userFormData.nom_role,
        fonction: memberFormData.fonction,
      });
      
      // The backend provides an endpoint `add-member-to-commission` in the contractant
      // service (see backend `contractant_service.urls`). Use the contractant proxy
      // with the `path` query param to forward to that route.
      const response = await fetch('/api/proxy/contractant?path=add-member-to-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          email: userFormData.email,
          password: userFormData.password,
          nom: memberFormData.nom,
          prenom: memberFormData.prenom,
          telephone: memberFormData.telephone || null,
          fonction: memberFormData.fonction,
          role_nom: userFormData.nom_role,
        }),
      });

      if (!response.ok) {
        // Try to parse JSON error, otherwise fall back to text (avoid throwing raw HTML)
        const contentType = response.headers.get('content-type') || '';
        let errBody: string | Record<string, any> = '';
        try {
          if (contentType.includes('application/json')) {
            errBody = await response.json();
          } else {
            errBody = await response.text();
          }
        } catch (parseErr) {
          errBody = String(parseErr);
        }

        console.error('Member/User creation response:', { status: response.status, body: errBody });
        const safeMessage = typeof errBody === 'string' ? errBody.substring(0, 200) : JSON.stringify(errBody).substring(0, 200);
        throw new Error(`Erreur création membre et utilisateur (${response.status}): ${safeMessage}`);
      }

      // Successful creation: try parsing JSON, but guard against non-JSON replies
      let data: any = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('Failed to parse JSON from creation response:', parseErr);
        throw new Error('Réponse invalide du serveur lors de la création (non JSON)');
      }
      const newMemberId = data.id_membre;
      const newUserId = data.id_utilisateur;
      
      if (!newMemberId || !newUserId) {
        throw new Error('ID membre ou utilisateur non retourné');
      }

      console.log('Member and user created successfully:', { 
        id_membre: newMemberId, 
        id_utilisateur: newUserId,
        name: `${memberFormData.nom} ${memberFormData.prenom}` 
      });

      // Succès
      setAddMemberSuccess(true);
      setTimeout(() => {
        setShowAddMemberModal(false);
        setAddMemberSuccess(false);
        setAddMemberStep('user');
        setUserFormData({ email: '', password: '', confirmPassword: '', nom_role: 'VALIDATEUR_EXTERNE_CDC' });
        setMemberFormData({ nom: '', prenom: '', telephone: '', fonction: '' });
        // Recharger la liste des validateurs
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Erreur création membre:', err);
      setAddMemberError(err instanceof Error ? err.message : 'Erreur lors de la création du membre');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleCloseAddMemberModal = () => {
    setShowAddMemberModal(false);
    setAddMemberStep('user');
    setAddMemberError(null);
    setAddMemberSuccess(false);
    setUserFormData({ email: '', password: '', confirmPassword: '', nom_role: 'VALIDATEUR_EXTERNE_CDC' });
    setMemberFormData({ nom: '', prenom: '', telephone: '', fonction: '' });
  };

  // Mock data for dossiers (these would come from API in production)
  const MOCK_VALIDATORS_FALLBACK: Validator[] = [
    {
      id: 'V-001',
      nom: 'Nom',
      prenom: 'Prénom',
      matricule: 'Matricule',
      chargeActuelle: 2,
      disponibilite: 'Indisponible',
    },
    {
      id: 'V-002',
      nom: 'Nom',
      prenom: 'Prénom',
      matricule: 'Matricule',
      chargeActuelle: 4,
      disponibilite: 'Indisponible',
    },
  ];

  const DOSSIERS_EN_COURS: fileRecord[] = [
    {
      id: 'REF-001',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-002',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-003',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-004',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-005',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-006',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-007',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-008',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation des Offres',
    },
    {
      id: 'REF-009',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-010',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      validationDeadline: '2026-02-31',
      status: 'En Cours',
      etape: 'Evaluation des Offres',
    },
  ];

  const DOSSIERS_EN_RETARD: fileRecord[] = [
    {
      id: 'REF-011',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      delayDays: 4,
      validationDeadline: '2026-02-31',
      status: 'En Retard',
      etape: 'Evaluation Administrative',
    },
    {
      id: 'REF-012',
      reference: 'Référence Dossier ID',
      validator: { id: 'V-001', name: 'Nom Prénom' },
      economicOperator: 'Opérateur',
      assignmentDate: '2026-02-01',
      delayDays: 4,
      validationDeadline: '2026-02-31',
      status: 'En Retard',
      etape: 'Evaluation des Offres',
    },
  ];

  const handleFiltersChange = (newFilters: any) => {
    setFilters({ search: newFilters.search, status: newFilters.status });
  };

  const handleValidatorClick = (validator: Validator) => {
    setSelectedValidator(validator);
    setActiveTab('en-cours');
  };

  const handleBackToList = () => {
    setSelectedValidator(null);
  };

  // Handlers pour Edit/Delete
  const [editingValidator, setEditingValidator] = useState<Validator | null>(null);
  const [deletingValidator, setDeletingValidator] = useState<Validator | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditValidator = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingValidator) return;
    setIsEditing(true);

    const formData = new FormData(e.currentTarget);
    const nom = formData.get('nom') as string;
    const prenom = formData.get('prenom') as string;

    try {
      const response = await fetch(`/api/proxy/auth?path=users/${editingValidator.utilisateurId}/member-update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ nom, prenom }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Erreur ${response.status}: ${errBody.substring(0, 200)}`);
      }

      setEditingValidator(null);
      window.location.reload();
    } catch (err) {
      console.error('Erreur modification membre:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de la modification du membre');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteValidator = async () => {
    if (!deletingValidator) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/proxy/auth?path=users/${deletingValidator.utilisateurId}/member-update`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Erreur ${response.status}: ${errBody.substring(0, 200)}`);
      }

      setDeletingValidator(null);
      window.location.reload();
    } catch (err) {
      console.error('Erreur suppression membre:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression du membre');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredValidators = useMemo(() => {
    const dataToFilter = validators.length > 0 ? validators : MOCK_VALIDATORS_FALLBACK;
    return dataToFilter.filter((v) => {
      const matchSearch = !filters.search || 
        `${v.nom} ${v.prenom}`.toLowerCase().includes(filters.search.toLowerCase());
      const matchStatus = !filters.status || 
        v.disponibilite.toLowerCase() === filters.status.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [filters, validators]);

  // Vue détaillée d'un validateur (disabled as per request, but kept component code if needed)
  if (selectedValidator) {
    const dossiersToDisplay = activeTab === 'en-cours' ? DOSSIERS_EN_COURS : DOSSIERS_EN_RETARD;
    const tableStatus = activeTab === 'en-cours' ? 'En Cours' : 'En Retard';

    return (
      <div className="space-y-6">
        {/* Bouton retour */}
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à la liste
        </button>

        {/* En-tête du validateur */}
        <div className="val-dossier-info">
          <div className="flex items-center justify-between gap-8">
            {/* Colonne 1 : Validateur */}
            <div className="flex items-center gap-3">
              <div className="val-user-icon">
                <svg className="val-icon-24 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="val-body-medium">
                  {selectedValidator.nom} {selectedValidator.prenom}
                </p>
                <p className="val-small">{selectedValidator.matricule}</p>
              </div>
            </div>

            {/* Colonne 2 : Dossiers */}
            <div className="flex gap-4">
              <div>
                <p className="val-dossier-info-label">Dossiers En cours d'évaluation</p>
                <p className="val-dossier-info-value">
                  {DOSSIERS_EN_COURS.length}
                </p>
              </div>

              <div>
                <p className="val-dossier-info-label">Dossiers en Retard d'évaluation</p>
                <p className="val-dossier-info-value">
                  {DOSSIERS_EN_RETARD.length}
                </p>
              </div>
            </div>

            {/* Colonne 3 : Disponibilité */}
            <div>
              <p className="val-dossier-info-label">Disponibilité</p>
              <span
                className={`val-badge ${
                  selectedValidator.disponibilite === 'Disponible' ||
                  selectedValidator.disponibilite === 'Recommandé'
                    ? 'val-badge-available'
                    : selectedValidator.disponibilite === 'Conflit'
                    ? 'val-badge-conflict'
                    : 'val-badge-unavailable'
                }`}
              >
                <span className="val-badge-text">
                  {selectedValidator.disponibilite}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="val-tabs-container">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('en-cours')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'en-cours'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dossiers en cours
            </button>
            <button
              onClick={() => setActiveTab('en-retard')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'en-retard'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dossiers en retard
            </button>
          </div>
        </div>

        {/* Tableau des dossiers */}
       <div className="val-table-wrapper">
          <FilesTable
            data={dossiersToDisplay}
            status={tableStatus}
            lang={lang}
            dict={dict}
            viewMode="validateur" 
          />
        </div>
      </div>
    );
  }

  // Vue liste des validateurs
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64 gap-4">
        <div className="animate-spin h-8 w-8 text-blue-600 border-4 border-t-transparent border-blue-600 rounded-full" />
        <p className="text-gray-500 font-medium">Chargement des validateurs...</p>
      </div>
    );
  }

  if (error && validators.length === 0) {
    return (
      <div className="p-8 text-center bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-yellow-700 font-medium mb-2">Attention</p>
        <p className="text-sm text-gray-600">{error}</p>
        <p className="text-xs text-gray-500 mt-2">Affichage des données de test</p>
      </div>
    );
  }

  return (
    <div>
      {/* Bouton Ajouter Membre - visible seulement pour RESP_CM */}
      {user?.role === 'RESP_CM' && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter Membre
          </button>
        </div>
      )}

      {/* Filtres adaptés pour Validateurs */}
      <DossiersFilters
        onFiltersChange={handleFiltersChange}
        hasResults={filteredValidators.length > 0}
        viewType="validateurs"
        showValidatorFilter={false}
        showExportButton={false}
      />

      {filteredValidators.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 font-medium">Aucun validateur trouvé</p>
          <p className="text-sm text-gray-400 mt-1">Vérifiez vos filtres de recherche</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section Responsable */}
          {(() => {
            const responsables = filteredValidators.filter(v => v.role === 'RESP_CM' || v.role === 'RESP_VALID_INTERN');
            if (responsables.length === 0) return null;
            return (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Responsable de la Commission</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {responsables.map((resp) => (
                    <div key={resp.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 shadow-sm">
                      <div className="val-user-icon bg-blue-100 text-blue-600 rounded-full p-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold">{resp.nom} {resp.prenom}</p>
                        <p className="text-sm text-gray-500">{resp.fonction || 'Responsable'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Section Validateurs CDC */}
          {(() => {
            const validateursCDC = filteredValidators.filter(v => v.role === 'VALIDATEUR_EXTERNE_CDC' || v.role === 'VALIDATEUR_INTERNE_CDC');
            if (validateursCDC.length === 0) return null;
            return (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Validateurs CDC</h3>
                <div className="val-table-container">
                  <table className="val-table">
                    <thead className="val-table-header">
                      <tr>
                        <th className="val-table-cell-left">Validateur ↓</th>
                        <th className="val-table-cell-left">Appels d'offres En Cours ↓</th>
                        <th className="val-table-cell-left">Appels d'offre En Retard ↓</th>
                        <th className="val-table-cell-left">Disponibilité</th>
                        {user?.role === 'RESP_CM' && <th className="val-table-cell-center">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="val-validator-body">
                      {validateursCDC.map((validator) => (
                        <tr key={validator.id} className="val-validator-row cursor-default">
                          <td className="val-table-cell-left">
                            <div className="flex items-center gap-2">
                              <div className="val-user-icon">
                                <svg className="val-icon-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <p className="val-body-medium">{validator.nom} {validator.prenom}</p>
                                <p className="val-small">{validator.fonction || validator.matricule}</p>
                              </div>
                            </div>
                          </td>
                          <td className="val-table-cell-left val-body">{validatorStats[validator.id]?.enCours || 0}</td>
                          <td className="val-table-cell-left val-body">{validatorStats[validator.id]?.enRetard || 0}</td>
                          <td className="val-table-cell-right val-validator-availability">
                            <span className={`val-badge ${
                              validator.disponibilite === 'Disponible' || validator.disponibilite === 'Recommandé'
                                ? 'val-badge-available'
                                : validator.disponibilite === 'Conflit'
                                ? 'val-badge-conflict'
                                : 'val-badge-unavailable'
                            }`}>
                              <span className="val-badge-text">{validator.disponibilite}</span>
                            </span>
                          </td>
                          {user?.role === 'RESP_CM' && (
                            <td className="val-table-cell-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* Edit button removed as requested */}
                                {editingValidator && editingValidator.id === validator.id && (
                                  <button
                                    onClick={() => setEditingValidator(null)}
                                    className="text-gray-600 hover:text-gray-800"
                                    title="Annuler l'édition"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeletingValidator(validator)}
                                  disabled={!validator.utilisateurId}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title={validator.utilisateurId ? 'Supprimer' : 'Aucun compte auth'}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Section Validateurs Marché */}
          {(() => {
            const validateursMarche = filteredValidators.filter(v => v.role === 'VALIDATEUR_EXTERNE_MARCHE' || v.role === 'VALIDATEUR_INTERNE_MARCHE');
            // Show this section if there are validators, or if it's the only section left (fallback for unmapped roles)
            const otherRoles = filteredValidators.filter(v => 
              !['RESP_CM', 'RESP_VALID_INTERN', 'VALIDATEUR_EXTERNE_CDC', 'VALIDATEUR_INTERNE_CDC', 'VALIDATEUR_EXTERNE_MARCHE', 'VALIDATEUR_INTERNE_MARCHE'].includes(v.role || '')
            );
            const allMarcheAndOthers = [...validateursMarche, ...otherRoles];
            
            if (allMarcheAndOthers.length === 0) return null;
            return (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Validateurs Marché</h3>
                <div className="val-table-container">
                  <table className="val-table">
                    <thead className="val-table-header">
                      <tr>
                        <th className="val-table-cell-left">Validateur ↓</th>
                        <th className="val-table-cell-left">Dossiers En Cours ↓</th>
                        <th className="val-table-cell-left">Dossiers En Retard ↓</th>
                        <th className="val-table-cell-left">Disponibilité</th>
                        {user?.role === 'RESP_CM' && <th className="val-table-cell-center w-24">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="val-validator-body">
                      {allMarcheAndOthers.map((validator) => (
                        <tr key={validator.id} className="val-validator-row cursor-default">
                          <td className="val-table-cell-left">
                            <div className="flex items-center gap-2">
                              <div className="val-user-icon">
                                <svg className="val-icon-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <p className="val-body-medium">{validator.nom} {validator.prenom}</p>
                                <p className="val-small">{validator.fonction || validator.matricule}</p>
                              </div>
                            </div>
                          </td>
                          <td className="val-table-cell-left val-body">{validatorStats[validator.id]?.enCours || 0}</td>
                          <td className="val-table-cell-left val-body">{validatorStats[validator.id]?.enRetard || 0}</td>
                          <td className="val-table-cell-right val-validator-availability">
                            <span className={`val-badge ${
                              validator.disponibilite === 'Disponible' || validator.disponibilite === 'Recommandé'
                                ? 'val-badge-available'
                                : validator.disponibilite === 'Conflit'
                                ? 'val-badge-conflict'
                                : 'val-badge-unavailable'
                            }`}>
                              <span className="val-badge-text">{validator.disponibilite}</span>
                            </span>
                          </td>
                          {user?.role === 'RESP_CM' && (
                            <td className="val-table-cell-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* Edit button removed as requested */}
                                  {editingValidator && editingValidator.id === validator.id && (
                                    <button
                                      onClick={() => setEditingValidator(null)}
                                      className="text-gray-600 hover:text-gray-800"
                                      title="Annuler l'édition"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  )}
                                <button
                                  onClick={() => setDeletingValidator(validator)}
                                  disabled={!validator.utilisateurId}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title={validator.utilisateurId ? 'Supprimer' : 'Aucun compte auth'}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
          {/* Pagination */}
          <div className="val-pagination-container">
            <button className="val-pagination-button" disabled>Previous</button>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, '...', 11].map((page, idx) => (
                <button
                  key={idx}
                  className={`val-pagination-button ${page === 2 ? 'val-pagination-button-active' : ''}`}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
            </div>
            <button className="val-pagination-button">Next</button>
          </div>
        </div>
      )}

      {/* Modal Ajouter Membre */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {addMemberStep === 'user' ? 'Créer Utilisateur' : 'Infos Membre'}
              </h2>
              <button
                onClick={handleCloseAddMemberModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Message de succès */}
            {addMemberSuccess && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg">
                <p className="text-green-700 font-medium">✓ Membre créé avec succès!</p>
                <p className="text-sm text-green-600 mt-1">Redirection en cours...</p>
              </div>
            )}

            {/* Message d'erreur */}
            {addMemberError && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg">
                <p className="text-red-700 font-medium">✗ Erreur</p>
                <p className="text-sm text-red-600 mt-1">{addMemberError}</p>
              </div>
            )}

            {/* Étape 1: Formulaire Utilisateur */}
            {addMemberStep === 'user' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateNewMember();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="exemple@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Au moins 6 caractères"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer mot de passe *</label>
                  <input
                    type="password"
                    value={userFormData.confirmPassword}
                    onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirmez le mot de passe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                  <select
                    value={userFormData.nom_role}
                    onChange={(e) => setUserFormData({ ...userFormData, nom_role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="VALIDATEUR_EXTERNE_CDC">Validateur externe CDC</option>
                    <option value="VALIDATEUR_EXTERNE_MARCHE">Validateur externe marché</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseAddMemberModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Suivant
                  </button>
                </div>
              </form>
            )}

            {/* Étape 2: Formulaire Membre */}
            {addMemberStep === 'member' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateNewMember();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={memberFormData.nom}
                    onChange={(e) => setMemberFormData({ ...memberFormData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom de famille"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={memberFormData.prenom}
                    onChange={(e) => setMemberFormData({ ...memberFormData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prénom"
                    required
                  />
                </div>

                {/* Champs 'Titre' et 'Spécialités' supprimés (non présents en base) */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (Optionnel)</label>
                  <input
                    type="tel"
                    value={memberFormData.telephone}
                    onChange={(e) => setMemberFormData({ ...memberFormData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+212 6 12 34 56 78"
                  />
                </div>

                {/* Fonction mise à jour automatiquement depuis le rôle sélectionné — champ non affiché */}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAddMemberStep('user');
                      setAddMemberError(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMember}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmittingMember ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Éditer Membre */}
      {editingValidator && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Modifier le Membre</h2>
            <form onSubmit={handleEditValidator} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input name="nom" type="text" defaultValue={editingValidator.nom} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input name="prenom" type="text" defaultValue={editingValidator.prenom} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingValidator(null)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
                <button type="submit" disabled={isEditing} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                  {isEditing ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Supprimer Membre */}
      {deletingValidator && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Supprimer le Membre</h2>
            <p className="text-gray-700 mb-6">Êtes-vous sûr de vouloir supprimer <strong>{deletingValidator.nom} {deletingValidator.prenom}</strong> ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeletingValidator(null)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
              <button type="button" onClick={handleDeleteValidator} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400">
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
