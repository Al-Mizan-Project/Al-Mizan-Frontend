'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../../../contexts/AuthContext';
import './validation.css';

export default function ValidationRootLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
