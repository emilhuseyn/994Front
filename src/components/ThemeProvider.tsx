'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { themeApi } from '@/lib/api/theme';
import {
  DEFAULT_THEME,
  FONT_OPTIONS,
  themeToCssVars,
  type Theme,
} from '@/lib/theme-types';

interface ThemeContextValue {
  /** Active theme — preview if set, otherwise the saved one. Used by UI. */
  theme: Theme;
  /** Canonical theme last loaded from the backend. Used to detect "dirty" state in the editor. */
  saved: Theme;
  /** Locally preview a theme (not persisted). Pass `null` to drop preview. */
  setPreview: (t: Theme | null) => void;
  /** Refresh the canonical theme from the API (after admin save). */
  refresh: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyVars(theme: Theme) {
  const vars = themeToCssVars(theme);
  for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v);
  }
}

function ensureFontLoaded(family: string) {
  if (!FONT_OPTIONS.includes(family as (typeof FONT_OPTIONS)[number])) return;
  const id = `gf-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Theme>(DEFAULT_THEME);
  const [preview, setPreviewState] = useState<Theme | null>(null);

  const active = preview ?? stored;

  // Apply CSS vars + font on every change (server + first client render are
  // covered by the inline default in globals.css).
  useEffect(() => {
    applyVars(active);
    ensureFontLoaded(active.typography.fontFamily);
  }, [active]);

  const refresh = useCallback(async () => {
    try {
      const t = await themeApi.get(true);
      if (t) setStored(t);
    } catch {
      /* keep defaults */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: active,
      saved: stored,
      setPreview: (t) => setPreviewState(t),
      refresh,
    }),
    [active, stored, refresh],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
