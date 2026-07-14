"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  createOrderAction,
} from "@/app/actions/orders";
import {
  useCart,
} from "@/features/cart/cart-provider";

type CheckoutClientProps = {
  defaultName: string;
  defaultPhone: string;
};

function formatPrice(
  value: number,
  currencyCode: string,
): string {
  return new Intl.NumberFormat(
    "en-AU",
    {
      style: "currency",
      currency: currencyCode,
    },
  ).format(value);
}

function toDateTimeLocal(
  date: Date,
): string {
  const timezoneOffset =
    date.getTimezoneOffset() * 60_000;

  return new Date(
    date.getTime() - timezoneOffset,
  )
    .toISOString()
    .slice(0, 16);
}

export function CheckoutClient({
  defaultName,
  defaultPhone,
}: CheckoutClientProps) {
  const router = useRouter();

  const {
    cart,
    hydrated,
    subtotal,
    clearCart,
  } = useCart();

  const [
    customerName,
    setCustomerName,
  ] = useState(defaultName);

  const [
    customerPhone,
    setCustomerPhone,
  ] = useState(defaultPhone);

  const [
    pickupTime,
    setPickupTime,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  useEffect(() => {
    const defaultPickup =
      new Date(
        Date.now() +
        30 * 60 * 1000,
      );

    setPickupTime(
      toDateTimeLocal(
        defaultPickup,
      ),
    );
  }, []);

  if (!hydrated) {
    return (
      <section className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">
          Loading checkout...
        </p>
      </section>
    );
  }

  if (
    !cart ||
    cart.items.length === 0
  ) {
    return (
      <section className="rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Your cart is empty
        </h1>

        <p className="mt-2 text-slate-600">
          Add menu items before checking out.
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

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!cart) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    let pickupIso: string;

    try {
      pickupIso =
        new Date(
          pickupTime,
        ).toISOString();
    } catch {
      setError(
        "Enter a valid pickup time.",
      );

      setIsSubmitting(false);
      return;
    }

    try {
      const result =
        await createOrderAction({
          canteenId:
            cart.canteenId,

          customerName,
          customerPhone,
          pickupTime:
            pickupIso,

          notes,
          paymentMethod:
            "cash",

          items:
            cart.items.map(
              (item) => ({
                menuItemId:
                  item.menuItemId,

                quantity:
                  item.quantity,
              }),
            ),
        });

      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      clearCart();

      router.push(
        `/customer/orders/${result.orderId}?created=1`,
      );

      router.refresh();
    } catch (submissionError) {
      console.error(
        "Checkout error:",
        submissionError,
      );

      setError(
        "The checkout request failed. Try again.",
      );

      setIsSubmitting(false);
    }
  }

  const minimumPickupTime =
    toDateTimeLocal(
      new Date(
        Date.now() + 5 * 60 * 1000,
      ),
    );

  return (
    <>
      <div>
        <Link
          href="/cart"
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          ← Cart
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Checkout
        </h1>

        <p className="mt-2 text-slate-600">
          {cart.vendorName} ·{" "}
          {cart.canteenName}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]"
      >
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Collection details
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="customerName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Customer name
              </label>

              <input
                id="customerName"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(
                    event.target.value,
                  )
                }
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="customerPhone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone number
              </label>

              <input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(event) =>
                  setCustomerPhone(
                    event.target.value,
                  )
                }
                maxLength={30}
                autoComplete="tel"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="pickupTime"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Pickup time
              </label>

              <input
                id="pickupTime"
                type="datetime-local"
                value={pickupTime}
                min={minimumPickupTime}
                onChange={(event) =>
                  setPickupTime(
                    event.target.value,
                  )
                }
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Order notes
              </label>

              <textarea
                id="notes"
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                rows={4}
                maxLength={500}
                placeholder="Example: No onion or less spicy."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Order summary
          </h2>

          <div className="mt-5 space-y-4">
            {cart.items.map(
              (item) => (
                <div
                  key={item.menuItemId}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span className="text-slate-600">
                    {item.quantity} ×{" "}
                    {item.name}
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatPrice(
                      item.price *
                        item.quantity,
                      cart.currencyCode,
                    )}
                  </span>
                </div>
              ),
            )}
          </div>

          <div className="mt-5 flex justify-between border-t border-slate-200 pt-5">
            <span className="font-semibold text-slate-700">
              Estimated subtotal
            </span>

            <span className="text-lg font-bold text-slate-900">
              {formatPrice(
                subtotal,
                cart.currencyCode,
              )}
            </span>
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">
              Payment method
            </p>

            <p className="mt-1">
              Cash on collection
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            The server will check current prices,
            availability and stock before creating
            the order.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 w-full rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Placing order..."
              : "Place order"}
          </button>
        </aside>
      </form>
    </>
  );
}