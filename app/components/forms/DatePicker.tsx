'use client';

import { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

type DatePickerProps = {
  label: string;
  error?: string;
  isArabic?: boolean;
  required?: boolean;
  helpText?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, isArabic = false, required = false, helpText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#173C3F] font-cairo">
          {label}
          {required && <span className="text-red-500 me-1">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            type="date"
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
          <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
            <FontAwesomeIcon icon={faCalendarDays} className="text-[#418387]" />
          </div>
        </div>
        {helpText && <p className="text-xs text-[#418387] font-cairo">{helpText}</p>}
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

DatePicker.displayName = 'DatePicker';