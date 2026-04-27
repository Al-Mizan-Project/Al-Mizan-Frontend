'use client';

import { useState } from 'react';

interface DocumentViewerProps {
  dict?: any;
  lang?: string;
  url?: string;
}

export default function DocumentViewer({ dict, lang, url }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const isAr = lang === 'ar';

  return (
    <div className="val-document-viewer" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toolbar */}
      <div className="val-document-viewer-toolbar">
        <div className="val-document-viewer-controls">
          <button className="val-document-viewer-zoom-btn">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <div className="val-document-viewer-zoom">
            <button 
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="val-document-viewer-zoom-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm font-medium">
              {dict?.dossier?.viewer?.zoom || 'Zoom'}
            </span>
            <button 
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="val-document-viewer-zoom-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="val-document-viewer-pagination">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="val-document-viewer-page-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isAr ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
          <span className="val-document-viewer-page-number">
            {dict?.dossier?.viewer?.page || 'Page'} {currentPage}
          </span>
          <button 
            onClick={() => setCurrentPage(currentPage + 1)}
            className="val-document-viewer-page-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isAr ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="val-document-viewer-area">
        <div 
          className="val-document-viewer-content"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
        >
          {url && url !== 'Non disponible' ? (
            <iframe 
              src={url} 
              className="w-full border-0" 
              style={{ height: '800px', backgroundColor: '#f3f4f6' }}
              title="Document PDF"
            />
          ) : (
            <div className="val-document-viewer-placeholder">
              <div className="text-center text-gray-400">
                <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">Aucun document disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}