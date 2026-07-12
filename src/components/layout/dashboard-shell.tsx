import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/actions/auth";
import type { Profile } from "@/types";

type DashboardShellProps = {
  profile: Profile;
  children: ReactNode;
};

export function DashboardShell({
  profile,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <Link
              href="/dashboard"
              className="text-xl font-bold text-emerald-700"
            >
              CManagement
            </Link>

            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {profile.role} account
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {profile.full_name || "User"}
              </p>

              <p className="text-xs text-slate-500">
                {profile.role}
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {children}
      </main>
    </div>
  );
}