import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'warn' | 'info' | 'error';

export interface ToastInput {
  title: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastInput, 'message'>> {
  id: number;
  message?: string;
}

interface ToastContextValue {
  toast: (t: ToastInput) => void;
  success: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warn: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 4000;

function variantIcon(v: ToastVariant) {
  const cls = 'w-[15px] h-[15px]';
  switch (v) {
    case 'success': return <CheckCircle2 className={cls} />;
    case 'warn':    return <AlertTriangle className={cls} />;
    case 'error':   return <XCircle className={cls} />;
    case 'info':
    default:        return <Info className={cls} />;
  }
}

function variantClasses(v: ToastVariant) {
  switch (v) {
    case 'success': return { wrap: 'toast-success', icon: 'bg-[#6cd29a] text-white' };
    case 'warn':    return { wrap: 'toast-warn',    icon: 'bg-[var(--yellow)] text-[var(--ink)]' };
    case 'error':   return { wrap: 'toast-error',   icon: 'bg-[var(--red)] text-white' };
    case 'info':
    default:        return { wrap: 'toast-info',    icon: 'bg-[var(--blue)] text-white' };
  }
}

const borderColorByVariant: Record<ToastVariant, string> = {
  success: '#6cd29a',
  warn:    'var(--yellow)',
  error:   'var(--red)',
  info:    'var(--blue)',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: ToastInput) => {
    const id = ++idRef.current;
    const item: ToastItem = {
      id,
      title: t.title,
      message: t.message,
      variant: t.variant ?? 'info',
      duration: t.duration ?? DEFAULT_DURATION,
    };
    setItems((prev) => {
      const next = [...prev, item];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
  }, []);

  const value: ToastContextValue = {
    toast,
    success: (title, message) => toast({ title, message, variant: 'success' }),
    info:    (title, message) => toast({ title, message, variant: 'info' }),
    warn:    (title, message) => toast({ title, message, variant: 'warn' }),
    error:   (title, message) => toast({ title, message, variant: 'error' }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <ToastView key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
      <style>{`
        .toast-stack {
          position: fixed;
          right: 16px;
          bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 9999;
          width: 360px;
          max-width: calc(100vw - 32px);
          pointer-events: none;
        }
        .toast-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 12px 14px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          border-left: 4px solid var(--teal);
          animation: toast-in .35s var(--ease-spring);
          pointer-events: auto;
        }
        .toast-card .toast-icon-wrap {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .toast-card .toast-body { flex: 1; min-width: 0; }
        .toast-card .toast-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 2px;
          font-family: var(--font-ui);
        }
        .toast-card .toast-msg {
          font-size: 12.5px;
          color: var(--fg-2);
          margin: 0;
          line-height: 1.45;
        }
        .toast-card .toast-close-btn {
          background: transparent;
          border: 0;
          color: var(--fg-3);
          cursor: pointer;
          width: 20px; height: 20px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          padding: 0;
        }
        .toast-card .toast-close-btn:hover { color: var(--fg-1); }
      `}</style>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    if (item.duration <= 0) return;
    const handle = window.setTimeout(onDismiss, item.duration);
    return () => window.clearTimeout(handle);
  }, [item.duration, onDismiss]);

  const cls = variantClasses(item.variant);
  return (
    <div
      className="toast-card"
      style={{ borderLeftColor: borderColorByVariant[item.variant] }}
    >
      <div className={`toast-icon-wrap ${cls.icon}`}>
        {variantIcon(item.variant)}
      </div>
      <div className="toast-body">
        <p className="toast-title">{item.title}</p>
        {item.message && <p className="toast-msg">{item.message}</p>}
      </div>
      <button className="toast-close-btn" onClick={onDismiss} aria-label="Cerrar">
        <X className="w-[14px] h-[14px]" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // No-op fallback so calls outside the provider don't crash.
    const noop = () => {};
    return {
      toast: noop,
      success: noop,
      info: noop,
      warn: noop,
      error: noop,
    };
  }
  return ctx;
}
