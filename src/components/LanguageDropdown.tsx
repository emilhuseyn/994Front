'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './LanguageProvider';

export default function LanguageDropdown() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 text-sm font-medium uppercase tracking-wider hover:text-neutral-500"
      >
        <span>{locale}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="fade-in absolute right-0 z-50 mt-2 w-24 border border-neutral-200 bg-white shadow-md"
        >
          {(['AZ', 'RUS', 'ENG'] as const).map((l) => (
            <li key={l}>
              <button
                role="option"
                aria-selected={locale === l}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm uppercase tracking-wider hover:bg-neutral-100 ${
                  locale === l ? 'font-semibold' : ''
                }`}
              >
                {l}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
