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
  OrderStatus,
} from "@/types";
import type {
  Database,
} from "@/types/database";

type OrderRow =
  Database["public"]["Tables"]["orders"]["Row"];

type CustomerOrdersRealtimeProps = {
  customerId: string;
};

type ConnectionState =
  | "connecting"
  | "connected"
  | "error";

const statusMessages:
  Record<OrderStatus, string> = {
    pending:
      "Your order is awaiting vendor review.",

    accepted:
      "Your order has been accepted.",

    preparing:
      "Your order is being prepared.",

    ready:
      "Your order is ready for collection.",

    completed:
      "Your order has been completed.",

    rejected:
      "Your order was rejected.",

    cancelled:
      "Your order was cancelled.",
  };

export function CustomerOrdersRealtime({
  customerId,
}: CustomerOrdersRealtimeProps) {
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
        `customer-orders-${customerId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter:
            `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const order =
            payload.new as OrderRow;

          const orderStatus =
            order.status as OrderStatus;

          const statusMessage =
            statusMessages[
              orderStatus
            ] ??
            `Order status changed to ${order.status}.`;

          displayNotice(
            `${order.order_number}: ${statusMessage}`,
          );

          playOrderAlert();

          showOrderNotification({
            title:
              `Order ${order.order_number}`,
            body: statusMessage,
            href:
              `/customer/orders/${order.id}`,
            tag:
              `customer-order-${order.id}`,
          });

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
    customerId,
    router,
  ]);

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Live order tracking
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
              ? "Connected — order changes will appear automatically."
              : connectionState ===
                  "error"
                ? "Connection problem — refresh the page manually."
                : "Connecting to live order updates..."}
          </p>
        </div>

        <OrderAlertsControl />
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800"
        >
          {notice}
        </div>
      )}
    </section>
  );
}