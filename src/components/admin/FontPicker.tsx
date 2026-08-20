'use client';

import { useEffect, useRef, useState } from 'react';
import { FONT_OPTIONS } from '@/lib/theme-types';

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}

/**
 * Custom dropdown that renders each Google Font option in its own font so the
 * admin can preview the typeface before picking it. Browsers ignore
 * `font-family` on native `<option>` elements, so we build the menu ourselves.
 * All fonts are pre-loaded into the document head on mount.
 */
export default function FontPicker({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Pre-load all candidate fonts so the menu items render correctly the first
  // time the dropdown opens.
  useEffect(() => {
    for (const family of FONT_OPTIONS) {
      const id = `gf-${family.replace(/\s+/g, '-')}`;
      if (document.getElementById(id)) continue;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
        family,
      )}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-neutral-600">
          {label}
        </span>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ fontFamily: `'${value}', sans-serif` }}
          className="flex w-full items-center justify-between rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
        >
          <span>{value}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            aria-hidden="true"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <ul
            role="listbox"
            className="fade-in absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded border border-neutral-200 bg-white shadow-md scrollbar-thin"
          >
            {FONT_OPTIONS.map((family) => {
              const active = family === value;
              return (
                <li key={family}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(family);
                      setOpen(false);
                    }}
                    style={{ fontFamily: `'${family}', sans-serif` }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'bg-black text-white'
                        : 'hover:bg-neutral-100'
                    }`}
                  >
                    <span>{family}</span>
                    <span
                      className={`text-xs ${
                        active ? 'text-white/70' : 'text-neutral-400'
                      }`}
                    >
                      Aa Bb 123
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </label>
  );
}
