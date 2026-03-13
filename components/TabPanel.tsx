'use client';

import { useState } from 'react';
import DossierTable, { ActionConfig } from '@/components/DossierTable';
import Pagination from '@/components/Pagination';
import { Dossier } from '@/lib/dossiers-data';

const ROWS_PER_PAGE = 5;

interface TabPanelProps {
  data: Dossier[];
  actionConfig: ActionConfig;
  emptyLabel?: string;
}

export default function TabPanel({ data, actionConfig, emptyLabel }: TabPanelProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));

  // Reset to page 1 if data changes (handled by parent remounting or key)
  return (
    <div>
      <DossierTable
        data={data}
        actionConfig={actionConfig}
        currentPage={currentPage}
        rowsPerPage={ROWS_PER_PAGE}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
        totalItems={data.length}
        rowsPerPage={ROWS_PER_PAGE}
      />
    </div>
  );
}