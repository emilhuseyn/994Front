import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
  /**
   * Identifier reported to `onSort` when this column header is clicked.
   * When omitted, the header is not sortable and renders without the icon.
   */
  sortKey?: string;
}

/** Active sort direction reported back to the caller. */
export type SortDir = 'asc' | 'desc';

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  empty?: ReactNode;
  loading?: boolean;
  /**
   * Optional sort wiring.  When provided alongside one or more `sortKey`
   * columns, those headers become clickable buttons that toggle the
   * direction on the active column or switch to a new column.
   */
  sortBy?: string;
  sortDir?: SortDir;
  onSort?: (sortKey: string, nextDir: SortDir) => void;
}

export default function AdminTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  loading,
  sortBy,
  sortDir,
  onSort,
}: Props<T>) {
  function handleHeaderClick(col: Column<T>) {
    if (!col.sortKey || !onSort) return;
    // Cycle: clicking the active column flips direction; clicking another
    // column starts from ascending.
    const nextDir: SortDir =
      sortBy === col.sortKey && sortDir === 'asc' ? 'desc' : 'asc';
    onSort(col.sortKey, nextDir);
  }

  return (
    <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50">
          <tr>
            {columns.map((c) => {
              const sortable = !!c.sortKey && !!onSort;
              const isActive = sortable && sortBy === c.sortKey;
              const alignCls =
                c.align === 'right'
                  ? 'text-right'
                  : c.align === 'center'
                  ? 'text-center'
                  : 'text-left';
              return (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 ${alignCls}`}
                  aria-sort={
                    sortable
                      ? isActive
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => handleHeaderClick(c)}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-black ${
                        c.align === 'right' ? 'flex-row-reverse' : ''
                      } ${isActive ? 'text-black' : ''}`}
                    >
                      <span>{c.header}</span>
                      <SortIcon active={isActive} dir={isActive ? sortDir : undefined} />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-neutral-500">
                Yüklənir…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-xs text-neutral-500">
                {empty ?? 'Heç bir nəticə tapılmadı.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-neutral-50">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 align-middle ${
                      c.align === 'right'
                        ? 'text-right'
                        : c.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Tri-state sort glyph:
 *   • inactive → faint up/down arrows
 *   • active ascending → solid ↑
 *   • active descending → solid ↓
 */
function SortIcon({ active, dir }: { active: boolean; dir?: SortDir }) {
  if (!active) {
    return (
      <svg
        viewBox="0 0 12 16"
        width="10"
        height="14"
        className="text-neutral-300"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6 1l3.5 4h-7L6 1z" />
        <path d="M6 15l-3.5-4h7L6 15z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 12 16"
      width="10"
      height="14"
      className="text-black"
      fill="currentColor"
      aria-hidden="true"
    >
      {dir === 'asc' ? (
        <path d="M6 1l4 6H2l4-6z" />
      ) : (
        <path d="M6 15l4-6H2l4 6z" />
      )}
    </svg>
  );
}
