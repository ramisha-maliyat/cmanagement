"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function OrdersRefreshButton() {
  const router = useRouter();

  const [
    isRefreshing,
    startTransition,
  ] = useTransition();

  function refreshOrders(): void {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={refreshOrders}
      disabled={isRefreshing}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isRefreshing
        ? "Refreshing..."
        : "Refresh orders"}
    </button>
  );
}