import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthMessage } from "@/components/auth/auth-message";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { OrdersRefreshButton } from "@/components/order/orders-refresh-button";
import { VendorOrderActions } from "@/components/order/vendor-order-actions";
import {
  getQueryValue,
  type PageSearchParams,
} from "@/lib/query-params";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedVendor } from "@/lib/vendor/current-vendor";

type VendorOrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;

  searchParams: PageSearchParams;
};

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
  value: string | null,
): string {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export default async function VendorOrderPage({
  params,
  searchParams,
}: VendorOrderPageProps) {
  const { orderId } =
    await params;

  const { vendor } =
    await requireApprovedVendor();

  const supabase =
    await createClient();

  const { data: order, error: orderError } =
    await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq(
        "vendor_id",
        vendor.id,
      )
      .maybeSingle();

  if (
    !orderError &&
    !order
  ) {
    notFound();
  }

  if (!order) {
    return (
      <AuthMessage
        error="The order could not be loaded."
      />
    );
  }

  const {
    data: items,
    error: itemsError,
  } = await supabase
    .from("order_items")
    .select("*")
    .eq(
      "order_id",
      order.id,
    )
    .order(
      "created_at",
      {
        ascending: true,
      },
    );

  const query =
    await searchParams;

  const error =
    getQueryValue(
      query.error,
    ) ??
    (orderError || itemsError
      ? "Some order information could not be loaded."
      : undefined);

  const message =
    getQueryValue(
      query.message,
    );

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/vendor/orders"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            ← Customer orders
          </Link>

          <p className="mt-5 text-sm font-semibold text-emerald-700">
            {order.order_number}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            {order.customer_name}
          </h1>
        </div>

        <OrdersRefreshButton />
      </div>

      <div className="mt-6">
        <AuthMessage
          error={error}
          message={message}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Order information
                </h2>

                <p className="mt-2 text-slate-600">
                  {order.canteen_name}
                </p>
              </div>

              <OrderStatusBadge
                status={order.status}
              />
            </div>

            <dl className="mt-7 grid gap-5 border-t border-slate-200 pt-6 text-sm md:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-700">
                  Placed
                </dt>

                <dd className="mt-1 text-slate-600">
                  {formatDate(
                    order.created_at,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-700">
                  Pickup time
                </dt>

                <dd className="mt-1 text-slate-600">
                  {formatDate(
                    order.pickup_time,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-700">
                  Customer name
                </dt>

                <dd className="mt-1 text-slate-600">
                  {order.customer_name}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-700">
                  Phone
                </dt>

                <dd className="mt-1 text-slate-600">
                  {order.customer_phone ||
                    "Not provided"}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-700">
                  Payment
                </dt>

                <dd className="mt-1 capitalize text-slate-600">
                  {order.payment_method} ·{" "}
                  {order.payment_status}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-700">
                  Fulfilment
                </dt>

                <dd className="mt-1 capitalize text-slate-600">
                  {order.fulfillment_type}
                </dd>
              </div>
            </dl>

            {order.notes && (
              <div className="mt-6 rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Customer notes
                </p>

                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {order.notes}
                </p>
              </div>
            )}

            {order.rejection_reason && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Rejection reason
                </p>

                <p className="mt-2 whitespace-pre-line text-sm text-red-700">
                  {order.rejection_reason}
                </p>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <header className="border-b border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Ordered items
              </h2>
            </header>

            <div className="divide-y divide-slate-200">
              {(items ?? []).map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-5 p-5 sm:p-6"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.item_name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.quantity} ×{" "}
                        {formatPrice(
                          item.unit_price,
                          order.currency_code,
                        )}
                      </p>
                    </div>

                    <p className="font-bold text-slate-900">
                     {formatPrice(
  Number(item.unit_price) * item.quantity,
  order.currency_code,
)}
                    </p>
                  </div>
                ),
              )}
            </div>

            <footer className="border-t border-slate-200 bg-slate-50 p-6">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">
                  Total
                </span>

                <span className="text-xl font-bold text-slate-900">
                  {formatPrice(
                    order.total_amount,
                    order.currency_code,
                  )}
                </span>
              </div>
            </footer>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Status history
            </h2>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-700">
                  Accepted
                </dt>

                <dd className="mt-1 text-slate-600">
                  {formatDate(
                    order.accepted_at,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-700">
                  Preparation started
                </dt>

                <dd className="mt-1 text-slate-600">
                  {formatDate(
                    order.preparing_at,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-700">
                  Ready
                </dt>

                <dd className="mt-1 text-slate-600">
                  {formatDate(
                    order.ready_at,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-700">
                  Completed
                </dt>

                <dd className="mt-1 text-slate-600">
                  {formatDate(
                    order.completed_at,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-700">
                  Rejected
                </dt>

                <dd className="mt-1 text-slate-600">
                  {formatDate(
                    order.rejected_at,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-700">
                  Last changed
                </dt>

                <dd className="mt-1 text-slate-600">
                  {formatDate(
                    order.status_updated_at,
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside>
          <VendorOrderActions
            orderId={order.id}
            status={order.status}
          />
        </aside>
      </div>
    </>
  );
}