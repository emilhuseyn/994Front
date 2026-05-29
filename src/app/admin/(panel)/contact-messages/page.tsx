'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminBadge from '@/components/admin/AdminBadge';
import { AdminSelect } from '@/components/admin/AdminInput';
import { useToast } from '@/components/admin/ToastProvider';
import { adminApi, type AdminContactMessage } from '@/lib/api/admin';
import { ApiError } from '@/lib/api';

const PAGE_SIZE = 20;
type Filter = 'all' | 'unread' | 'read';

export default function AdminContactMessagesPage() {
  const toast = useToast();

  const [items, setItems] = useState<AdminContactMessage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [markingId, setMarkingId] = useState<number | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.contactMessages.list({
        page,
        pageSize: PAGE_SIZE,
        isRead: filter === 'all' ? undefined : filter === 'read',
      });
      setItems(res?.items ?? []);
      setTotalCount(res?.totalCount ?? 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(msg: AdminContactMessage) {
    setMarkingId(msg.id);
    try {
      await adminApi.contactMessages.markRead(msg.id);
      toast.success('Oxundu kimi işarələndi.');
      // Optimistic local update
      setItems((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setMarkingId(null);
    }
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const unreadCount = items.filter((m) => !m.isRead).length;

  return (
    <>
      <PageHeader
        title="Əlaqə mesajları"
        subtitle={
          filter === 'all'
            ? `Cəmi ${totalCount} mesaj · cari səhifədə ${unreadCount} oxunmamış`
            : filter === 'unread'
            ? `${totalCount} oxunmamış mesaj`
            : `${totalCount} oxunmuş mesaj`
        }
      />

      <div className="mb-4 grid gap-3 rounded border border-neutral-200 bg-white p-4 sm:grid-cols-3">
        <AdminSelect
          label="Filter"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as Filter);
            setPage(1);
          }}
        >
          <option value="all">Hamısı</option>
          <option value="unread">Yalnız oxunmamış</option>
          <option value="read">Yalnız oxunmuş</option>
        </AdminSelect>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Yüklənir…</p>
      ) : items.length === 0 ? (
        <p className="rounded border border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500">
          Heç bir mesaj tapılmadı.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => {
            const isOpen = expanded.has(m.id);
            const isMarking = markingId === m.id;
            return (
              <li
                key={m.id}
                className={`rounded border bg-white transition-colors ${
                  m.isRead ? 'border-neutral-200' : 'border-amber-300 bg-amber-50/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(m.id)}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-semibold uppercase text-white">
                    {m.fullName.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{m.fullName}</p>
                      {!m.isRead && <AdminBadge tone="warning">Yeni</AdminBadge>}
                      <span className="text-[11px] text-neutral-500">
                        {new Date(m.createdAt).toLocaleString('az-AZ', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="truncate text-xs text-neutral-500">
                      {m.email}
                      {m.phone ? ` · ${m.phone}` : ''} · {m.message.slice(0, 100)}
                      {m.message.length > 100 ? '…' : ''}
                    </p>
                  </div>
                  <span className="text-neutral-400">{isOpen ? '▴' : '▾'}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-neutral-200 px-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <p className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">
                          Mesaj
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed">
                          {m.message}
                        </p>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                            E-poçt
                          </p>
                          <a
                            href={`mailto:${m.email}`}
                            className="hover:underline"
                          >
                            {m.email}
                          </a>
                        </div>
                        {m.phone && (
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                              Telefon
                            </p>
                            <a
                              href={`tel:${m.phone}`}
                              className="hover:underline"
                            >
                              {m.phone}
                            </a>
                          </div>
                        )}
                        {!m.isRead && (
                          <AdminButton
                            size="sm"
                            onClick={() => markRead(m)}
                            loading={isMarking}
                          >
                            Oxundu et
                          </AdminButton>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-1 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`min-w-[36px] rounded border px-3 py-1 ${
                p === page
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 text-neutral-700 hover:border-black'
              }`}
            >
              {p}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
