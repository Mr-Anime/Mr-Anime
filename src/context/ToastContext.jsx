import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Icon from '../components/ui/Icon.jsx';

const ToastContext = createContext(null);
const ICONS = { success: 'check', error: 'alert', info: 'info' };
const ACCENTS = {
  success: 'text-emerald-400',
  error: 'text-brand',
  info: 'text-accent',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message, { type = 'info', duration = 4000 } = {}) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-3), { id, message, type }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast,
      success: (m, o) => toast(m, { ...o, type: 'success' }),
      error: (m, o) => toast(m, { ...o, type: 'error' }),
      info: (m, o) => toast(m, { ...o, type: 'info' }),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:top-4 sm:items-end"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-white/10 bg-surface-2/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur animate-[toast-in_0.25s_ease-out]"
          >
            <Icon name={ICONS[t.type]} size={18} className={`mt-0.5 shrink-0 ${ACCENTS[t.type]}`} />
            <p className="flex-1 text-sm text-zinc-100">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-zinc-500 hover:text-white" aria-label="Dismiss notification">
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
