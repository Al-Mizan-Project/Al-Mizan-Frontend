'use client';

import { useRouter } from 'next/navigation';
import { fileRecord } from '../../types';

interface FilesTableProps {
  data: fileRecord[];
  status: 'En Attente' | 'En Cours' | 'En Retard' | 'Prêt';
  lang: string;
  dict?: any;
  onAffecter?: (dossier: fileRecord) => void;
  viewMode?: 'standard' | 'validateur';
}

export default function FilesTable({ 
  data, 
  status, 
  lang, 
  dict, 
  onAffecter,
  viewMode = 'standard'
}: FilesTableProps) {
  const router = useRouter();

  const t = (path: string, fallback: string) => {
    const keys = path.split('.');
    let value: any = dict;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return fallback;
      }
    }
    return value || fallback;
  };

  const getStatusLabel = (fileStatus: string) => {
    return t(`files.table.status.${fileStatus}`, fileStatus);
  };

const getActionButton = (fileStatus: string) => {
  const actionMap: Record<string, string> = {
    'En Attente': 'Affecter',
    'En Cours': 'Réaffecter',
    'En Retard': 'Réaffecter',
    'Prêt': 'Transmettre',
    'Soumis': 'Voir' // ← AJOUTER CECI
  };
  const actionKey = actionMap[fileStatus] || 'view';
  return t(`files.table.actions.${actionKey}`, actionKey);
};

  const isAr = lang === 'ar';

  // Calcul du nombre de colonnes pour le colspan de l'état vide
  const getColumnCount = () => {
    if (viewMode === 'validateur') {
      if (status === 'En Cours') return 5; // Dossier, Opérateur, Date d'affectation, Délai d'évaluation, Status
      if (status === 'En Retard') return 4; // Dossier, Opérateur, Jours de retard, Status
    }
    return 10; // Mode standard
  };

  return (
    <div className={`overflow-x-auto ${isAr ? 'rtl' : 'ltr'}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {/* COLONNE 1: Dossier (toujours affichée) */}
            <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
              {t('files.table.headers.file', 'Dossier')}
            </th>

            {/* COLONNE 2: Opérateur Économique (toujours affichée) */}
            <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
              {t('files.table.headers.economicOperator', 'Opérateur Économique')}
            </th>

            {/* MODE VALIDATEUR - DOSSIERS EN COURS */}
            {viewMode === 'validateur' && status === 'En Cours' && (
              <>
                <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                  {t('files.table.headers.assignmentDate', "Date d'affectation")}
                </th>
                <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                  {t('files.table.headers.validationDeadline', "Délai d'évaluation")}
                </th>
              </>
            )}

            {/* MODE VALIDATEUR - DOSSIERS EN RETARD */}
            {viewMode === 'validateur' && status === 'En Retard' && (
              <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                {t('files.table.headers.delayDays', 'Jours de retard')}
              </th>
            )}

            {/* MODE STANDARD - Colonnes supplémentaires */}
            {viewMode === 'standard' && (
              <>
                {status !== 'En Attente' && (
                  <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('files.table.headers.validator', 'Validateur')}
                  </th>
                )}
                {status === 'En Attente' && (
                  <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('files.table.headers.submissionDate', 'Date de soumission')}
                  </th>
                )}
                {status === 'En Cours' && (
                  <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('files.table.headers.assignmentDate', "Date d'affectation")}
                  </th>
                )}
                {status === 'En Retard' && (
                  <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('files.table.headers.delayDays', 'Jours de retard')}
                  </th>
                )}
                <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                  {t('files.table.headers.validationDeadline', 'Délai de validation')}
                </th>
                <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                  {t('files.table.headers.stage', 'Etape')}
                </th>
                <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                  {t('files.table.headers.actions', 'Action')}
                </th>
              </>
            )}

            {/* COLONNE STATUS (toujours affichée en dernier) */}
            <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
              {t('files.table.headers.status', 'Status')}
            </th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={getColumnCount()} className="py-8 px-4 text-center text-gray-500">
                {t('files.table.empty', 'Aucune donnée à afficher')}
              </td>
            </tr>
          ) : (
            data.map((file) => (
              <tr 
                key={file.id} 
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/${lang}/validation/dossier/${file.rawId || file.id.replace('ID-', '')}/${viewMode === 'validateur' ? 'validator' : 'commission'}`)}
              >
                {/* COLONNE 1: Dossier */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium text-sm">{file.reference}</div>
                      <div className="text-xs text-gray-500">
                        {t('files.table.headers.id', 'ID')}: {file.id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* COLONNE 2: Opérateur Économique */}
                <td className="py-3 px-4 text-sm">{file.economicOperator}</td>

                {/* MODE VALIDATEUR - DOSSIERS EN COURS */}
                {viewMode === 'validateur' && status === 'En Cours' && (
                  <>
                    <td className="py-3 px-4 text-sm">{file.assignmentDate}</td>
                    <td className="py-3 px-4 text-sm">{file.validationDeadline}</td>
                  </>
                )}

                {/* MODE VALIDATEUR - DOSSIERS EN RETARD */}
                {viewMode === 'validateur' && status === 'En Retard' && (
                  <td className="py-3 px-4 text-sm">{file.delayDays}j</td>
                )}

                {/* MODE STANDARD - Colonnes supplémentaires */}
                {viewMode === 'standard' && (
                  <>
                    {status !== 'En Attente' && file.validator && (
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">{file.validator.name}</div>
                        <div className="text-xs text-gray-500">{file.validator.id}</div>
                      </td>
                    )}
                    {status === 'En Attente' && file.submissionDate && (
                      <td className="py-3 px-4 text-sm">{file.submissionDate}</td>
                    )}
                    {status === 'En Cours' && file.assignmentDate && (
                      <td className="py-3 px-4 text-sm">{file.assignmentDate}</td>
                    )}
                    {status === 'En Retard' && (
                      <td className="py-3 px-4 text-sm">{file.delayDays}j</td>
                    )}
                    <td className="py-3 px-4 text-sm">{file.validationDeadline}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {file.etape}
                      </span>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onAffecter?.(file)}
                          className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                        >
                          {getActionButton(status)}
                        </button>
                        {status === 'Prêt' && (
                          <button 
                            onClick={() => router.push(`/${lang}/validation/dossier/${file.rawId || file.id.replace('ID-', '')}/commission`)}
                            className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            {t('files.table.actions.view', 'Voir')}
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}

                {/* COLONNE STATUS */}
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                    {getStatusLabel(file.status)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}