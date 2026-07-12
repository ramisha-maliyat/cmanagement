import Link from "next/link";
import type { ReactNode } from "react";

import { CartLink } from "@/components/cart/cart-link";

type PublicShellProps = {
  children: ReactNode;
};

export function PublicShell({
  children,
}: PublicShellProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4">
          <Link
            href="/"
            className="text-xl font-bold text-emerald-700"
          >
            CManagement
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/vendors"
              className="hidden text-sm font-semibold text-slate-700 hover:text-emerald-700 sm:block"
            >
              Browse canteens
            </Link>

            <Link
              href="/dashboard"
              className="hidden text-sm font-semibold text-slate-700 hover:text-emerald-700 sm:block"
            >
              My account
            </Link>

            <CartLink />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {children}
      </main>
    </div>
  );
}