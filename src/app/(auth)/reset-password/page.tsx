import { redirect } from "next/navigation";

import { resetPasswordAction } from "@/app/actions/auth";
import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";

type ResetPasswordPageProps = {
  searchParams: PageSearchParams;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      "/login?error=The%20password%20reset%20link%20is%20invalid%20or%20has%20expired.",
    );
  }

  const params = await searchParams;
  const error = getQueryValue(params.error);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">
        Choose a new password
      </h1>

      <p className="mt-2 text-sm text-slate-600">
        Enter a strong password that you have not used before.
      </p>

      <div className="mt-6">
        <AuthMessage error={error} />
      </div>

      <form action={resetPasswordAction} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            New password
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
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Confirm new password
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

        <SubmitButton pendingText="Updating password...">
          Update password
        </SubmitButton>
      </form>
    </>
  );
}