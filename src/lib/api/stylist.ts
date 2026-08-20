import { apiFetch } from './client';

/** One product slot in the AI stylist's 4-card outfit. */
export interface StylistItemApi {
  role: 'top' | 'bottom' | 'shoes' | 'accessory' | string;
  productId: number;
  productSlug: string;
  productName: string;
  brandName: string;
  price: number;
  imageUrl?: string | null;
  reason: string;
  isAnchor: boolean;
}

/** Result of /api/stylist/suggest. */
export interface StylistSuggestionApi {
  outfitName: string;
  items: StylistItemApi[];
  /** False when the backend fell back to a deterministic catalog walk. */
  aiPowered: boolean;
}

/** Recognised style presets — matches the backend's `KnownStyles`. */
export type StylistStyle =
  | 'auto'
  | 'streetwear'
  | 'minimal'
  | 'oldmoney'
  | 'techwear'
  | 'y2k'
  | 'sporty'
  | 'classic'
  | 'boho'
  | 'casual';

export interface StylistRequestPayload {
  productId: number;
  style?: StylistStyle;
  locale?: 'AZ' | 'RUS' | 'ENG';
}

export const stylistApi = {
  suggest(payload: StylistRequestPayload) {
    return apiFetch<StylistSuggestionApi>('/api/stylist/suggest', {
      method: 'POST',
      body: payload,
    });
  },
};
