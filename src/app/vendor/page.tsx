import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function VendorDashboardPage() {
  const { user } = await requireRole("vendor");

  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !vendor) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-bold text-red-800">
          Vendor record unavailable
        </h1>

        <p className="mt-2 text-red-700">
          Your account has the vendor role, but the associated vendor
          business could not be loaded.
        </p>
      </section>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900">
        {vendor.business_name}
      </h1>

      <p className="mt-2 text-slate-600">
        Manage your canteens, menu items and customer orders.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm">
  <h2 className="font-semibold text-slate-900">
    Canteens
  </h2>

  <p className="mt-2 text-sm text-slate-600">
    Create and manage your business locations.
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
            Menu items
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Menu management will be added after canteen setup.
          </p>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            New orders
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            There are currently no new orders.
          </p>
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
              {vendor.email || "Not provided"}
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
              {vendor.phone || "Not provided"}
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