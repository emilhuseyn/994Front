'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { wishlistApi, type WishlistItemApi } from '@/lib/api/wishlist';
import { useAuth } from './AuthProvider';

/**
 * Global wishlist state with smart guest/auth handling.
 *
 *   • **Guest users** keep an offline wishlist in `localStorage` (just an
 *     array of product IDs).  Nothing hits the server.
 *   • **Authenticated users** sync with the backend (`/api/wishlist`).  On
 *     login, any locally-saved IDs are merged into the server wishlist so
 *     the user never "loses" the products they bookmarked as a guest.
 *   • Optimistic updates keep the heart icon feeling instant; if the server
 *     call fails we roll back and toast the error.
 *
 * Exposed API:
 *   ```ts
 *   const { items, count, has, toggle, remove, loading } = useWishlist();
 *   has(productId)          // boolean
 *   await toggle(product)   // add or remove based on current state
 *   await remove(productId) // remove only
 *   ```
 */

const STORAGE_KEY = 'wishlist:guest:v1';

export interface WishlistEntry {
  productId: number;
  productName?: string;
  productSlug?: string;
  effectivePrice?: number;
  mainImageUrl?: string | null;
  createdAt?: string;
}

interface WishlistContextValue {
  items: WishlistEntry[];
  count: number;
  loading: boolean;
  has: (productId: number) => boolean;
  toggle: (product: WishlistEntry) => Promise<void>;
  add: (product: WishlistEntry) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  clear: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks the last auth-state we processed, so we only run the merge logic
  // once per login (instead of every render).
  const lastAuthRef = useRef<boolean | null>(null);

  // ── localStorage helpers ─────────────────────────────────────────────
  const readGuestIds = useCallback((): WishlistEntry[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((x) =>
          typeof x === 'number'
            ? { productId: x }
            : x && typeof x.productId === 'number'
            ? (x as WishlistEntry)
            : null,
        )
        .filter((x): x is WishlistEntry => x !== null);
    } catch {
      return [];
    }
  }, []);

  const writeGuestIds = useCallback((entries: WishlistEntry[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* quota errors silently ignored */
    }
  }, []);

  // ── Load initial state when auth resolves ────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    // Only react when the auth state actually changed since last run.
    if (lastAuthRef.current === isAuthenticated) return;
    lastAuthRef.current = isAuthenticated;

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        if (isAuthenticated) {
          // Merge any guest entries first, then fetch the canonical list.
          const guestEntries = readGuestIds();
          for (const entry of guestEntries) {
            try {
              await wishlistApi.add(entry.productId);
            } catch {
              /* swallow conflict / not-found; we'll fetch the truth next */
            }
          }
          writeGuestIds([]); // clear local cache once merged
          const list = await wishlistApi.list();
          if (!cancelled) {
            setItems(list.map(serverToEntry));
          }
        } else {
          // Guest mode: read from localStorage.
          if (!cancelled) setItems(readGuestIds());
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, readGuestIds, writeGuestIds]);

  // ── Mutations ────────────────────────────────────────────────────────
  const has = useCallback(
    (productId: number) => items.some((i) => i.productId === productId),
    [items],
  );

  const add = useCallback(
    async (product: WishlistEntry) => {
      // Optimistic insert (de-dup by productId).
      setItems((prev) =>
        prev.some((i) => i.productId === product.productId)
          ? prev
          : [{ ...product, createdAt: new Date().toISOString() }, ...prev],
      );
      if (isAuthenticated) {
        try {
          await wishlistApi.add(product.productId);
        } catch (err) {
          // Roll back.
          setItems((prev) => prev.filter((i) => i.productId !== product.productId));
          throw err;
        }
      } else {
        // Guest: persist to localStorage.
        writeGuestIds([
          { ...product, createdAt: new Date().toISOString() },
          ...readGuestIds().filter((i) => i.productId !== product.productId),
        ]);
      }
    },
    [isAuthenticated, readGuestIds, writeGuestIds],
  );

  const remove = useCallback(
    async (productId: number) => {
      const snapshot = items;
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      if (isAuthenticated) {
        try {
          await wishlistApi.remove(productId);
        } catch (err) {
          setItems(snapshot); // roll back
          throw err;
        }
      } else {
        writeGuestIds(readGuestIds().filter((i) => i.productId !== productId));
      }
    },
    [isAuthenticated, items, readGuestIds, writeGuestIds],
  );

  const toggle = useCallback(
    async (product: WishlistEntry) => {
      if (has(product.productId)) {
        await remove(product.productId);
      } else {
        await add(product);
      }
    },
    [has, remove, add],
  );

  const clear = useCallback(async () => {
    const snapshot = items;
    setItems([]);
    if (isAuthenticated) {
      try {
        await Promise.all(snapshot.map((i) => wishlistApi.remove(i.productId)));
      } catch {
        setItems(snapshot);
      }
    } else {
      writeGuestIds([]);
    }
  }, [isAuthenticated, items, writeGuestIds]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      count: items.length,
      loading,
      has,
      toggle,
      add,
      remove,
      clear,
    }),
    [items, loading, has, toggle, add, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

function serverToEntry(s: WishlistItemApi): WishlistEntry {
  return {
    productId: s.productId,
    productName: s.productName,
    productSlug: s.productSlug,
    effectivePrice: s.effectivePrice,
    mainImageUrl: s.mainImageUrl ?? null,
    createdAt: s.createdAt,
  };
}
