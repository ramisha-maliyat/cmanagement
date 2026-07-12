import Link from "next/link";

import { PublicShell } from "@/components/layout/public-shell";

export default function HomePage() {
  return (
    <PublicShell>
      <section className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Canteen Management System
        </p>

        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Order food from your available
          canteens
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Browse vendors, explore menus and add
          food or drinks to your cart.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/vendors"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Browse canteens
          </Link>

          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}