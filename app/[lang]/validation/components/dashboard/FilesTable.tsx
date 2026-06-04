'use client';

import { useRouter } from 'next/navigation';
import { fileRecord } from '../../types';

interface FilesTableProps {
  data: fileRecord[];
  status: 'En Attente' | 'En Cours' | 'En Retard' | 'Prêt';
  lang: string;
  dict?: any;
  onAction?: (dossier: fileRecord) => void;
  onAffecter?: (dossier: fileRecord) => void;
  onView?: (dossier: fileRecord) => void;
  onRowClick?: (dossier: fileRecord) => void;
  viewMode?: 'standard' | 'validateur';
}

export default function FilesTable({ 
  data, 
  status, 
  lang, 
  dict, 
  onAction,
  onAffecter,
  onView,
  onRowClick,
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

  const actionHandler = onAction || onAffecter;

const getActionButton = (fileStatus: string) => {
  const actionMap: Record<string, string> = {
    'En Attente': 'Affecter',
    'En Cours': 'Réaffecter',
    'En Retard': 'Réaffecter',
    'Prêt': 'Transmettre',
  };
  const actionKey = actionMap[fileStatus] || 'Voir';
  return t(`files.table.actions.${actionKey}`, actionKey);
};

  const isAr = lang === 'ar';

  const getColumnCount = () => {
    switch (status) {
      case 'En Attente': return 6;
      case 'En Cours': return 7;
      case 'En Retard': return 6;
      case 'Prêt': return 5;
      default: return 6;
    }
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

              {/* COLONNE 3: Étape (toujours affichée) */}
              <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                {t('files.table.headers.etape', 'Étape')}
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
                {(status === 'En Attente' || status === 'En Cours') && (
                  <th className={`py-3 px-4 font-medium text-gray-700 ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('files.table.headers.validationDeadline', 'Délai de validation')}
                  </th>
                )}
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
                onClick={() => {
                  if (onRowClick) {
                    onRowClick(file);
                  } else {
                    router.push(`/${lang}/validation/dossier/${file.rawId || file.id.replace('ID-', '')}/${viewMode === 'validateur' ? 'validator' : 'commission'}`);
                  }
                }}
              >
                {/* COLONNE 1: Dossier (Soumission) */}
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

                {/* COLONNE 2: Soumissionaire */}
                <td className="py-3 px-4 text-sm">{file.economicOperator}</td>
                  {/* COLONNE 3: Étape (toujours Validation) */}
                  <td className="py-3 px-4 text-sm">Validation</td>

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
                    {(status === 'En Attente' || status === 'En Cours') && (
                      <td className="py-3 px-4 text-sm">{file.validationDeadline}</td>
                    )}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 flex-wrap">
                        {actionHandler && (
                          <>
                            <button
                              onClick={() => actionHandler(file)}
                              className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                            >
                              {getActionButton(file.status)}
                            </button>
                          </>
                        )}
                        {file.status === 'Prêt' && onView && (
                          <button
                            onClick={() => onView(file)}
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