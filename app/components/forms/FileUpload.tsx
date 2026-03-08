'use client';

import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCloudArrowUp, 
  faFilePdf, 
  faCircleExclamation,
  faCircleCheck
} from '@fortawesome/free-solid-svg-icons';

type FileUploadProps = {
  label: string;
  helpText?: string;
  error?: string;
  isArabic?: boolean;
  accept?: string;
  maxSizeMB?: number;
  onChange?: (file: File | null) => void;
};

export default function FileUpload({
  label,
  helpText,
  error,
  isArabic = false,
  accept = '.pdf',
  maxSizeMB = 10,
  onChange,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      onChange?.(null);
      return;
    }

    // Check file type
    if (selectedFile.type !== 'application/pdf') {
      alert(isArabic ? 'يرجى اختيار ملف PDF فقط' : 'Please select PDF file only');
      return;
    }

    // Check file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      alert(isArabic ? `الحجم يجب أن يكون أقل من ${maxSizeMB}MB` : `File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    onChange?.(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#173C3F] font-cairo">
        {label}
      </label>
      
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-6 cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-[#306B6F] bg-[#FCFFFF]' 
            : error
            ? 'border-red-400 bg-red-50'
            : 'border-[#9BCFCF] bg-[#F8FAFC] hover:border-[#589C9F]'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-[#306B6F] rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faFilePdf} className="text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0D2527] truncate font-cairo">
                {file.name}
              </p>
              <p className="text-xs text-[#418387] font-cairo">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faCircleCheck} className="text-green-600" />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#9BCFCF] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faCloudArrowUp} className="text-[#173C3F] text-2xl" />
            </div>
            <p className="text-sm font-medium text-[#173C3F] mb-1 font-cairo">
              {isArabic ? 'اسحب الملف هنا أو انقر للاختيار' : 'Drag & drop file here or click to browse'}
            </p>
            {helpText && (
              <p className="text-xs text-[#418387] font-cairo">{helpText}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
          <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}