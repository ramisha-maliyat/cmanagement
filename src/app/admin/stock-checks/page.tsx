import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import type { StockCheckItem, MenuItem } from "@/types";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminStockChecksPage() {
  await requireRole("admin");

  const supabase = await createClient();

  const { data: stockChecks, error: stockCheckError } =
    await supabase
      .from("stock_checks")
      .select("id, title, status, created_at, completed_at")
      .order("created_at", { ascending: false });

  const { data: stockCheckItems, error: stockCheckItemsError } =
    await supabase
      .from("stock_check_items")
      .select("id, stock_check_id, item_id, system_quantity, counted_quantity, difference, note, created_at")
      .order("created_at", { ascending: false });

  const itemIds = Array.from(
    new Set((stockCheckItems ?? []).map((item) => item.item_id)),
  ).filter(Boolean);

  const { data: menuItems } = itemIds.length > 0
    ? await supabase
        .from("menu_items")
        .select("id, name, stock_quantity")
        .in("id", itemIds)
    : { data: [] as MenuItem[] };

  const itemsByCheck = new Map<string, StockCheckItem[]>();

  (stockCheckItems ?? []).forEach((item) => {
    const list = itemsByCheck.get(item.stock_check_id) ?? [];
    list.push(item);
    itemsByCheck.set(item.stock_check_id, list);
  });

  const itemNames = new Map<string, string>();
  (menuItems ?? []).forEach((item) => {
    itemNames.set(item.id, item.name);
  });

  const error = stockCheckError || stockCheckItemsError ?
    "Unable to load stock check report." : undefined;

  return (
    <>
      <Link
        href="/admin"
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        ← Admin dashboard
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">
          Stock check reports
        </h1>

        <p className="mt-2 text-slate-600">
          Review completed and in-progress stock checks, item counts, and adjustments.
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl bg-rose-50 p-6 text-rose-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {(stockChecks ?? []).length === 0 ? (
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          There are no stock checks to report yet.
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {(stockChecks ?? []).map((stockCheck) => (
            <section
              key={stockCheck.id}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {stockCheck.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Created: {formatDate(stockCheck.created_at)}
                  </p>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {stockCheck.status.replace("_", " ")}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-slate-700">Completed</dt>
                  <dd className="mt-1 text-slate-600">
                    {formatDate(stockCheck.completed_at)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Items counted</dt>
                  <dd className="mt-1 text-slate-600">
                    {itemsByCheck.get(stockCheck.id)?.length ?? 0}
                  </dd>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">Item</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">System qty</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Counted qty</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Difference</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(itemsByCheck.get(stockCheck.id) ?? []).map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-800">
                          {itemNames.get(item.item_id) ?? item.item_id}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.system_quantity}</td>
                        <td className="px-4 py-3 text-slate-600">{item.counted_quantity}</td>
                        <td className="px-4 py-3 text-slate-600">{item.difference}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.note ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
