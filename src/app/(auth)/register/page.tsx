import Link from "next/link";
import { redirect } from "next/navigation";

import { registerAction } from "@/app/actions/auth";
import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";

type RegisterPageProps = {
  searchParams: PageSearchParams;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error = getQueryValue(params.error);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">
        Create an account
      </h1>

      <p className="mt-2 text-sm text-slate-600">
        Register as a customer. Vendor applications will be
        available after login.
      </p>

      <div className="mt-6">
        <AuthMessage error={error} />
      </div>

      <form action={registerAction} className="space-y-5">
        <div>
          <label
            htmlFor="fullName"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Full name
          </label>

          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Phone number{" "}
            <span className="text-slate-400">(optional)</span>
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={30}
            autoComplete="tel"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

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
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          <p className="mt-2 text-xs text-slate-500">
            Use at least 8 characters with a letter, number and
            special character.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Confirm password
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <SubmitButton pendingText="Creating account...">
          Create account
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}