'use client';

import { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

type InputFieldProps = {
  label: string;
  error?: string;
  isArabic?: boolean;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, isArabic = false, required = false, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#173C3F] font-cairo">
          {label}
          {required && <span className="text-red-500 me-1">*</span>}
        </label>
        <input
          ref={ref}
          className={`w-full px-4 py-3 bg-[#F8FAFC] border-2 rounded-xl 
            focus:ring-2 focus:ring-[#306B6F] focus:border-[#306B6F] 
            outline-none transition-all font-cairo
            ${error 
              ? 'border-red-400 focus:ring-red-200 focus:border-red-400' 
              : 'border-[#E2E8F0] hover:border-[#9BCFCF]'
            }
            ${isArabic ? 'text-right' : 'text-left'}
            ${className}`}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
            <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';