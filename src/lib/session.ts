import type { ApiUser } from './api-types';

// Persistent guest session id used by the backend cart for unauthenticated users.
// Sent as the X-Session-Id header on /api/cart calls.

const KEY = 'shoppingfront.sessionId';
const TOKEN_KEY = 'shoppingfront.token';
const USER_KEY = 'shoppingfront.user';

function randomId(): string {
  // Crypto.randomUUID is available in all modern browsers + Node 19+
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = randomId();
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }
  return id;
}

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getCachedUser(): ApiUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ApiUser> | null;
    if (!parsed) return null;
    if (typeof parsed.id !== 'number') return null;
    if (typeof parsed.fullName !== 'string') return null;
    if (typeof parsed.email !== 'string') return null;
    if (typeof parsed.role !== 'number') return null;
    return parsed as ApiUser;
  } catch {
    return null;
  }
}

export function setCachedUser(user: ApiUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      window.localStorage.removeItem(USER_KEY);
      return;
    }
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}
