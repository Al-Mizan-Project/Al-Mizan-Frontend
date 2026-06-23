'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/api/client';

interface DocumentViewerProps {
  dict?: any;
  lang?: string;
  url?: string;
}

export default function DocumentViewer({ dict, lang, url }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAr = lang === 'ar';

  useEffect(() => {
    if (!url || url === 'Non disponible' || url === 'Document non disponible') {
      setBlobUrl(null);
      return;
    }

    const docIdMatch = url.match(/documents\/(\d+)/);
    if (!docIdMatch) {
      setBlobUrl(url);
      return;
    }

    const docId = docIdMatch[1];
    const token = getAuthToken();
    const headers: Record<string, string> = { Accept: '*/*' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let isMounted = true;
    let objectUrl = '';

    setLoading(true);
    setError(null);

    fetch(`/api/proxy/documents?path=api/documents/${docId}/`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
        const contentType = res.headers.get('Content-Type') || 'application/pdf';
        const contentDisposition = res.headers.get('Content-Disposition') || '';
        return res.blob().then(blob => ({ blob, contentType, contentDisposition }));
      })
      .then(async ({ blob, contentType, contentDisposition }) => {
        if (!isMounted) return;
        
        let finalType = blob.type || contentType;
        const isTxt = contentDisposition.toLowerCase().includes('.txt') || finalType.includes('text');
        const isPdf = contentDisposition.toLowerCase().includes('.pdf') || finalType.includes('pdf');
        
        if (isTxt && !isPdf) {
          try {
            const text = await blob.text();
            
            // Foolproof check: if it's actually a PDF masquerading as octet-stream
            if (text.startsWith('%PDF-')) {
              const pdfBlob = new Blob([blob], { type: 'application/pdf' });
              objectUrl = URL.createObjectURL(pdfBlob);
              setBlobUrl(objectUrl);
              setLoading(false);
              return;
            }

            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            
            const textLines = doc.splitTextToSize(text, 180);
            
            let cursorY = 20;
            const pageHeight = doc.internal.pageSize.getHeight();
            
            for (let i = 0; i < textLines.length; i++) {
              if (cursorY > pageHeight - 20) {
                doc.addPage();
                cursorY = 20;
              }
              // jsPDF standard fonts don't support all unicode chars, replacing some common ones if they break
              doc.text(textLines[i], 15, cursorY);
              cursorY += 7; // line height
            }
            
            const pdfBlob = doc.output('blob');
            objectUrl = URL.createObjectURL(pdfBlob);
            setBlobUrl(objectUrl);
            setLoading(false);
            return;
          } catch (e) {
            console.error("Erreur de conversion PDF:", e);
            // Fallback en cas d'erreur
          }
        }
        
        if (isPdf) {
          finalType = 'application/pdf';
        } else if (finalType === 'application/octet-stream' || !finalType) {
          finalType = 'application/pdf'; // fallback par défaut
        }
        
        const typedBlob = new Blob([blob], { type: finalType });
        objectUrl = URL.createObjectURL(typedBlob);
        setBlobUrl(objectUrl);
        setLoading(false);
      })
      .catch(async (err) => {
        let useFallback = false;
        if (err.message?.includes('404')) {
          console.warn('Document non trouvé (404) : tentative de récupération du fallback base64...');
          try {
            const metaRes = await fetch(`/api/proxy/documents?path=documents/${docId}`, { headers });
            if (metaRes.ok) {
              const metaData = await metaRes.json();
              if (metaData.ia_verif_details && metaData.ia_verif_details.startsWith('data:application/pdf;base64,')) {
                if (isMounted) {
                  // Transform base64 back to Blob
                  const fetchRes = await fetch(metaData.ia_verif_details);
                  const fallbackBlob = await fetchRes.blob();
                  objectUrl = URL.createObjectURL(fallbackBlob);
                  setBlobUrl(objectUrl);
                  setLoading(false);
                  useFallback = true;
                }
              }
            }
          } catch (fallbackErr) {
            console.warn('Fallback error:', fallbackErr);
          }
        }
        
        if (!useFallback && err.message?.includes('404')) {
          console.warn('Document non trouvé (404) : le fichier physique n\'existe probablement pas dans le stockage (données de test).');
          if (isMounted) {
            const htmlContent = `
              <div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#666;background:#fff;flex-direction:column;">
                <h2>Document de test (Simulé)</h2>
                <p>Le fichier physique n'est pas présent sur le serveur (données de test).</p>
              </div>
            `;
            const dummyBlob = new Blob([htmlContent], { type: 'text/html' });
            objectUrl = URL.createObjectURL(dummyBlob);
            setBlobUrl(objectUrl);
            setLoading(false);
          }
        } else if (!useFallback) {
          console.error('Preview error:', err);
          if (isMounted) {
            setError('Impossible de charger l\'aperçu du document (fichier introuvable)');
            setLoading(false);
          }
        }
      });

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);

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
      </div>

      {/* Viewer Area */}
      <div className="val-document-viewer-area">
        <div 
          className="val-document-viewer-content"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[800px] bg-gray-50">
              <span className="text-gray-500">Chargement de l'aperçu...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[800px] bg-red-50">
              <span className="text-red-500">{error}</span>
            </div>
          ) : blobUrl ? (
            <iframe 
              src={blobUrl} 
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
                <p className="text-lg">Document non disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}