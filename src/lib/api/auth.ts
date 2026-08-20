import { ApiError, apiFetch } from './client';
import type { ApiAuthResponse, ApiUser } from '../api-types';
import { setAccessToken } from '../session';

export const authApi = {
  async login(email: string, password: string) {
    const res = await apiFetch<ApiAuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    // Only persist a token when one was actually issued — an unverified
    // account comes back with requiresVerification and no token.
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
  },
  async register(fullName: string, email: string, password: string, phoneNumber?: string) {
    const res = await apiFetch<ApiAuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { fullName, email, password, phoneNumber },
    });
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
  },
  async verifyEmail(email: string, code: string) {
    const res = await apiFetch<ApiAuthResponse>('/api/auth/verify-email', {
      method: 'POST',
      body: { email, code },
    });
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
  },
  async resendCode(email: string) {
    return apiFetch<null>('/api/auth/resend-code', {
      method: 'POST',
      body: { email },
    });
  },
  async me(options?: { signal?: AbortSignal }) {
    try {
      return await apiFetch<ApiUser>('/api/auth/me', {
        cache: 'no-store',
        signal: options?.signal,
      });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return null;
      }
      throw err;
    }
  },
  logout() {
    setAccessToken(null);
  },
};
