import Link from "next/link";

import { createCanteenAction } from "@/app/actions/canteens";
import { AuthMessage } from "@/components/auth/auth-message";
import { CanteenForm } from "@/components/canteen/canteen-form";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { requireApprovedVendor } from "@/lib/vendor/current-vendor";

type NewCanteenPageProps = {
  searchParams: PageSearchParams;
};

export default async function NewCanteenPage({
  searchParams,
}: NewCanteenPageProps) {
  await requireApprovedVendor();

  const params = await searchParams;
  const error = getQueryValue(params.error);

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
          Add a canteen
        </h1>

        <p className="mt-2 text-slate-600">
          Enter the location and operating information for
          this canteen.
        </p>
      </div>

      <div className="mt-6">
        <AuthMessage error={error} />
      </div>

      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <CanteenForm
          action={createCanteenAction}
          submitLabel="Create canteen"
          pendingLabel="Creating canteen..."
        />
      </section>
    </>
  );
}