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

        // Map experts to Validator format
        const mapped: Validator[] = (experts || []).map(m => ({
          id: String(m.id_utilisateur || m.id_membre || m.id || m.user_id),
          nom: m.nom || m.lastName || m.last_name || 'Inconnu',
          prenom: m.prenom || m.firstName || m.first_name || '',
          matricule: m.matricule || `EXP-${m.id || m.id_membre || ''}`,
          chargeActuelle: m.charge_actuelle || 0,
          disponibilite: (m.charge_actuelle || 0) > 3 ? 'Surchargé' : 'Disponible',
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

  const handleEditValidator = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      // TODO: Call API to update validator details
      // await fetch(`/api/validators/${editingValidator?.id}`, { method: 'PUT', body: JSON.stringify(...) });
      console.log('Update validator:', editingValidator);
      // Mock success
      setTimeout(() => {
        setEditingValidator(null);
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteValidator = async () => {
    setIsDeleting(true);
    try {
      // TODO: Call API to delete validator
      // await fetch(`/api/validators/${deletingValidator?.id}`, { method: 'DELETE' });
      console.log('Delete validator:', deletingValidator?.id);
      // Mock success
      setTimeout(() => {
        setDeletingValidator(null);
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error(err);
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
        <>
          {/* Liste des validateurs en mode readOnly avec clic */}
          <div className="val-table-container">
            <table className="val-table">
              <thead className="val-table-header">
                <tr>
                  <th className="val-table-cell-left">Validateur ↓</th>
                  <th className="val-table-cell-left">Dossiers En Cours ↓</th>
                  <th className="val-table-cell-left">Dossiers En Retard ↓</th>
                  <th className="val-table-cell-left">Disponibilité</th>
              </tr>
            </thead>
            <tbody className="val-validator-body">
              {filteredValidators.map((validator) => (
                <tr 
                  key={validator.id} 
                  className="val-validator-row cursor-default"
                >
                <td className="val-table-cell-left">
                  <div className="flex items-center gap-2">
                    <div className="val-user-icon">
                      <svg className="val-icon-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="val-body-medium">
                        {validator.nom} {validator.prenom}
                      </p>
                      <p className="val-small">{validator.matricule}</p>
                    </div>
                  </div>
                </td>
                <td className="val-table-cell-left val-body">
                  {validator.chargeActuelle}
                </td>
                <td className="val-table-cell-left val-body">
                  {validator.chargeActuelle > 5 ? Math.floor(validator.chargeActuelle / 3) : 0}
                </td>
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
              </tr>
            ))}
          </tbody>
            </table>
          </div>

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
        </>
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
    </div>
  );
}
