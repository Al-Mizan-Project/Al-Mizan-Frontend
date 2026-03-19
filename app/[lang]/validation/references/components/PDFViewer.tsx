'use client';

import { useState } from 'react';

interface PDFViewerProps {
  pdfPath: string;
  tabName: string;
}

export default function PDFViewer({ pdfPath, tabName }: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <div className="val-pdf-viewer">
      {/* Toolbar */}
      <div className="val-pdf-toolbar">
        <div className="val-pdf-toolbar-left">
          <button className="val-pdf-toolbar-button" title="Previous" disabled>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="val-pdf-page-info">Page</span>
          <button className="val-pdf-toolbar-button" title="Next" disabled>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="val-pdf-toolbar-center">
          <button className="val-pdf-toolbar-button" title="Zoom Out" disabled>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="val-pdf-zoom">Zoom</span>
          <button className="val-pdf-toolbar-button" title="Zoom In" disabled>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="val-pdf-toolbar-right">
          <a
            href={pdfPath}
            download
            className="val-pdf-toolbar-button"
            title="Download"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        </div>
      </div>

      {/* PDF Container */}
      <div className="val-pdf-container">
        {error ? (
          <div className="val-pdf-error">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="text-gray-700 font-medium mb-2">Document non disponible</h4>
            <p className="text-gray-500 text-sm text-center mb-4">
              Le fichier PDF pour <strong>{tabName}</strong> n'a pas pu être chargé.
            </p>
            <p className="text-xs text-gray-400 bg-gray-100 px-3 py-2 rounded">
              Chemin : {pdfPath}
            </p>
          </div>
        ) : (
          <>
            <iframe
              key={tabName}
              src={`${pdfPath}#toolbar=0&navpanes=0&scrollbar=0`}
              className="val-pdf-iframe"
              title={`PDF ${tabName}`}
              onLoad={() => setLoading(false)}
              onError={() => {
                console.error(`❌ Erreur PDF: ${pdfPath}`);
                setError('Failed to load PDF');
                setLoading(false);
              }}
            />
            {loading && (
              <div className="val-pdf-loading">
                <div className="val-pdf-spinner"></div>
                <p className="text-gray-500 mt-3">Chargement...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}