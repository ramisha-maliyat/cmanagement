"use client";

import Link from "next/link";

import { useCart } from "@/features/cart/cart-provider";

function formatPrice(
  value: number,
  currencyCode: string,
): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currencyCode,
  }).format(value);
}

export function CartPageClient() {
  const {
    cart,
    hydrated,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (!hydrated) {
    return (
      <section className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">
          Loading your cart...
        </p>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <section className="rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Your cart is empty
        </h1>

        <p className="mt-2 text-slate-600">
          Browse available canteens and add food or drinks.
        </p>

        <Link
          href="/vendors"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          Browse canteens
        </Link>
      </section>
    );
  }

  const menuHref =
    `/vendors/${cart.vendorSlug}` +
    `/canteens/${cart.canteenSlug}`;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Your cart
          </h1>

          <p className="mt-2 text-slate-600">
            {cart.vendorName} · {cart.canteenName}
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Clear cart
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="divide-y divide-slate-200">
            {cart.items.map((item) => {
              const maximumReached =
                item.trackStock &&
                item.quantity >= item.stockQuantity;

              return (
                <article
                  key={item.menuItemId}
                  className="p-5 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <h2 className="font-bold text-slate-900">
                        {item.name}
                      </h2>

                      <p className="mt-1 text-sm text-emerald-700">
                        {formatPrice(
                          item.price,
                          cart.currencyCode,
                        )}{" "}
                        each
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.menuItemId)
                      }
                      className="text-sm font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center rounded-lg border border-slate-300">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.menuItemId,
                            item.quantity - 1,
                          )
                        }
                        className="px-4 py-2 text-lg hover:bg-slate-50"
                      >
                        −
                      </button>

                      <span className="min-w-10 text-center font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        disabled={maximumReached}
                        onClick={() =>
                          updateQuantity(
                            item.menuItemId,
                            item.quantity + 1,
                          )
                        }
                        className="px-4 py-2 text-lg hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        +
                      </button>
                    </div>

                    <p className="font-bold text-slate-900">
                      {formatPrice(
                        item.price * item.quantity,
                        cart.currencyCode,
                      )}
                    </p>
                  </div>

                  {maximumReached && (
                    <p className="mt-2 text-xs text-amber-700">
                      Maximum available stock reached.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Order summary
          </h2>

          <div className="mt-5 flex justify-between border-b border-slate-200 pb-4">
            <span className="text-slate-600">
              Subtotal
            </span>

            <span className="font-bold text-slate-900">
              {formatPrice(
                subtotal,
                cart.currencyCode,
              )}
            </span>
          </div>

          <button
            type="button"
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-lg bg-slate-300 px-5 py-3 font-semibold text-white"
          >
            Checkout available in Phase 9
          </button>

          <Link
            href={menuHref}
            className="mt-3 block rounded-lg border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </>
  );
}