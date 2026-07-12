import Link from "next/link";

import { createMenuCategoryAction } from "@/app/actions/menu";
import { AuthMessage } from "@/components/auth/auth-message";
import { MenuCategoryForm } from "@/components/menu/menu-category-form";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { requireVendorCanteen } from "@/lib/vendor/vendor-canteen";

type NewCategoryPageProps = {
  params: Promise<{
    canteenId: string;
  }>;

  searchParams: PageSearchParams;
};

export default async function NewCategoryPage({
  params,
  searchParams,
}: NewCategoryPageProps) {
  const { canteenId } = await params;

  const { canteen } =
    await requireVendorCanteen(canteenId);

  const query = await searchParams;
  const error = getQueryValue(query.error);

  return (
    <>
      <Link
        href={`/vendor/canteens/${canteen.id}/menu`}
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        ← {canteen.name} menu
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">
          Add menu category
        </h1>

        <p className="mt-2 text-slate-600">
          Create a category such as Breakfast, Lunch,
          Snacks or Drinks.
        </p>
      </div>

      <div className="mt-6">
        <AuthMessage error={error} />
      </div>

      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <MenuCategoryForm
          action={createMenuCategoryAction}
          canteenId={canteen.id}
          submitLabel="Create category"
          pendingLabel="Creating category..."
        />
      </section>
    </>
  );
}