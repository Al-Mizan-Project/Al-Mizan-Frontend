"use client";

import React, { useState, useMemo } from "react";
import DossiersFilters from "../../components/ToutLesDossiers/DossierFilters";
import FilesTable from "../dashboard/FilesTable";
import { useRouter } from 'next/navigation';
import { fileRecord, Validator } from "@/app/[lang]/validation/types";
import { useCommissionUserAttributions } from "../../dashboard/commission/useCommissionAttributions";

interface EnAttenteViewProps {
  lang: string;
  dict?: any;
}

function parseIsoDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatIsoDate(iso?: string | null): string {
  const date = parseIsoDate(iso);
  return date ? date.toISOString().split('T')[0] : '-';
}

function computeStatus(attribution: any): fileRecord['status'] {
  const statut = String(attribution.statut || '').toLowerCase();
  const hasValidator = attribution.validated_by !== null && attribution.validated_by !== undefined;

  if (statut === 'definitive' && hasValidator) {
    return 'Prêt';
  }

  const deadline = parseIsoDate(attribution.deadline_validation ?? null);
  if (deadline && deadline.getTime() < Date.now()) {
    return 'En Retard';
  }

  if (!hasValidator) {
    return 'En Attente';
  }

  const updatedAt = parseIsoDate(attribution.updated_at);
  if (updatedAt) {
    const createdAt = parseIsoDate(attribution.created_at);
    const ageDays = createdAt ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    return ageDays > 7 ? 'En Retard' : 'En Cours';
  }

  return 'En Cours';
}

function mapToFileRecord(attribution: any): fileRecord {
  const status = computeStatus(attribution);
  return {
    id: `ID-${attribution.soumission_id ?? attribution.id}`,
    rawId: attribution.soumission_id ?? undefined,
    reference: `Soumission ${attribution.soumission_id ?? attribution.appel_id ?? 'N/A'}`,
    economicOperator: attribution.soumission && typeof attribution.soumission === 'object'
      ? String(attribution.soumission.id_soumissionnaire ?? attribution.soumission_id ?? '')
      : (attribution.soumission_id ? String(attribution.soumission_id) : 'Inconnu'),
    submissionDate: formatIsoDate(attribution.created_at),
    assignmentDate: attribution.validated_by ? formatIsoDate(attribution.updated_at) : undefined,
    validationDeadline: attribution.deadline_validation ? formatIsoDate(attribution.deadline_validation) : '7 jours',
    status,
    etape: 'Validation',
  } as fileRecord;
}

export default function EnAttenteView({ lang, dict }: EnAttenteViewProps) {
  const [filters, setFilters] = useState<any>({ search: '' });
  const router = useRouter();

  const { backendResponse, isLoading, error, refresh } = useCommissionUserAttributions();

  // Map backendResponse to fileRecord and keep only En Attente
  const allDossiers = useMemo(() => {
    const atts = backendResponse ?? [];
    return atts.map(mapToFileRecord).filter(r => r.status === 'En Attente');
  }, [backendResponse]);

  const filteredData = useMemo(() => {
    const search = (filters?.search || '').trim().toLowerCase();
    return allDossiers.filter((item) => {
      if (search) {
        const matchRef = item.reference.toLowerCase().includes(search);
        const matchOp = String(item.economicOperator).toLowerCase().includes(search);
        const matchStatus = String(item.status || '').toLowerCase().includes(search);
        return matchRef || matchOp || matchStatus;
      }
      return true;
    });
  }, [filters, allDossiers]);

  const hasResults = filteredData.length > 0;

  const handleFiltersChange = (newFilters: any) => setFilters(newFilters);

  const handleExport = () => {
    const rows = filteredData;
    const headers = ['Dossier','ID','Opérateur économique','Étape','Date de soumission','Délai de validation','Statut'];
    const csv = [headers.join(','), ...rows.map(r => [r.reference, r.id, r.economicOperator, r.etape || '', r.submissionDate || '', r.validationDeadline || '', r.status].map(v => `"${v}"`).join(',')).join('\n')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `en-attente-export-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleActionNavigate = (dossier: fileRecord) => {
    const dossierId = dossier.rawId ?? dossier.id.replace('ID-', '');
    router.push(`/${lang}/validation/AffectationSoumission/${dossierId}`);
  };

  // We navigate to AffectationSoumission page on action; no inline assignment modal here

  return (
    <div>
      <DossiersFilters onFiltersChange={handleFiltersChange} hasResults={hasResults} onExport={handleExport} showValidatorFilter={false} showExportButton={true} />

      {isLoading ? (
        <div className="p-6 text-center text-gray-500">Chargement des données...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">
          <p className="font-medium">Erreur : {error}</p>
          <p className="text-sm text-gray-600">Impossible de récupérer les attributions.</p>
          <div className="mt-4">
            <button onClick={() => refresh()} className="px-3 py-2 bg-blue-600 text-white rounded">Réessayer</button>
          </div>
        </div>
      ) : hasResults && filteredData.length > 0 ? (
        <div className="val-table-wrapper">
          <FilesTable data={filteredData} status="En Attente" lang={lang} dict={dict} onAction={handleActionNavigate} />
        </div>
      ) : (
        <div className="val-empty-state">
          <div className="val-empty-icon"><svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16 8l2-2" /></svg></div>
          <h2 className="val-empty-title">Aucun résultat trouvé</h2>
          <p className="val-empty-text">Nous n'avons trouvé aucun dossier correspondant à votre recherche.</p>
          <button onClick={() => { setFilters({ search: '', status: '', periode: '' }); }} className="val-reset-button">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
