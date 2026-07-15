"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import { OrderAlertsControl } from "@/components/realtime/order-alerts-control";
import {
  playOrderAlert,
  showOrderNotification,
} from "@/lib/browser/order-alerts";
import {
  createClient,
} from "@/lib/supabase/client";
import type {
  Database,
} from "@/types/database";

type OrderRow =
  Database["public"]["Tables"]["orders"]["Row"];

type VendorOrdersRealtimeProps = {
  vendorId: string;
};

type ConnectionState =
  | "connecting"
  | "connected"
  | "error";

export function VendorOrdersRealtime({
  vendorId,
}: VendorOrdersRealtimeProps) {
  const router = useRouter();

  const [
    connectionState,
    setConnectionState,
  ] =
    useState<ConnectionState>(
      "connecting",
    );

  const [
    notice,
    setNotice,
  ] =
    useState<string | null>(null);

  const noticeTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  useEffect(() => {
    const supabase =
      createClient();

    function displayNotice(
      message: string,
    ): void {
      setNotice(message);

      if (noticeTimer.current) {
        clearTimeout(
          noticeTimer.current,
        );
      }

      noticeTimer.current =
        setTimeout(() => {
          setNotice(null);
        }, 7000);
    }

    const channel = supabase
      .channel(
        `vendor-orders-${vendorId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter:
            `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          const order =
            payload.new as OrderRow;

          const orderNumber =
            order.order_number ??
            "New order";

          displayNotice(
            `${orderNumber}: New order from ${order.customer_name}.`,
          );

          playOrderAlert();

          showOrderNotification({
            title: "New customer order",
            body:
              `${orderNumber} from ` +
              `${order.customer_name} — ` +
              `${order.canteen_name}`,
            href:
              `/vendor/orders/${order.id}`,
            tag:
              `vendor-order-${order.id}`,
          });

          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter:
            `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          const order =
            payload.new as OrderRow;

          displayNotice(
            `${order.order_number}: Status is now ${order.status}.`,
          );

          router.refresh();
        },
      )
      .subscribe((status) => {
        if (
          status === "SUBSCRIBED"
        ) {
          setConnectionState(
            "connected",
          );

          return;
        }

        if (
          status ===
            "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          setConnectionState(
            "error",
          );
        }
      });

    return () => {
      if (noticeTimer.current) {
        clearTimeout(
          noticeTimer.current,
        );
      }

      void supabase.removeChannel(
        channel,
      );
    };
  }, [
    router,
    vendorId,
  ]);

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Live order updates
          </p>

          <p
            className={
              connectionState ===
              "connected"
                ? "mt-1 text-xs text-emerald-700"
                : connectionState ===
                    "error"
                  ? "mt-1 text-xs text-red-700"
                  : "mt-1 text-xs text-amber-700"
            }
          >
            {connectionState ===
            "connected"
              ? "Connected — new orders will appear automatically."
              : connectionState ===
                  "error"
                ? "Connection problem — use the manual refresh button."
                : "Connecting to live orders..."}
          </p>
        </div>

        <OrderAlertsControl />
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {notice}
        </div>
      )}
    </section>
  );
}