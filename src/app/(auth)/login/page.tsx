import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions/auth";
import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";

type LoginPageProps = {
  searchParams: PageSearchParams;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const error = getQueryValue(params.error);
  const message = getQueryValue(params.message);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">
        Sign in
      </h1>

      <p className="mt-2 text-sm text-slate-600">
        Access your CManagement account.
      </p>

      <div className="mt-6">
        <AuthMessage error={error} message={message} />
      </div>

      <form action={loginAction} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <Link
              href="/forgot-password"
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <SubmitButton pendingText="Signing in...">
          Sign in
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Do not have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Register
        </Link>
      </p>
    </>
  );
}