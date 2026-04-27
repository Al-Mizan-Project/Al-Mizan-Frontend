'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faEdit,
  faTrash,
  faChevronRight,
  faCircle,
  faCheckCircle,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { authApi } from '@/lib/api/auth';
import { acteursApi } from '@/lib/api/acteurs';
import { validationsApi } from '@/lib/api/validation';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les modals/drawer
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [u, m, v] = await Promise.all([
          authApi.getUsers(),
          acteursApi.getMembres(),
          validationsApi.getValidations()
        ]);
        setUsers(u);
        setMembers(m);
        setValidations(v);
      } catch (err) {
        console.error("Erreur chargement users:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getWorkload = (userId: number) => {
    const userValidations = validations.filter(v => v.id_utilisateur === userId);
    return {
      enCours: userValidations.filter(v => !v.is_validated).length,
      valides: userValidations.filter(v => v.is_validated).length,
      enAttente: 0 // Logique à définir si besoin
    };
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">

        <button
          onClick={() => { setAddStep(1); setShowAddModal(true); }}
          className="flex items-center gap-2 bg-[#2D3748] text-white px-6 py-3 rounded-lg hover:bg-[#1a202c] transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <FontAwesomeIcon icon={faUserPlus} />
          <span>Ajouter un membre</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Membres de la Commission</h2>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 text-sm font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">Membre</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Charge de travail</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => {
              const workload = getWorkload(user.id_utilisateur);
              return (
                <tr
                  key={user.id_utilisateur}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  onClick={() => setSelectedMember(user)}
                >
                  <td className="px-6 py-5">
                    <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {user.nom || 'Expert'} {user.prenom || ''}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">{user.email}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-6 bg-green-500 rounded-full relative p-1 cursor-pointer">
                        <div className="absolute right-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        En cours: {workload.enCours}
                      </span>
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        Validés: {workload.valides}
                      </span>
                      <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        En attente: {workload.enAttente}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right space-x-3">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Ajouter un membre/utilisateur (Simplifié pour la structure) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  {addStep === 1 ? 'Ajouter un nouveau membre' : 'Créer le compte utilisateur'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>

              {addStep === 1 ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Prénom</label>
                    <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Entrez le prénom" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nom</label>
                    <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Entrez le nom" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Email professionnel</label>
                    <input type="email" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="jean.dupont@elmizan.dz" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Numéro de téléphone</label>
                    <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="+213..." />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Rôle</label>
                    <select className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234a5568%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] bg-[length:1.2em]">
                      <option>Commission Externe</option>
                      <option>Tutelle</option>
                      <option>Expert</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-xl text-blue-800 text-sm">
                    Définissez les accès pour le nouveau membre.
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
                      <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Responsable Commission</div>
                        <div className="text-xs text-gray-500">Accès complet à la gestion de la Commission</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
                      <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Valider Offre</div>
                        <div className="text-xs text-gray-500">Autorisation de valider les offres soumises</div>
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">Activer le compte dès la création</span>
                    <div className="w-12 h-6 bg-green-500 rounded-full relative p-1">
                      <div className="absolute right-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-100">
                <button onClick={() => setShowAddModal(false)} className="px-6 py-3 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition-all">Annuler</button>
                <button
                  onClick={() => addStep === 1 ? setAddStep(2) : setShowAddModal(false)}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  {addStep === 1 ? 'Suivant' : 'Confirmer l\'ajout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer de Détails du Membre */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">Détails du Membre</h3>
              <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="p-8 space-y-8">
              {/* Profil */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center space-y-4">
                <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-md">
                  {selectedMember.nom?.[0]}{selectedMember.prenom?.[0]}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{selectedMember.nom} {selectedMember.prenom}</h4>
                  <p className="text-sm text-gray-500 font-medium">Membre de la Commission Externe</p>
                  <p className="text-sm text-blue-600 mt-1">{selectedMember.email}</p>
                </div>
              </div>

              {/* Dossiers Assignés */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  Dossiers Assignés
                </h4>
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 border border-gray-100 rounded-xl flex items-center justify-between group hover:border-blue-200 transition-all">
                    <div>
                      <div className="font-bold text-gray-900">DOSSIER-2024-00{i}</div>
                      <div className="text-xs text-gray-500">Offre de Service {i === 1 ? 'A' : 'B'}</div>
                    </div>
                    <button className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                      Réassigner
                    </button>
                  </div>
                ))}
              </div>

              {/* Historique */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800">Historique des Validations</h4>
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1 w-4 h-4 bg-white border-2 border-green-500 rounded-full z-10" />
                    <div className="text-xs text-gray-400">24/07/2024 10:30</div>
                    <div className="text-sm font-semibold text-gray-800">Offre approuvée</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1 w-4 h-4 bg-white border-2 border-red-500 rounded-full z-10" />
                    <div className="text-xs text-gray-400">23/07/2024 14:15</div>
                    <div className="text-sm font-semibold text-gray-800">Offre rejetée</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
