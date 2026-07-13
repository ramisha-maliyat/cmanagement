import Link from "next/link";

import { PublicShell } from "@/components/layout/public-shell";
import { createClient } from "@/lib/supabase/server";

export default async function VendorsPage() {
  const supabase = await createClient();

  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("status", "approved")
    .order("business_name", {
      ascending: true,
    });

  return (
    <PublicShell>
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Available vendors
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Browse canteens
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          Choose a vendor to view its active canteens and current
          menus.
        </p>
      </div>

      {error && (
        <section className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          The vendor list could not be loaded.
        </section>
      )}

      {!error && (!vendors || vendors.length === 0) ? (
        <section className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            No vendors available
          </h2>

          <p className="mt-2 text-slate-600">
            Approved vendors will appear here.
          </p>
        </section>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {vendors?.map((vendor) => (
            <article
              key={vendor.id}
              className="flex flex-col rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {vendor.business_name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {vendor.currency_code}
                </p>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {vendor.description ||
                    "Food and drink services available through CManagement."}
                </p>

                {vendor.address && (
                  <p className="mt-4 text-sm text-slate-500">
                    {vendor.address}
                  </p>
                )}
              </div>

              <Link
                href={`/vendors/${vendor.slug}`}
                className="mt-6 block rounded-lg bg-emerald-600 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-700"
              >
                View canteens
              </Link>
            </article>
          ))}
        </div>
      )}
    </PublicShell>
  );
}