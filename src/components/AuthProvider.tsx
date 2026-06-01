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
import { authApi } from '@/lib/api/auth';
import {
  getAccessToken,
  getCachedUser,
  setAccessToken,
  setCachedUser,
} from '@/lib/session';
import type { ApiUser } from '@/lib/api-types';

export const ROLE = {
  Customer: 0,
  Admin: 1,
} as const;

interface AuthContextValue {
  user: ApiUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<ApiUser>;
  register: (
    fullName: string,
    email: string,
    password: string,
    phoneNumber?: string,
  ) => Promise<ApiUser>;
  logout: () => void;
  refresh: (options?: { showLoading?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_REFRESH_TIMEOUT_MS = 3500;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(() => getCachedUser());
  const [loading, setLoading] = useState(() => {
    const hasToken = !!getAccessToken();
    const cached = getCachedUser();
    return hasToken && !cached;
  });

  const refresh = useCallback(
    async (options?: { showLoading?: boolean }) => {
      const hasToken = !!getAccessToken();
      const cached = getCachedUser();
      const showLoading = options?.showLoading ?? (hasToken && !cached);

      if (showLoading) setLoading(true);

      if (!hasToken) {
        setUser(null);
        setCachedUser(null);
        if (showLoading) setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        AUTH_REFRESH_TIMEOUT_MS,
      );

      try {
        const me = await authApi.me({ signal: controller.signal });
        if (me) {
          setUser(me);
          setCachedUser(me);
        } else {
          setAccessToken(null);
          setUser(null);
          setCachedUser(null);
        }
      } catch {
        if (!cached) setUser(null);
      } finally {
        window.clearTimeout(timeoutId);
        if (showLoading) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUser(res.user);
    setCachedUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(
    async (
      fullName: string,
      email: string,
      password: string,
      phoneNumber?: string,
    ) => {
      const res = await authApi.register(fullName, email, password, phoneNumber);
      setUser(res.user);
      setCachedUser(res.user);
      return res.user;
    },
    [],
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    setCachedUser(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === ROLE.Admin,
      loading,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
