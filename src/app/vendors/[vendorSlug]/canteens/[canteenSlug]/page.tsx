import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/layout/public-shell";
import { PublicMenuBrowser } from "@/components/menu/public-menu-browser";
import { createClient } from "@/lib/supabase/server";

type PublicCanteenMenuPageProps = {
  params: Promise<{
    vendorSlug: string;
    canteenSlug: string;
  }>;
};

export default async function PublicCanteenMenuPage({
  params,
}: PublicCanteenMenuPageProps) {
  const {
    vendorSlug,
    canteenSlug,
  } = await params;

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
    data: canteen,
    error: canteenError,
  } = await supabase
    .from("canteens")
    .select("*")
    .eq("vendor_id", vendor.id)
    .eq("slug", canteenSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (canteenError || !canteen) {
    notFound();
  }

  const [
    categoriesResult,
    itemsResult,
  ] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("vendor_id", vendor.id)
      .eq("canteen_id", canteen.id)
      .eq("is_active", true)
      .order("display_order", {
        ascending: true,
      }),

    supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", vendor.id)
      .eq("canteen_id", canteen.id)
      .eq("is_available", true)
      .or(
        "track_stock.eq.false,stock_quantity.gt.0",
      )
      .order("name", {
        ascending: true,
      }),
  ]);

  const categories =
    categoriesResult.data ?? [];

  const activeCategoryIds =
    new Set(
      categories.map(
        (category) => category.id,
      ),
    );

  const items =
    (itemsResult.data ?? []).filter(
      (item) =>
        activeCategoryIds.has(
          item.category_id,
        ),
    );

  const queryError =
    categoriesResult.error ||
    itemsResult.error;

  return (
    <PublicShell>
      <Link
        href={`/vendors/${vendor.slug}`}
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        ← {vendor.business_name}
      </Link>

      <section className="mt-5 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          {vendor.business_name}
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {canteen.name}
        </h1>

        {canteen.description && (
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            {canteen.description}
          </p>
        )}

        {canteen.location && (
          <p className="mt-4 text-sm text-slate-500">
            {canteen.location}
          </p>
        )}
      </section>

      {queryError ? (
        <section className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          The menu could not be loaded.
        </section>
      ) : categories.length === 0 ? (
        <section className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Menu unavailable
          </h2>

          <p className="mt-2 text-slate-600">
            This canteen has not published an
            active menu yet.
          </p>
        </section>
      ) : (
        <PublicMenuBrowser
          vendor={vendor}
          canteen={canteen}
          categories={categories}
          items={items}
        />
      )}
    </PublicShell>
  );
}