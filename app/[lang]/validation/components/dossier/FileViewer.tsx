'use client';

import { useState } from 'react';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export function FileViewer() {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-900 text-white">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-800 rounded">
            <FileText className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-2 hover:bg-gray-800 rounded"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">Zoom</span>
            <button 
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-2 hover:bg-gray-800 rounded"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="p-2 hover:bg-gray-800 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium">Page {currentPage}</span>
          <button 
            onClick={() => setCurrentPage(currentPage + 1)}
            className="p-2 hover:bg-gray-800 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="p-8 bg-gray-100 min-h-[600px] flex items-center justify-center">
        <div 
          className="bg-white shadow-lg p-12"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
        >
          {/* Placeholder for PDF/Image */}
          <div className="w-[400px] h-[500px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4" />
              <p>Document Viewer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}