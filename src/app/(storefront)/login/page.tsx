'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ApiError } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-shop py-16" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const search = useSearchParams();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const next = search.get('next') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in → bounce to the destination.
  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace(next);
  }, [authLoading, isAuthenticated, router, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-shop flex justify-center py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold uppercase tracking-wider">
          {t('auth.login.title')}
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-500">
          {t('auth.login.subtitle')}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
              {t('auth.email')}
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
              {t('auth.password')}
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t('auth.login.noAccount')}{' '}
          <Link
            href={next !== '/account' ? `/register?next=${encodeURIComponent(next)}` : '/register'}
            className="font-semibold text-black underline-offset-2 hover:underline"
          >
            {t('auth.login.registerLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
