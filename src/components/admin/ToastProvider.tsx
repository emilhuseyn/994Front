'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Tone = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastContextValue {
  show: (message: string, tone?: Tone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let counter = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: Tone = 'info') => {
      const id = counter++;
      setToasts((prev) => [...prev, { id, tone, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
      info: (m) => show(m, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[260px] max-w-sm rounded border px-4 py-3 text-sm shadow-md ${
              t.tone === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : t.tone === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-neutral-200 bg-white text-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span>{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                aria-label="Bağla"
                className="text-neutral-400 hover:text-black"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
