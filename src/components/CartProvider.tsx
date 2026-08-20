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
import type { CartItem } from '@/lib/types';
import { cartApi } from '@/lib/api/cart';
import { ApiError } from '@/lib/api';
import type { ApiCart } from '@/lib/api-types';

export interface AddCartItemArgs {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  /** Required for backend sync. Without it the item is kept in local fallback only. */
  productVariantId?: number;
}

interface CartContextValue {
  items: CartItem[];
  itemIds: Map<string, number>; // lineKey -> backend item id
  count: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
  addItem: (item: AddCartItemArgs) => Promise<void>;
  removeItem: (productId: string, size: string, color: string) => Promise<void>;
  updateQuantity: (
    productId: string,
    size: string,
    color: string,
    quantity: number,
  ) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);
const LEGACY_STORAGE_KEY = 'shoppingfront.cart';

function lineKey(p: { productId: string; size: string; color: string }) {
  return `${p.productId}|${p.size}|${p.color}`;
}

function apiCartToItems(cart: ApiCart): {
  items: CartItem[];
  itemIds: Map<string, number>;
} {
  const items: CartItem[] = [];
  const itemIds = new Map<string, number>();
  for (const it of cart.items) {
    const item: CartItem = {
      productId: String(it.productId),
      slug: it.productSlug,
      title: it.productName,
      price: it.unitPrice,
      image: it.imageUrl ?? '',
      size: it.sizeName,
      color: it.colorName,
      quantity: it.quantity,
    };
    items.push(item);
    itemIds.set(lineKey(item), it.id);
  }
  return { items, itemIds };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemIds, setItemIds] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Clean up the legacy localStorage cart from the pre-backend prototype.
  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cart = await cartApi.get();
      const mapped = apiCartToItems(cart);
      setItems(mapped.items);
      setItemIds(mapped.itemIds);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      setError(msg ?? 'Səbət yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (item: AddCartItemArgs) => {
      if (!item.productVariantId) {
        throw new Error('Variant ID tapılmadı — ölçü və rəng seçin.');
      }
      const cart = await cartApi.addItem(item.productVariantId, item.quantity);
      const mapped = apiCartToItems(cart);
      setItems(mapped.items);
      setItemIds(mapped.itemIds);
    },
    [],
  );

  const removeItem = useCallback(
    async (productId: string, size: string, color: string) => {
      const id = itemIds.get(lineKey({ productId, size, color }));
      if (!id) return;
      const cart = await cartApi.removeItem(id);
      const mapped = apiCartToItems(cart);
      setItems(mapped.items);
      setItemIds(mapped.itemIds);
    },
    [itemIds],
  );

  const updateQuantity = useCallback(
    async (productId: string, size: string, color: string, quantity: number) => {
      const id = itemIds.get(lineKey({ productId, size, color }));
      if (!id) return;
      const cart = await cartApi.updateItem(id, Math.max(1, quantity));
      const mapped = apiCartToItems(cart);
      setItems(mapped.items);
      setItemIds(mapped.itemIds);
    },
    [itemIds],
  );

  const clear = useCallback(async () => {
    await cartApi.clear();
    setItems([]);
    setItemIds(new Map());
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, it) => sum + it.quantity, 0);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    return {
      items,
      itemIds,
      count,
      subtotal,
      loading,
      error,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      refresh,
    };
  }, [items, itemIds, loading, error, addItem, removeItem, updateQuantity, clear, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
