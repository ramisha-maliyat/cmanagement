import Link from "next/link";

import { changeCanteenStatusAction } from "@/app/actions/canteens";
import { AuthMessage } from "@/components/auth/auth-message";
import { CanteenStatusBadge } from "@/components/canteen/canteen-status-badge";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedVendor } from "@/lib/vendor/current-vendor";

type VendorCanteensPageProps = {
  searchParams: PageSearchParams;
};

function displayTime(value: string | null): string {
  return value ? value.slice(0, 5) : "Not set";
}

export default async function VendorCanteensPage({
  searchParams,
}: VendorCanteensPageProps) {
  const { vendor } = await requireApprovedVendor();

  const supabase = await createClient();

  const { data: canteens, error: queryError } = await supabase
    .from("canteens")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", {
      ascending: false,
    });

  const params = await searchParams;

  const error =
    getQueryValue(params.error) ??
    (queryError
      ? "The canteens could not be loaded."
      : undefined);

  const message = getQueryValue(params.message);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/vendor"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            ← Vendor dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Canteens
          </h1>

          <p className="mt-2 text-slate-600">
            Manage the locations operated by{" "}
            {vendor.business_name}.
          </p>
        </div>

        <Link
          href="/vendor/canteens/new"
          className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          Add canteen
        </Link>
      </div>

      <div className="mt-6">
        <AuthMessage
          error={error}
          message={message}
        />
      </div>

      {!canteens || canteens.length === 0 ? (
        <section className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            No canteens yet
          </h2>

          <p className="mt-2 text-slate-600">
            Create your first canteen before adding menu
            categories and food items.
          </p>

          <Link
            href="/vendor/canteens/new"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Create first canteen
          </Link>
        </section>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {canteens.map((canteen) => (
            <article
              key={canteen.id}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {canteen.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    /{canteen.slug}
                  </p>
                </div>

                <CanteenStatusBadge
                  isActive={canteen.is_active}
                />
              </div>

              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-700">
                    Opening time
                  </dt>

                  <dd className="mt-1 text-slate-600">
                    {displayTime(canteen.opening_time)}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-700">
                    Closing time
                  </dt>

                  <dd className="mt-1 text-slate-600">
                    {displayTime(canteen.closing_time)}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="font-semibold text-slate-700">
                    Location
                  </dt>

                  <dd className="mt-1 whitespace-pre-line text-slate-600">
                    {canteen.location || "Not provided"}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="font-semibold text-slate-700">
                    Timezone
                  </dt>

                  <dd className="mt-1 text-slate-600">
                    {canteen.timezone}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                <Link
                  href={`/vendor/canteens/${canteen.id}/edit`}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </Link>

                <form action={changeCanteenStatusAction}>
                  <input
                    type="hidden"
                    name="canteenId"
                    value={canteen.id}
                  />

                  <input
                    type="hidden"
                    name="nextStatus"
                    value={
                      canteen.is_active
                        ? "inactive"
                        : "active"
                    }
                  />

                  <button
                    type="submit"
                    className={
                      canteen.is_active
                        ? "w-full rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        : "w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    }
                  >
                    {canteen.is_active
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}