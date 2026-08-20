'use client';

import { useEffect, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export default function Modal({ open, title, description, onClose, size = 'md', children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${SIZES[size]} rounded-lg bg-white shadow-xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Bağla"
            className="text-2xl leading-none text-neutral-400 hover:text-black"
          >
            ×
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
