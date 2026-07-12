import Link from "next/link";

import { reviewVendorApplicationAction } from "@/app/actions/vendors";
import { AuthMessage } from "@/components/auth/auth-message";
import { VendorStatusBadge } from "@/components/vendor/vendor-status-badge";
import { requireRole } from "@/lib/auth/guards";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Vendor } from "@/types";

type VendorWithOwner = Vendor & {
  owner: Pick<Profile, "full_name" | "phone"> | null;
};

type AdminVendorsPageProps = {
  searchParams: PageSearchParams;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Not reviewed";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminVendorsPage({
  searchParams,
}: AdminVendorsPageProps) {
  await requireRole("admin");

  const supabase = await createClient();

  const { data, error: queryError } = await supabase
    .from("vendors")
    .select(`
      *,
      owner:profiles!vendors_owner_id_fkey(
        full_name,
        phone
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  const applications = (data ?? []) as VendorWithOwner[];

  const pendingApplications = applications.filter(
    (application) => application.status === "pending",
  );

  const reviewedApplications = applications.filter(
    (application) => application.status !== "pending",
  );

  const params = await searchParams;

  const error =
    getQueryValue(params.error) ??
    (queryError
      ? "Vendor applications could not be loaded."
      : undefined);

  const message = getQueryValue(params.message);

  return (
    <>
      <Link
        href="/admin"
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        ← Admin dashboard
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">
          Vendor applications
        </h1>

        <p className="mt-2 text-slate-600">
          Review businesses before allowing them to manage canteens
          and menus.
        </p>
      </div>

      <div className="mt-6">
        <AuthMessage error={error} message={message} />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Pending applications
          </h2>

          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
            {pendingApplications.length}
          </span>
        </div>

        {pendingApplications.length === 0 ? (
          <div className="mt-4 rounded-xl bg-white p-6 text-slate-600 shadow-sm">
            There are no pending vendor applications.
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {pendingApplications.map((application) => (
              <article
                key={application.id}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {application.business_name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Applicant:{" "}
                      {application.owner?.full_name || "Unknown user"}
                    </p>
                  </div>

                  <VendorStatusBadge status={application.status} />
                </div>

                <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-700">
                      Business email
                    </dt>
                    <dd className="mt-1 text-slate-600">
                      {application.email || "Not provided"}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-semibold text-slate-700">
                      Phone
                    </dt>
                    <dd className="mt-1 text-slate-600">
                      {application.phone ||
                        application.owner?.phone ||
                        "Not provided"}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-semibold text-slate-700">
                      Address
                    </dt>
                    <dd className="mt-1 whitespace-pre-line text-slate-600">
                      {application.address || "Not provided"}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-semibold text-slate-700">
                      Currency
                    </dt>
                    <dd className="mt-1 text-slate-600">
                      {application.currency_code}
                    </dd>
                  </div>

                  <div className="md:col-span-2">
                    <dt className="font-semibold text-slate-700">
                      Description
                    </dt>
                    <dd className="mt-1 whitespace-pre-line text-slate-600">
                      {application.description || "Not provided"}
                    </dd>
                  </div>
                </dl>

                <form
                  action={reviewVendorApplicationAction}
                  className="mt-6 border-t border-slate-200 pt-6"
                >
                  <input
                    type="hidden"
                    name="vendorId"
                    value={application.id}
                  />

                  <label
                    htmlFor={`notes-${application.id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Review notes
                  </label>

                  <textarea
                    id={`notes-${application.id}`}
                    name="reviewNotes"
                    rows={3}
                    maxLength={1000}
                    placeholder="Optional for approval; recommended when rejecting."
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      name="decision"
                      value="approved"
                      className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve vendor
                    </button>

                    <button
                      type="submit"
                      name="decision"
                      value="rejected"
                      className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
                    >
                      Reject application
                    </button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">
          Reviewed applications
        </h2>

        {reviewedApplications.length === 0 ? (
          <div className="mt-4 rounded-xl bg-white p-6 text-slate-600 shadow-sm">
            No applications have been reviewed.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="divide-y divide-slate-200">
              {reviewedApplications.map((application) => (
                <article
                  key={application.id}
                  className="p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {application.business_name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {application.owner?.full_name || "Unknown user"}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Reviewed: {formatDate(application.reviewed_at)}
                      </p>
                    </div>

                    <VendorStatusBadge status={application.status} />
                  </div>

                  {application.review_notes && (
                    <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      {application.review_notes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}