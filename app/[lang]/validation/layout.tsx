'use client';

import React, { ReactNode } from 'react';
import { ValidationAuthProvider } from './context/ValidationAuthContext';
import './validation.css';

export default function ValidationRootLayout({ children }: { children: ReactNode }) {
  return (
    <ValidationAuthProvider>
      {children}
    </ValidationAuthProvider>
  );
}
