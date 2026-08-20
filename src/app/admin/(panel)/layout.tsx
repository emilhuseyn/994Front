'use client';

import { useState } from 'react';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { ToastProvider } from '@/components/admin/ToastProvider';

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminAuthGuard>
      <ToastProvider>
        <div className="flex min-h-screen bg-neutral-50">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <AdminSidebar />
          </div>

          {/* Mobile slide-in sidebar */}
          <div
            className={`fixed inset-0 z-40 lg:hidden ${
              mobileOpen ? '' : 'pointer-events-none'
            }`}
          >
            <div
              onClick={() => setMobileOpen(false)}
              className={`absolute inset-0 bg-black/40 transition-opacity ${
                mobileOpen ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              className={`absolute inset-y-0 left-0 transition-transform ${
                mobileOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <AdminSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>

          <div className="flex min-h-screen flex-1 flex-col">
            <AdminTopbar onToggleSidebar={() => setMobileOpen((v) => !v)} />
            <main className="flex-1 p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </AdminAuthGuard>
  );
}
