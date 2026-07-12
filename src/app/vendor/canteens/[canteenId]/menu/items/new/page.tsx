import Link from "next/link";

import { createMenuItemAction } from "@/app/actions/menu";
import { AuthMessage } from "@/components/auth/auth-message";
import { MenuItemForm } from "@/components/menu/menu-item-form";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { createClient } from "@/lib/supabase/server";
import { requireVendorCanteen } from "@/lib/vendor/vendor-canteen";

type NewMenuItemPageProps = {
  params: Promise<{
    canteenId: string;
  }>;

  searchParams: PageSearchParams;
};

export default async function NewMenuItemPage({
  params,
  searchParams,
}: NewMenuItemPageProps) {
  const { canteenId } = await params;

  const { vendor, canteen } =
    await requireVendorCanteen(canteenId);

  const supabase = await createClient();

  const { data: categories, error: queryError } =
    await supabase
      .from("menu_categories")
      .select("*")
      .eq("vendor_id", vendor.id)
      .eq("canteen_id", canteen.id)
      .order("display_order", {
        ascending: true,
      });

  const query = await searchParams;

  const error =
    getQueryValue(query.error) ??
    (queryError
      ? "Menu categories could not be loaded."
      : undefined);

  const defaultCategoryId =
    getQueryValue(query.categoryId);

  const categoryList = categories ?? [];

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
          Add menu item
        </h1>

        <p className="mt-2 text-slate-600">
          Add food or drink information, price,
          preparation time and stock.
        </p>
      </div>

      <div className="mt-6">
        <AuthMessage error={error} />
      </div>

      {categoryList.length === 0 ? (
        <section className="mt-6 rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            A category is required
          </h2>

          <p className="mt-2 text-slate-600">
            Create a menu category before adding food
            or drink items.
          </p>

          <Link
            href={`/vendor/canteens/${canteen.id}/menu/categories/new`}
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Create category
          </Link>
        </section>
      ) : (
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <MenuItemForm
            action={createMenuItemAction}
            canteenId={canteen.id}
            categories={categoryList}
            defaultCategoryId={defaultCategoryId}
            submitLabel="Create menu item"
            pendingLabel="Creating menu item..."
          />
        </section>
      )}
    </>
  );
}