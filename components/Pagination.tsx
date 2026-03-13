'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  rowsPerPage: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  rowsPerPage,
}: PaginationProps) {
  if (totalPages <= 1 && totalItems <= rowsPerPage) return null;

  const from = Math.min((currentPage - 1) * rowsPerPage + 1, totalItems);
  const to   = Math.min(currentPage * rowsPerPage, totalItems);

  // Build page number array with ellipsis
  const getPages = (): (number | '...')[] => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
      pages.push(p);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-5 px-1">
      {/* Count */}
      <p className="text-xs text-gray-500">
        Affichage{' '}
        <span className="font-semibold text-[#1C4532]">{from}–{to}</span>
        {' '}sur{' '}
        <span className="font-semibold text-[#1C4532]">{totalItems}</span>
        {' '}dossiers
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed border-gray-200 text-gray-600 hover:border-[#00738C] hover:text-[#00738C] hover:bg-[#D6EAD4]"
        >
          ← Précédent
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-1">
          {getPages().map((page, i) =>
            page === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs select-none">
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  currentPage === page
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-[#D6EAD4] hover:text-[#1C4532]'
                }`}
                style={
                  currentPage === page
                    ? { background: 'linear-gradient(135deg, #1C4532, #00738C)' }
                    : {}
                }
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed border-gray-200 text-gray-600 hover:border-[#00738C] hover:text-[#00738C] hover:bg-[#D6EAD4]"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}