'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';

interface Props {
  children: ReactNode;
}

export default function AdminAuthGuard({ children }: Props) {
  const router = useRouter();
  const { loading, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !isAdmin) {
      router.replace('/admin/login');
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading && isAuthenticated && isAdmin) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-neutral-500">Yüklənir…</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-neutral-500">Yönləndirilir…</p>
      </div>
    );
  }

  return <>{children}</>;
}
