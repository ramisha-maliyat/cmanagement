import { redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import { requireAccount } from "@/lib/auth/guards";

export default async function AccountDisabledPage() {
  const { profile } = await requireAccount();

  if (profile.is_active) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Account unavailable
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          This CManagement account has been disabled. Contact the
          platform administrator if you believe this is a mistake.
        </p>

        <form action={logoutAction} className="mt-7">
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}