'use client';

import { useCurrency } from './CurrencyProvider';

/**
 * Storefront price.
 *
 * With the base currency (AZN) selected it's just the plain manat price. With
 * any other currency it shows the converted figure with the real manat amount
 * underneath — the shop charges in manat, so that number never disappears.
 */
export default function Price({
  azn,
  className,
  aznClassName,
}: {
  azn: number;
  className?: string;
  aznClassName?: string;
}) {
  const { format, formatAzn, isBase } = useCurrency();

  if (isBase) return <span className={className}>{formatAzn(azn)}</span>;

  return (
    <span className={className}>
      {format(azn)}
      <span
        className={
          aznClassName ??
          'mt-0.5 block text-[11px] font-normal tracking-normal text-neutral-500'
        }
      >
        {formatAzn(azn)}
      </span>
    </span>
  );
}
