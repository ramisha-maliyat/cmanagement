import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCanteenAction } from "@/app/actions/canteens";
import { AuthMessage } from "@/components/auth/auth-message";
import { CanteenForm } from "@/components/canteen/canteen-form";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedVendor } from "@/lib/vendor/current-vendor";

type EditCanteenPageProps = {
  params: Promise<{
    canteenId: string;
  }>;

  searchParams: PageSearchParams;
};

export default async function EditCanteenPage({
  params,
  searchParams,
}: EditCanteenPageProps) {
  const { vendor } = await requireApprovedVendor();

  const { canteenId } = await params;

  const supabase = await createClient();

  const { data: canteen, error: queryError } =
    await supabase
      .from("canteens")
      .select("*")
      .eq("id", canteenId)
      .eq("vendor_id", vendor.id)
      .maybeSingle();

  if (!queryError && !canteen) {
    notFound();
  }

  const query = await searchParams;

  const error =
    getQueryValue(query.error) ??
    (queryError
      ? "The canteen could not be loaded."
      : undefined);

  if (!canteen) {
    return (
      <>
        <Link
          href="/vendor/canteens"
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          ← Canteens
        </Link>

        <div className="mt-6">
          <AuthMessage error={error} />
        </div>
      </>
    );
  }

  return (
    <>
      <Link
        href="/vendor/canteens"
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        ← Canteens
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">
          Edit {canteen.name}
        </h1>

        <p className="mt-2 text-slate-600">
          Update this canteen’s location and operating
          information.
        </p>
      </div>

      <div className="mt-6">
        <AuthMessage error={error} />
      </div>

      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <CanteenForm
          action={updateCanteenAction}
          canteen={canteen}
          submitLabel="Save changes"
          pendingLabel="Saving changes..."
        />
      </section>
    </>
  );
}