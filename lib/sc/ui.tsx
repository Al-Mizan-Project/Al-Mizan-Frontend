'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

// Shared UI for the Service Contractant area. Provides toasts and a styled confirm dialog so the
// codebase never uses native alert/confirm/prompt, plus small presentational primitives that
// match the admin design system.

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'error';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  info: 'bg-[#D6EAD4] text-[#1C4532]',
  warning: 'bg-amber-100 text-amber-800',
  success: 'bg-emerald-100 text-emerald-800',
  danger: 'bg-red-100 text-red-700',
  error: 'bg-red-100 text-red-700',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
      <span className="w-5 h-5 border-2 border-[#97A675] border-t-transparent rounded-full animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-14 h-14 rounded-2xl bg-[#F4F7F4] flex items-center justify-center text-[#97A675] mb-4">
        {icon || (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
        )}
      </div>
      <p className="text-base font-semibold" style={{ color: '#1C4532' }}>{title}</p>
      {hint && <p className="text-sm text-gray-400 mt-1 max-w-md">{hint}</p>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>;
}

export function PageHeader({ title, breadcrumb, action }: { title: string; breadcrumb?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        {breadcrumb && (
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">{breadcrumb}</p>
        )}
        <h2 className="text-2xl font-black" style={{ color: '#1C4532' }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Modal({
  open, title, children, onClose, footer, wide,
}: { open: boolean; title: string; children: ReactNode; onClose: () => void; footer?: ReactNode; wide?: boolean }) {
  if (!open) return null;
  const isArabic = typeof window !== 'undefined' && window.location.pathname.startsWith('/ar/');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: '#1C4532' }}>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label={isArabic ? 'إغلاق' : 'Fermer'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ---- Toasts + confirm context ----
interface Toast { id: number; tone: Tone; message: string }
interface ConfirmRequest {
  title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean;
  resolve: (ok: boolean) => void;
}

interface UIContext {
  toast: (tone: Tone, message: string) => void;
  confirm: (opts: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>;
}

const Ctx = createContext<UIContext | undefined>(undefined);

export function SCUIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);
  const isArabic = typeof window !== 'undefined' && window.location.pathname.startsWith('/ar/');

  const toast = useCallback((tone: Tone, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const confirm = useCallback(
    (opts: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) =>
      new Promise<boolean>((resolve) => setConfirmReq({ ...opts, resolve })),
    [],
  );

  const closeConfirm = (ok: boolean) => {
    confirmReq?.resolve(ok);
    setConfirmReq(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}

      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${TONE_CLASSES[t.tone]}`}>
            {t.message}
          </div>
        ))}
      </div>

      <Modal
        open={!!confirmReq}
        title={confirmReq?.title || ''}
        onClose={() => closeConfirm(false)}
        footer={
          <>
            <button
              onClick={() => closeConfirm(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              {confirmReq?.cancelLabel || (isArabic ? 'إلغاء' : 'Annuler')}
            </button>
            <button
              onClick={() => closeConfirm(true)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${confirmReq?.danger ? 'bg-red-600 hover:bg-red-700' : ''}`}
              style={confirmReq?.danger ? {} : { background: 'linear-gradient(135deg,#1C4532,#00738C)' }}
            >
              {confirmReq?.confirmLabel || (isArabic ? 'تأكيد' : 'Confirmer')}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">{confirmReq?.message}</p>
      </Modal>
    </Ctx.Provider>
  );
}

export function useUI(): UIContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUI must be used within SCUIProvider');
  return ctx;
}

export const PRIMARY_BTN =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50';
export const PRIMARY_BTN_STYLE = { background: 'linear-gradient(135deg, #1C4532, #00738C)' } as const;
export const GHOST_BTN =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-[#D6EAD4] hover:text-[#1C4532] transition-all';
