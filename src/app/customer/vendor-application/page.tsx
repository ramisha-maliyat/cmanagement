import Link from "next/link";

import { submitVendorApplicationAction } from "@/app/actions/vendors";
import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { VendorStatusBadge } from "@/components/vendor/vendor-status-badge";
import { requireRole } from "@/lib/auth/guards";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { createClient } from "@/lib/supabase/server";

type VendorApplicationPageProps = {
  searchParams: PageSearchParams;
};

export default async function VendorApplicationPage({
  searchParams,
}: VendorApplicationPageProps) {
  const { user, profile } = await requireRole("customer");

  const supabase = await createClient();

  const { data: application, error: applicationError } =
    await supabase
      .from("vendors")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

  const params = await searchParams;
  const error =
    getQueryValue(params.error) ??
    (applicationError
      ? "The vendor application could not be loaded."
      : undefined);

  const message = getQueryValue(params.message);

  const canSubmit =
    !application || application.status === "rejected";

  return (
    <>
      <div className="mb-8">
        <Link
          href="/customer"
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          ← Customer dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Become a vendor
        </h1>

        <p className="mt-2 max-w-2xl text-slate-600">
          Submit your business information. An administrator will
          review the application before you can create canteens and
          menus.
        </p>
      </div>

      <AuthMessage error={error} message={message} />

      {application && (
        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Current application
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {application.business_name}
              </h2>
            </div>

            <VendorStatusBadge status={application.status} />
          </div>

          {application.status === "pending" && (
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Your application is waiting for administrator review.
              You cannot submit another application while this one is
              pending.
            </p>
          )}

          {application.status === "rejected" && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-800">
                The application was not approved.
              </p>

              <p className="mt-2 text-sm leading-6 text-red-700">
                {application.review_notes ||
                  "No review notes were provided."}
              </p>

              <p className="mt-3 text-sm text-red-700">
                Update the form below and submit it again.
              </p>
            </div>
          )}
        </section>
      )}

      {canSubmit && (
        <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">
            {application
              ? "Update and resubmit application"
              : "Vendor information"}
          </h2>

          <form
            action={submitVendorApplicationAction}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label
                htmlFor="businessName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business name
              </label>

              <input
                id="businessName"
                name="businessName"
                required
                minLength={2}
                maxLength={150}
                defaultValue={application?.business_name ?? ""}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="slug"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business URL name
              </label>

              <input
                id="slug"
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="nazmun-canteen"
                defaultValue={application?.slug ?? ""}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Lowercase letters, numbers and hyphens only.
              </p>
            </div>

            <div>
              <label
                htmlFor="currencyCode"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Currency
              </label>

              <select
                id="currencyCode"
                name="currencyCode"
                required
                defaultValue={application?.currency_code ?? "AUD"}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="AUD">AUD — Australian Dollar</option>
                <option value="BDT">BDT — Bangladeshi Taka</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={application?.email ?? user.email ?? ""}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business phone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                maxLength={30}
                defaultValue={
                  application?.phone ?? profile.phone ?? ""
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business address
              </label>

              <textarea
                id="address"
                name="address"
                rows={3}
                maxLength={500}
                defaultValue={application?.address ?? ""}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business description
              </label>

              <textarea
                id="description"
                name="description"
                rows={5}
                maxLength={1000}
                defaultValue={application?.description ?? ""}
                placeholder="Describe the food, customers and services your canteen provides."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="md:col-span-2">
              <SubmitButton pendingText="Submitting application...">
                {application
                  ? "Resubmit application"
                  : "Submit application"}
              </SubmitButton>
            </div>
          </form>
        </section>
      )}
    </>
  );
}