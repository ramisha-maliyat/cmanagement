import Link from "next/link";
import { notFound } from "next/navigation";

import { updateMenuItemAction } from "@/app/actions/menu";
import { AuthMessage } from "@/components/auth/auth-message";
import { MenuItemForm } from "@/components/menu/menu-item-form";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { createClient } from "@/lib/supabase/server";
import { requireVendorCanteen } from "@/lib/vendor/vendor-canteen";

type EditMenuItemPageProps = {
  params: Promise<{
    canteenId: string;
    menuItemId: string;
  }>;

  searchParams: PageSearchParams;
};

export default async function EditMenuItemPage({
  params,
  searchParams,
}: EditMenuItemPageProps) {
  const {
    canteenId,
    menuItemId,
  } = await params;

  const { vendor, canteen } =
    await requireVendorCanteen(canteenId);

  const supabase = await createClient();

  const [
    itemResult,
    categoriesResult,
  ] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*")
      .eq("id", menuItemId)
      .eq("canteen_id", canteen.id)
      .eq("vendor_id", vendor.id)
      .maybeSingle(),

    supabase
      .from("menu_categories")
      .select("*")
      .eq("canteen_id", canteen.id)
      .eq("vendor_id", vendor.id)
      .order("display_order", {
        ascending: true,
      }),
  ]);

  if (!itemResult.error && !itemResult.data) {
    notFound();
  }

  const query = await searchParams;

  const error =
    getQueryValue(query.error) ??
    (itemResult.error || categoriesResult.error
      ? "The menu item could not be loaded."
      : undefined);

  const menuItem = itemResult.data;
  const categories = categoriesResult.data ?? [];

  if (!menuItem) {
    return (
      <AuthMessage error={error} />
    );
  }

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
          Edit {menuItem.name}
        </h1>
      </div>

      <div className="mt-6">
        <AuthMessage error={error} />
      </div>

      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <MenuItemForm
          action={updateMenuItemAction}
          canteenId={canteen.id}
          categories={categories}
          menuItem={menuItem}
          submitLabel="Save menu item"
          pendingLabel="Saving menu item..."
        />
      </section>
    </>
  );
}