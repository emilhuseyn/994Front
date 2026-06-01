'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ApiError } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="container-shop py-16" />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const search = useSearchParams();
  const { register, isAuthenticated, loading: authLoading } = useAuth();

  const next = search.get('next') || '/account';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace(next);
  }, [authLoading, isAuthenticated, router, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t('auth.register.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.register.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      await register(fullName.trim(), email.trim(), password, phone.trim() || undefined);
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
          {t('auth.register.title')}
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-500">
          {t('auth.register.subtitle')}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
              {t('auth.fullName')}
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
            />
          </div>
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
              {t('auth.phone')}{' '}
              <span className="font-normal normal-case text-neutral-400">
                ({t('auth.optional')})
              </span>
            </label>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+994..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
              {t('auth.register.confirmPassword')}
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-field"
            />
          </div>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t('auth.register.haveAccount')}{' '}
          <Link
            href={next !== '/account' ? `/login?next=${encodeURIComponent(next)}` : '/login'}
            className="font-semibold text-black underline-offset-2 hover:underline"
          >
            {t('auth.register.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
