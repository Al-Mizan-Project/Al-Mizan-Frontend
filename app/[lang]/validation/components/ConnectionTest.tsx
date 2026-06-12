// src/components/ConnectionTest.tsx
'use client';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_CONTRATS_SERVICE_URL || 'http://localhost:8080';

export default function ConnectionTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    setStatus('loading');
    setMessage('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatus('success');
      setMessage(`✅ Connecté ! Test réussi (Mock)`);
      
    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setStatus('error');
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div style={{ 
      padding: '12px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      fontFamily: 'system-ui',
      maxWidth: '400px',
      margin: '20px auto'
    }}>
      <h4 style={{ margin: '0 0 12px 0' }}>🔗 Test Connexion API</h4>
      
      <button 
        onClick={testConnection} 
        disabled={status === 'loading'}
        style={{
          padding: '8px 16px',
          background: status === 'loading' ? '#999' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {status === 'loading' ? 'Test en cours...' : 'Tester la connexion'}
      </button>
      
      {message && (
        <p style={{ 
          margin: '12px 0 0 0', 
          padding: '8px', 
          background: status === 'success' ? '#d4edda' : status === 'error' ? '#f8d7da' : '#f8f9fa',
          color: status === 'success' ? '#155724' : status === 'error' ? '#721c24' : '#333',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {message}
        </p>
      )}
      
      <details style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
        <summary style={{ cursor: 'pointer' }}>🔧 Détails techniques</summary>
        <pre style={{ margin: '8px 0 0 0', background: '#f5f5f5', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
{`URL cible: ${API_URL}/contrats
Env: ${process.env.NODE_ENV}
NEXT_PUBLIC_CONTRATS_SERVICE_URL: ${process.env.NEXT_PUBLIC_CONTRATS_SERVICE_URL}`}
        </pre>
      </details>
    </div>
  );
}