import type { ApiResponse } from '../api-types';
import { getAccessToken, getOrCreateSessionId } from '../session';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5080';

export interface ApiCallOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Pass true to include the X-Session-Id header (cart endpoints). */
  withSession?: boolean;
  /** ISR-style revalidation in seconds for server fetches. */
  revalidate?: number | false;
  /** Cache mode for server fetches. */
  cache?: RequestCache;
  /** Suppress thrown errors and resolve with `null` instead. */
  silent?: boolean;
  /** Override search params. */
  query?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  status: number;
  errors?: string[];
  constructor(message: string, status: number, errors?: string[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function buildUrl(path: string, query?: ApiCallOptions['query']): string {
  const url = new URL(
    path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/**
 * Human-friendly Azerbaijani fallback messages for common HTTP status codes.
 * Used only when the backend response doesn't include its own `message`.
 */
const STATUS_MESSAGES_AZ: Record<number, string> = {
  0: 'Backend əlçatan deyil — internet və ya server bağlantısını yoxlayın.',
  400: 'Sorğu yanlışdır. Daxil etdiyiniz məlumatları yoxlayın.',
  401: 'Sessiyanız bitib — yenidən daxil olun.',
  403: 'Bu əməliyyat üçün icazəniz yoxdur.',
  404: 'Axtardığınız məlumat tapılmadı.',
  408: 'Sorğu vaxtı bitdi. Yenidən cəhd edin.',
  409: 'Konflikt baş verdi — məlumat artıq mövcuddur və ya dəyişib.',
  413: 'Fayl həddən böyükdür. Daha kiçik bir fayl seçin.',
  415: 'Bu fayl növü dəstəklənmir. Şəkil yükləmək üçün PNG, JPG və ya WebP istifadə edin.',
  422: 'Daxil edilən məlumat doğrulanmadı.',
  429: 'Çox sayda sorğu göndərildi. Bir az gözləyin.',
  500: 'Server xətası baş verdi. Bir az sonra yenidən cəhd edin.',
  502: 'Şlüz xətası — server hazırda əlçatan deyil.',
  503: 'Server müvəqqəti olaraq əlçatan deyil.',
  504: 'Server cavab vermədi (timeout).',
};

function fallbackMessage(status: number): string {
  return STATUS_MESSAGES_AZ[status] ?? `Naməlum xəta baş verdi (HTTP ${status}).`;
}

export async function apiFetch<T>(
  path: string,
  options: ApiCallOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  // Only auto-set JSON Content-Type when the body is a plain object that we'll
  // stringify ourselves.  For FormData, the browser must control Content-Type
  // because it needs to embed the `boundary=...` part — manually setting
  // `application/json` here would make the backend reply 415 Unsupported
  // Media Type, since file-upload controllers use [Consumes("multipart/form-data")].
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  const isPlainObjectBody =
    options.body !== undefined &&
    options.body !== null &&
    typeof options.body !== 'string' &&
    !isFormData;
  if (isPlainObjectBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  // Auth + session (client-side only)
  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (options.withSession && !headers.has('X-Session-Id')) {
      headers.set('X-Session-Id', getOrCreateSessionId());
    }
  }

  const init: RequestInit & { next?: { revalidate?: number | false } } = {
    ...options,
    headers,
    body:
      options.body === undefined
        ? undefined
        : typeof options.body === 'string' || options.body instanceof FormData
        ? (options.body as BodyInit)
        : JSON.stringify(options.body),
  };

  // Server-side caching hint
  if (typeof window === 'undefined') {
    if (options.cache) init.cache = options.cache;
    else if (options.revalidate !== undefined)
      init.next = { revalidate: options.revalidate };
    else init.next = { revalidate: 30 };
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), init);
  } catch (err) {
    if (options.silent) return null as unknown as T;
    // Network / DNS / CORS — server didn't even respond.
    const detail = (err as Error).message;
    throw new ApiError(
      detail ? `${fallbackMessage(0)} (${detail})` : fallbackMessage(0),
      0,
    );
  }

  const text = await res.text();
  let payload: ApiResponse<T> | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>;
    } catch {
      /* non-JSON */
    }
  }

  if (!res.ok || (payload && payload.success === false)) {
    const message = payload?.message || fallbackMessage(res.status);
    if (options.silent) return null as unknown as T;
    throw new ApiError(message, res.status, payload?.errors ?? undefined);
  }

  // Endpoints that return 204 No Content
  if (!payload) return null as unknown as T;
  return payload.data as T;
}

/**
 * Resolve an image URL returned by the backend. Absolute URLs are returned as-is;
 * relative paths (e.g. `/uploads/...`) are prefixed with the API base URL so
 * <Image> can load them from the backend.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) {
    return 'https://placehold.co/600x800/eee/999?text=No+image';
  }
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}
