'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Props {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

/**
 * Storefront pagination links.
 *
 * Critically, the links **preserve the current URL search string** — so
 * sorting "ucuzdan bahaya" or applying a colour filter is carried across
 * page navigation.  Without this the filters would reset every time the
 * user clicked a page number.
 */
export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  const params = useSearchParams();
  if (totalPages <= 1) return null;

  const qs = params?.toString();
  const suffix = qs ? `?${qs}` : '';

  const pageHref = (p: number) =>
    p === 1 ? `${basePath}${suffix}` : `${basePath}/page/${p}${suffix}`;

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <nav
      aria-label="Səhifələmə"
      className="mt-10 flex items-center justify-center gap-1 text-sm"
    >
      {currentPage > 1 && (
        <Link
          href={pageHref(currentPage - 1)}
          className="border border-neutral-200 px-3 py-2 text-neutral-700 hover:border-black hover:text-black"
          aria-label="Əvvəlki"
        >
          ←
        </Link>
      )}

      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <Link
            key={p}
            href={pageHref(p)}
            aria-current={isActive ? 'page' : undefined}
            className={`min-w-[40px] border px-3 py-2 text-center ${
              isActive
                ? 'border-black bg-black text-white'
                : 'border-neutral-200 text-neutral-700 hover:border-black hover:text-black'
            }`}
          >
            {p}
          </Link>
        );
      })}

      {currentPage < totalPages && (
        <Link
          href={pageHref(currentPage + 1)}
          className="border border-neutral-200 px-3 py-2 text-neutral-700 hover:border-black hover:text-black"
          aria-label="Növbəti"
        >
          →
        </Link>
      )}
    </nav>
  );
}
