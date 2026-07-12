"use client";

import { useMemo, useState } from "react";

import { useCart } from "@/features/cart/cart-provider";
import type {
  Canteen,
  MenuCategory,
  MenuItem,
  Vendor,
} from "@/types";
import type { CartItemInput } from "@/types/cart";

type PublicMenuBrowserProps = {
  vendor: Vendor;
  canteen: Canteen;
  categories: MenuCategory[];
  items: MenuItem[];
};

function formatPrice(
  value: number | string,
  currencyCode: string,
): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(value));
}

export function PublicMenuBrowser({
  vendor,
  canteen,
  categories,
  items,
}: PublicMenuBrowserProps) {
  const {
    cart,
    addItem,
  } = useCart();

  const [selectedCategoryId, setSelectedCategoryId] =
    useState("all");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [notice, setNotice] =
    useState<string | null>(null);

  const categoryNameMap = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          category.name,
        ]),
      ),
    [categories],
  );

  const filteredItems = useMemo(() => {
    const normalisedSearch =
      searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory =
        selectedCategoryId === "all" ||
        item.category_id ===
          selectedCategoryId;

      const matchesSearch =
        normalisedSearch.length === 0 ||
        item.name
          .toLowerCase()
          .includes(normalisedSearch) ||
        item.description
          ?.toLowerCase()
          .includes(normalisedSearch);

      return (
        matchesCategory &&
        Boolean(matchesSearch)
      );
    });
  }, [
    items,
    searchTerm,
    selectedCategoryId,
  ]);

  function createCartItem(
    item: MenuItem,
  ): CartItemInput {
    return {
      menuItemId: item.id,

      vendorId: vendor.id,
      vendorName: vendor.business_name,
      vendorSlug: vendor.slug,

      canteenId: canteen.id,
      canteenName: canteen.name,
      canteenSlug: canteen.slug,

      categoryId: item.category_id,

      name: item.name,
      price: Number(item.price),
      imageUrl: item.image_url,
      preparationMinutes:
        item.preparation_minutes,

      trackStock: item.track_stock,
      stockQuantity: item.stock_quantity,

      currencyCode: vendor.currency_code,
    };
  }

  function handleAddItem(
    item: MenuItem,
  ): void {
    const cartItem = createCartItem(item);

    const result = addItem(cartItem);

    if (result === "different-canteen") {
      const shouldReplace = window.confirm(
        "Your cart contains items from another canteen. Replace the existing cart?",
      );

      if (!shouldReplace) {
        return;
      }

      addItem(cartItem, {
        replaceExisting: true,
      });

      setNotice(
        `${item.name} was added. Your previous cart was replaced.`,
      );

      return;
    }

    setNotice(
      `${item.name} was added to your cart.`,
    );
  }

  return (
    <>
      <section className="mt-8 rounded-xl bg-white p-5 shadow-sm">
        <label
          htmlFor="menu-search"
          className="block text-sm font-semibold text-slate-700"
        >
          Search menu
        </label>

        <input
          id="menu-search"
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          placeholder="Search food or drinks..."
          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setSelectedCategoryId("all")
            }
            className={
              selectedCategoryId === "all"
                ? "rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            }
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                setSelectedCategoryId(
                  category.id,
                )
              }
              className={
                selectedCategoryId ===
                category.id
                  ? "rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              }
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {notice && (
        <div
          role="status"
          className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <section className="mt-6 rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">
            No menu items match your search.
          </p>
        </section>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const quantityInCart =
              cart?.items.find(
                (cartItem) =>
                  cartItem.menuItemId ===
                  item.id,
              )?.quantity ?? 0;

            return (
              <article
                key={item.id}
                className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm"
              >
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-200 text-sm text-slate-500">
                    No image
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    {categoryNameMap.get(
                      item.category_id,
                    ) ?? "Menu item"}
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    {item.name}
                  </h2>

                  {item.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-lg font-bold text-emerald-700">
                      {formatPrice(
                        item.price,
                        vendor.currency_code,
                      )}
                    </p>

                    <p className="text-xs text-slate-500">
                      {item.preparation_minutes} min
                    </p>
                  </div>

                  {item.track_stock && (
                    <p className="mt-2 text-xs text-slate-500">
                      {item.stock_quantity} available
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleAddItem(item)
                    }
                    disabled={
                      item.track_stock &&
                      quantityInCart >=
                        item.stock_quantity
                    }
                    className="mt-5 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {quantityInCart > 0
                      ? `Add another (${quantityInCart} in cart)`
                      : "Add to cart"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}