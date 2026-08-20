'use client';

import { useEffect, useRef, useState } from 'react';
import { useCurrency } from './CurrencyProvider';
import { CURRENCY_SYMBOL } from '@/lib/currency';

/** Header currency switcher — mirrors LanguageDropdown so the pair reads as one control. */
export default function CurrencyDropdown() {
  const { currency, setCurrency, available, source, updatedAt } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Rates unavailable → nothing to switch to; hide the control entirely.
  if (available.length <= 1) return null;

  const sourceLabel = source === 'cbar' ? 'CBAR' : source === 'er-api' ? 'exchangerate-api' : source;
  const title = updatedAt
    ? `Məzənnə: ${sourceLabel} · ${new Date(updatedAt).toLocaleDateString('az-AZ')}`
    : undefined;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Valyuta: ${currency}`}
        title={title}
        className="flex items-center gap-1 text-sm font-medium uppercase tracking-wider hover:text-neutral-500"
      >
        <span>{CURRENCY_SYMBOL[currency]}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
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
          className="fade-in absolute right-0 z-50 mt-2 w-28 border border-neutral-200 bg-white shadow-md"
        >
          {available.map((c) => (
            <li key={c}>
              <button
                role="option"
                aria-selected={currency === c}
                onClick={() => {
                  setCurrency(c);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm uppercase tracking-wider hover:bg-neutral-100 ${
                  currency === c ? 'font-semibold' : ''
                }`}
              >
                <span className="w-3 text-center">{CURRENCY_SYMBOL[c]}</span>
                <span>{c}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
