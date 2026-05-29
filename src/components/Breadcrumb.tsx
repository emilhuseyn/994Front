import Link from 'next/link';

interface Crumb {
  href?: string;
  label: string;
}

interface Props {
  items: Crumb[];
}

export default function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {it.href ? (
              <Link href={it.href} className="hover:text-black">
                {it.label}
              </Link>
            ) : (
              <span className="text-neutral-700">{it.label}</span>
            )}
            {i < items.length - 1 && <span className="text-neutral-400">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
