import Link from "next/link";

import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { OrdersRefreshButton } from "@/components/order/orders-refresh-button";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedVendor } from "@/lib/vendor/current-vendor";

const orderStatuses = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "rejected",
  "cancelled",
] as const;

type OrderFilter = (typeof orderStatuses)[number];

type VendorOrdersPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

function isOrderFilter(
  value: string | undefined,
): value is OrderFilter {
  return orderStatuses.some((status) => status === value);
}

function formatPrice(
  value: number | string,
  currencyCode: string,
): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(value));
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function VendorOrdersPage({
  searchParams,
}: VendorOrdersPageProps) {
  const { vendor } = await requireApprovedVendor();

  const params = await searchParams;

  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;

  const activeStatus = isOrderFilter(rawStatus)
    ? rawStatus
    : undefined;

  const supabase = await createClient();

  let ordersQuery = supabase
    .from("orders")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", {
      ascending: false,
    });

  if (activeStatus) {
    ordersQuery = ordersQuery.eq("status", activeStatus);
  }

  const { data: orders, error } = await ordersQuery;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/vendor"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            ← Vendor dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Customer orders
          </h1>

          <p className="mt-2 text-slate-600">
            Manage orders submitted to {vendor.business_name}.
          </p>
        </div>

        <OrdersRefreshButton />
      </div>

      <nav className="mt-7 flex flex-wrap gap-2">
        <Link
          href="/vendor/orders"
          className={
            !activeStatus
              ? "rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              : "rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
          }
        >
          All
        </Link>

        {orderStatuses.map((status) => (
          <Link
            key={status}
            href={`/vendor/orders?status=${status}`}
            className={
              activeStatus === status
                ? "rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold capitalize text-white"
                : "rounded-full bg-white px-4 py-2 text-sm font-semibold capitalize text-slate-700 shadow-sm"
            }
          >
            {status}
          </Link>
        ))}
      </nav>

      {error && (
        <section className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Orders could not be loaded: {error.message}
        </section>
      )}

      {!error && (!orders || orders.length === 0) ? (
        <section className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            No matching orders
          </h2>

          <p className="mt-2 text-slate-600">
            Orders matching this status will appear here.
          </p>
        </section>
      ) : (
        <div className="mt-8 space-y-4">
          {orders?.map((order) => (
            <Link
              key={order.id}
              href={`/vendor/orders/${order.id}`}
              className="block rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    {order.order_number}
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {order.customer_name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {order.canteen_name}
                  </p>
                </div>

                <OrderStatusBadge status={order.status} />
              </div>

              <dl className="mt-5 grid gap-4 border-t border-slate-200 pt-5 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-slate-700">
                    Placed
                  </dt>

                  <dd className="mt-1 text-slate-600">
                    {formatDate(order.created_at)}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-700">
                    Pickup
                  </dt>

                  <dd className="mt-1 text-slate-600">
                    {formatDate(order.pickup_time)}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-700">
                    Total
                  </dt>

                  <dd className="mt-1 font-bold text-slate-900">
                    {formatPrice(
                      order.total_amount,
                      order.currency_code,
                    )}
                  </dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}