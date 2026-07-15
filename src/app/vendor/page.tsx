import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireApprovedVendor } from "@/lib/vendor/current-vendor";

export default async function VendorDashboardPage() {
  const { vendor } =
    await requireApprovedVendor();

  const supabase =
    await createClient();

  const [
    pendingResult,
    activeResult,
    totalResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "vendor_id",
        vendor.id,
      )
      .eq(
        "status",
        "pending",
      ),

    supabase
      .from("orders")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "vendor_id",
        vendor.id,
      )
      .in(
        "status",
        [
          "accepted",
          "preparing",
          "ready",
        ],
      ),

    supabase
      .from("orders")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "vendor_id",
        vendor.id,
      ),
  ]);

  const pendingCount =
    pendingResult.count ?? 0;

  const activeCount =
    activeResult.count ?? 0;

  const totalCount =
    totalResult.count ?? 0;

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900">
        {vendor.business_name}
      </h1>

      <p className="mt-2 text-slate-600">
        Manage your canteens, menus and customer
        orders.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Pending orders
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-700">
            {pendingCount}
          </p>

          <Link
            href="/vendor/orders?status=pending"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            Review pending orders →
          </Link>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Active orders
          </p>

          <p className="mt-2 text-3xl font-bold text-purple-700">
            {activeCount}
          </p>

          <Link
            href="/vendor/orders"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            Manage active orders →
          </Link>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total orders
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {totalCount}
          </p>

          <Link
            href="/vendor/orders"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            View all orders →
          </Link>
        </section>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Canteens
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Create and manage your business
            locations.
          </p>

          <Link
            href="/vendor/canteens"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            Manage canteens →
          </Link>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Customer orders
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Accept, prepare and complete incoming
            customer orders.
          </p>

          <Link
            href="/vendor/orders"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            View orders →
          </Link>
        </section>
      </div>

      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Business details
        </h2>

        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-700">
              Business email
            </dt>

            <dd className="mt-1 text-slate-600">
              {vendor.email ||
                "Not provided"}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-slate-700">
              Currency
            </dt>

            <dd className="mt-1 text-slate-600">
              {vendor.currency_code}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-slate-700">
              Phone
            </dt>

            <dd className="mt-1 text-slate-600">
              {vendor.phone ||
                "Not provided"}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-slate-700">
              Status
            </dt>

            <dd className="mt-1 capitalize text-slate-600">
              {vendor.status}
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}