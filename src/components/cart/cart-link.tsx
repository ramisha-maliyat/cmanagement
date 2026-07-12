"use client";

import Link from "next/link";

import { useCart } from "@/features/cart/cart-provider";

export function CartLink() {
  const {
    itemCount,
    hydrated,
  } = useCart();

  return (
    <Link
      href="/cart"
      className="relative rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Cart

      {hydrated && itemCount > 0 && (
        <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}