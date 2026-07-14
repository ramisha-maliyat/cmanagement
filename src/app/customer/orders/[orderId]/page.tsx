import Link from "next/link";

import {
  OrderStatusBadge,
} from "@/components/order/order-status-badge";
import {
  requireRole,
} from "@/lib/auth/guards";
import {
  createClient,
} from "@/lib/supabase/server";

function formatPrice(
  value: number | string,
  currencyCode: string,
): string {
  return new Intl.NumberFormat(
    "en-AU",
    {
      style: "currency",
      currency: currencyCode,
    },
  ).format(Number(value));
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "en-AU",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export default async function CustomerOrdersPage() {
  const { user } =
    await requireRole("customer");

  const supabase =
    await createClient();

  const { data: orders, error } =
    await supabase
      .from("orders")
      .select("*")
      .eq(
        "customer_id",
        user.id,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

  return (
    <>
      <Link
        href="/customer"
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        ← Customer dashboard
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">
          My orders
        </h1>

        <p className="mt-2 text-slate-600">
          View current and previous canteen
          orders.
        </p>
      </div>

      {error && (
        <section className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Your orders could not be loaded.
        </section>
      )}

      {!error &&
      (!orders ||
        orders.length === 0) ? (
        <section className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            No orders yet
          </h2>

          <p className="mt-2 text-slate-600">
            Browse a canteen and place your
            first order.
          </p>

          <Link
            href="/vendors"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Browse canteens
          </Link>
        </section>
      ) : (
        <div className="mt-8 space-y-4">
          {orders?.map((order) => (
            <Link
              key={order.id}
              href={`/customer/orders/${order.id}`}
              className="block rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    {order.order_number}
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {order.vendor_name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {order.canteen_name}
                  </p>
                </div>

                <OrderStatusBadge
                  status={order.status}
                />
              </div>

              <div className="mt-5 flex flex-wrap justify-between gap-4 border-t border-slate-200 pt-4 text-sm">
                <span className="text-slate-500">
                  {formatDate(
                    order.created_at,
                  )}
                </span>

                <span className="font-bold text-slate-900">
                  {formatPrice(
                    order.total_amount,
                    order.currency_code,
                  )}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}