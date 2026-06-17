'use client';

import { useState, useMemo } from 'react';
import { useNotifications } from '@/lib/notifications';
import Pagination from '@/components/Pagination';
import CreateOperateurAccountView from '@/components/CreateOperateurAccountView';

// ─── Types mock pour les approbations ─────────────────────────────────────────
interface Approbation {
  id: string;
  operateurNom: string;
  numeroSerie: string;
  status: 'Approuvé' | 'Rejeté' | 'En attente';
  documents: { nom: string; url: string }[];
  dateSoumission: string;
}

// Données mock
const MOCK_APPROBATIONS: Approbation[] = [
  {
    id: 'APP-001',
    operateurNom: 'Société BTP Pro',
    numeroSerie: 'SN-2024-001',
    status: 'Approuvé',
    documents: [
      { nom: 'Registre de commerce', url: '#' },
      { nom: 'Statuts', url: '#' },
    ],
    dateSoumission: '2025-03-15',
  },
  {
    id: 'APP-002',
    operateurNom: 'Énergie Verte SARL',
    numeroSerie: 'SN-2024-002',
    status: 'En attente',
    documents: [
      { nom: 'Registre de commerce', url: '#' },
      { nom: 'Agrément', url: '#' },
    ],
    dateSoumission: '2025-04-01',
  },
  {
    id: 'APP-003',
    operateurNom: 'Informatique Solutions',
    numeroSerie: 'SN-2024-003',
    status: 'Rejeté',
    documents: [
      { nom: 'Registre de commerce', url: '#' },
    ],
    dateSoumission: '2025-02-10',
  },
];

const ROWS_PER_PAGE = 5;

// ─── Badge pour statut ────────────────────────────────────────────────────────
const STATUS_BADGE: Record<Approbation['status'], string> = {
  'Approuvé': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Rejeté':   'bg-red-50 text-red-700 border border-red-200',
  'En attente': 'bg-amber-50 text-amber-700 border border-amber-200',
};

// ─── Composant principal ──────────────────────────────────────────────────────
export default function OperateursView() {
  const [approbations] = useState<Approbation[]>(MOCK_APPROBATIONS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | Approbation['status']>('Tous');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApprobation, setSelectedApprobation] = useState<Approbation | null>(null);
  
  const notifContext = useNotifications();

  const addNotification = (notification: {
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    subtitle: string;
    description: string;
    dossierRef?: string;
  }) => {
    if (typeof (notifContext as any).notify === 'function') {
      (notifContext as any).notify(notification);
    } else if (typeof (notifContext as any).addNotification === 'function') {
      (notifContext as any).addNotification(notification);
    } else {
      console.warn('[Notification]', notification);
      alert(`${notification.title}: ${notification.subtitle} - ${notification.description}`);
    }
  };

  // Filtrage
  const filtered = useMemo(() => {
    let result = approbations;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.operateurNom.toLowerCase().includes(q) ||
        a.numeroSerie.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'Tous') {
      result = result.filter(a => a.status === statusFilter);
    }
    return result;
  }, [approbations, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const handleAccountCreated = (app: Approbation) => {
    addNotification({
      type: 'success',
      title: 'Compte créé',
      subtitle: `Opérateur ${app.operateurNom}`,
      description: `Le compte du responsable a été créé avec le rôle "Opérateur Économique".`,
      dossierRef: app.numeroSerie,
    });
    setSelectedApprobation(null);
  };

  const openCreateView = (app: Approbation) => {
    if (app.status !== 'Approuvé') {
      alert('Cette demande doit être approuvée avant de créer un compte.');
      return;
    }
    setSelectedApprobation(app);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('Tous');
    setCurrentPage(1);
  };

  // Si une approbation est sélectionnée, afficher la page de création de compte
  if (selectedApprobation) {
    return (
      <CreateOperateurAccountView
        operateur={selectedApprobation}
        onBack={() => setSelectedApprobation(null)}
        onSuccess={handleAccountCreated}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Demandes d'inscription</h2>
        <div className="text-sm text-gray-500">
          {filtered.length} demande{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom, numéro de série..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:border-[#97A675] focus:outline-none transition-all placeholder-gray-400"
            style={{ color: '#1C4532' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#97A675]"
        >
          <option value="Tous">Tous les statuts</option>
          <option value="Approuvé">Approuvé</option>
          <option value="Rejeté">Rejeté</option>
          <option value="En attente">En attente</option>
        </select>

        {(search || statusFilter !== 'Tous') && (
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-4">📭</span>
          <p className="text-sm font-medium">Aucune demande trouvée</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F7F4] border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Opérateur</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">N° Série</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date soumission</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Documents</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">{app.id}</td>
                  <td className="px-5 py-4 font-medium text-gray-800">{app.operateurNom}</td>
                  <td className="px-5 py-4 text-gray-600">{app.numeroSerie}</td>
                  <td className="px-5 py-4 text-gray-600">{new Date(app.dateSoumission).toLocaleDateString('fr-FR')}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[app.status]}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {app.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          className="text-xs text-[#00738C] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {doc.nom}
                        </a>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => openCreateView(app)}
                      disabled={app.status !== 'Approuvé'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        app.status === 'Approuvé'
                          ? 'bg-[#00738C] hover:bg-[#005f75] text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Créer compte
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          rowsPerPage={ROWS_PER_PAGE}
        />
      )}
    </div>
  );
}