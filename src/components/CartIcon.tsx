'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';

export default function CartIcon() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative flex items-center text-black hover:text-neutral-500"
      aria-label="Səbət"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 4h2l2.4 12.2a2 2 0 002 1.6h8.2a2 2 0 002-1.5L21 8H6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1.4" fill="currentColor" />
        <circle cx="17" cy="20" r="1.4" fill="currentColor" />
      </svg>
      <span className="ml-1 min-w-[18px] rounded-full bg-black px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
        {count}
      </span>
    </Link>
  );
}
