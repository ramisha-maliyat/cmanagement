import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/layout/public-shell";
import { createClient } from "@/lib/supabase/server";

type VendorPublicPageProps = {
  params: Promise<{
    vendorSlug: string;
  }>;
};

function displayTime(
  value: string | null,
): string {
  return value
    ? value.slice(0, 5)
    : "Not specified";
}

export default async function VendorPublicPage({
  params,
}: VendorPublicPageProps) {
  const { vendorSlug } = await params;

  const supabase = await createClient();

  const { data: vendor, error: vendorError } =
    await supabase
      .from("vendors")
      .select("*")
      .eq("slug", vendorSlug)
      .eq("status", "approved")
      .maybeSingle();

  if (vendorError || !vendor) {
    notFound();
  }

  const {
    data: canteens,
    error: canteensError,
  } = await supabase
    .from("canteens")
    .select("*")
    .eq("vendor_id", vendor.id)
    .eq("is_active", true)
    .order("name", {
      ascending: true,
    });

  return (
    <PublicShell>
      <Link
        href="/vendors"
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        ← All vendors
      </Link>

      <section className="mt-5 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {vendor.business_name}
        </h1>

        {vendor.description && (
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            {vendor.description}
          </p>
        )}

        {vendor.address && (
          <p className="mt-4 text-sm text-slate-500">
            {vendor.address}
          </p>
        )}
      </section>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Active canteens
        </h2>
      </div>

      {canteensError && (
        <section className="mt-5 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          The canteens could not be loaded.
        </section>
      )}

      {!canteensError &&
      (!canteens ||
        canteens.length === 0) ? (
        <section className="mt-5 rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">
            This vendor does not currently have an
            active canteen.
          </p>
        </section>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {canteens?.map((canteen) => (
            <article
              key={canteen.id}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-slate-900">
                {canteen.name}
              </h3>

              {canteen.location && (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-600">
                  {canteen.location}
                </p>
              )}

              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-700">
                    Opens
                  </dt>

                  <dd className="mt-1 text-slate-600">
                    {displayTime(
                      canteen.opening_time,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-700">
                    Closes
                  </dt>

                  <dd className="mt-1 text-slate-600">
                    {displayTime(
                      canteen.closing_time,
                    )}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/vendors/${vendor.slug}/canteens/${canteen.slug}`}
                className="mt-6 block rounded-lg bg-emerald-600 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-700"
              >
                View menu
              </Link>
            </article>
          ))}
        </div>
      )}
    </PublicShell>
  );
}