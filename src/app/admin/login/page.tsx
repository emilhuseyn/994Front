'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { AdminInput } from '@/components/admin/AdminInput';
import AdminButton from '@/components/admin/AdminButton';
import { ApiError } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginShell loading />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginShell({ loading, children }: { loading?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-block text-xl font-black uppercase tracking-[0.2em]"
          >
            CODE<span className="font-light">994</span>
          </Link>
        </div>
        <ShellHeading loading={loading} />
        {loading ? null : children}
      </div>
    </div>
  );
}

function ShellHeading({ loading }: { loading?: boolean }) {
  const { t } = useTranslation();
  return (
    <p className="mb-6 text-center text-xs uppercase tracking-wider text-neutral-500">
      {loading ? t('common.loading') : t('admin.panel')}
    </p>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { t } = useTranslation();
  const { login, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = search.get('next') ?? '/admin';

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      router.replace(next);
    }
  }, [authLoading, isAuthenticated, isAdmin, router, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role !== 1) {
        setError(t('admin.login.notAdmin'));
        return;
      }
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginShell>
      <form onSubmit={onSubmit} className="space-y-4">
        <AdminInput
          label={t('admin.login.email')}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <AdminInput
          label={t('admin.login.password')}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
        <AdminButton type="submit" loading={submitting} className="w-full">
          {t('admin.login.submit')}
        </AdminButton>
      </form>

      <Link
        href="/"
        className="mt-6 block text-center text-xs text-neutral-500 hover:text-black"
      >
        {t('admin.nav.backToShop')}
      </Link>
    </LoginShell>
  );
}
