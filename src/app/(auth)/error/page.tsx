import Link from "next/link";

import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";

type AuthErrorPageProps = {
  searchParams: PageSearchParams;
};

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = await searchParams;

  const error =
    getQueryValue(params.error) ??
    "The authentication request could not be completed.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
          !
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Authentication error
        </h1>

        <p className="mt-3 leading-7 text-slate-600">
          {error}
        </p>

        <div className="mt-7 flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Sign in
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}