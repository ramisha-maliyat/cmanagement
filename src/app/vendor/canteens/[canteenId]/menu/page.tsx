import Link from "next/link";

import {
  changeMenuCategoryStatusAction,
  changeMenuItemAvailabilityAction,
} from "@/app/actions/menu";
import { AuthMessage } from "@/components/auth/auth-message";
import { MenuStatusBadge } from "@/components/menu/menu-status-badge";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { createClient } from "@/lib/supabase/server";
import { requireVendorCanteen } from "@/lib/vendor/vendor-canteen";

type VendorMenuPageProps = {
  params: Promise<{
    canteenId: string;
  }>;

  searchParams: PageSearchParams;
};

function formatPrice(
  value: number,
  currencyCode: string,
): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currencyCode,
  }).format(value);
}

export default async function VendorMenuPage({
  params,
  searchParams,
}: VendorMenuPageProps) {
  const { canteenId } = await params;

  const { vendor, canteen } =
    await requireVendorCanteen(canteenId);

  const supabase = await createClient();

  const [
    categoriesResult,
    itemsResult,
  ] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("vendor_id", vendor.id)
      .eq("canteen_id", canteen.id)
      .order("display_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: true,
      }),

    supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", vendor.id)
      .eq("canteen_id", canteen.id)
      .order("name", {
        ascending: true,
      }),
  ]);

  const categories =
    categoriesResult.data ?? [];

  const items =
    itemsResult.data ?? [];

  const query = await searchParams;

  const error =
    getQueryValue(query.error) ??
    (categoriesResult.error || itemsResult.error
      ? "The menu could not be loaded."
      : undefined);

  const message =
    getQueryValue(query.message);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/vendor/canteens"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            ← Canteens
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            {canteen.name} menu
          </h1>

          <p className="mt-2 text-slate-600">
            Manage menu categories, prices, stock and
            item availability.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/vendor/canteens/${canteen.id}/menu/categories/new`}
            className="rounded-lg border border-emerald-600 px-5 py-3 text-center font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Add category
          </Link>

          {categories.length > 0 && (
            <Link
              href={`/vendor/canteens/${canteen.id}/menu/items/new`}
              className="rounded-lg bg-emerald-600 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-700"
            >
              Add menu item
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6">
        <AuthMessage
          error={error}
          message={message}
        />
      </div>

      {categories.length === 0 ? (
        <section className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Create your first menu category
          </h2>

          <p className="mt-2 text-slate-600">
            Categories help organise items into groups such
            as Breakfast, Lunch, Drinks and Snacks.
          </p>

          <Link
            href={`/vendor/canteens/${canteen.id}/menu/categories/new`}
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Add first category
          </Link>
        </section>
      ) : (
        <div className="mt-8 space-y-6">
          {categories.map((category) => {
            const categoryItems = items.filter(
              (item) =>
                item.category_id === category.id,
            );

            return (
              <section
                key={category.id}
                className="overflow-hidden rounded-xl bg-white shadow-sm"
              >
                <header className="border-b border-slate-200 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-900">
                          {category.name}
                        </h2>

                        <MenuStatusBadge
                          active={category.is_active}
                        />
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Display order:{" "}
                        {category.display_order}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/vendor/canteens/${canteen.id}/menu/items/new?categoryId=${category.id}`}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Add item
                      </Link>

                      <Link
                        href={`/vendor/canteens/${canteen.id}/menu/categories/${category.id}/edit`}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit category
                      </Link>

                      <form
                        action={
                          changeMenuCategoryStatusAction
                        }
                      >
                        <input
                          type="hidden"
                          name="canteenId"
                          value={canteen.id}
                        />

                        <input
                          type="hidden"
                          name="categoryId"
                          value={category.id}
                        />

                        <input
                          type="hidden"
                          name="nextStatus"
                          value={
                            category.is_active
                              ? "inactive"
                              : "active"
                          }
                        />

                        <button
                          type="submit"
                          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          {category.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </form>
                    </div>
                  </div>
                </header>

                {categoryItems.length === 0 ? (
                  <div className="p-6 text-sm text-slate-600">
                    No items have been added to this
                    category.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {categoryItems.map((item) => (
                      <article
                        key={item.id}
                        className="p-5 sm:p-6"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row">
                          <div className="flex gap-4">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt=""
                                className="h-20 w-20 rounded-lg object-cover"
                              />
                            )}

                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="font-bold text-slate-900">
                                  {item.name}
                                </h3>

                                <MenuStatusBadge
                                  active={item.is_available}
                                  activeText="Available"
                                  inactiveText="Unavailable"
                                />
                              </div>

                              <p className="mt-2 font-semibold text-emerald-700">
                                {formatPrice(
                                  item.price,
                                  vendor.currency_code,
                                )}
                              </p>

                              <p className="mt-2 text-sm text-slate-600">
                                Preparation:{" "}
                                {item.preparation_minutes}{" "}
                                minutes
                              </p>

                              <p className="mt-1 text-sm text-slate-600">
                                {item.track_stock
                                  ? `Stock: ${item.stock_quantity}`
                                  : "Stock tracking disabled"}
                              </p>

                              {item.description && (
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-start gap-3">
                            <Link
                              href={`/vendor/canteens/${canteen.id}/menu/items/${item.id}/edit`}
                              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </Link>

                            <form
                              action={
                                changeMenuItemAvailabilityAction
                              }
                            >
                              <input
                                type="hidden"
                                name="canteenId"
                                value={canteen.id}
                              />

                              <input
                                type="hidden"
                                name="menuItemId"
                                value={item.id}
                              />

                              <input
                                type="hidden"
                                name="nextStatus"
                                value={
                                  item.is_available
                                    ? "unavailable"
                                    : "available"
                                }
                              />

                              <button
                                type="submit"
                                className={
                                  item.is_available
                                    ? "rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                    : "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                }
                              >
                                {item.is_available
                                  ? "Mark unavailable"
                                  : "Make available"}
                              </button>
                            </form>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}