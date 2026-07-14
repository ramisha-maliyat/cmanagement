import type {
  OrderStatus,
} from "@/types";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

const statusStyles:
  Record<OrderStatus, string> = {
    pending:
      "bg-amber-100 text-amber-800",

    accepted:
      "bg-blue-100 text-blue-800",

    preparing:
      "bg-purple-100 text-purple-800",

    ready:
      "bg-emerald-100 text-emerald-800",

    completed:
      "bg-slate-200 text-slate-700",

    cancelled:
      "bg-red-100 text-red-800",

    rejected:
      "bg-red-100 text-red-800",
  };

export function OrderStatusBadge({
  status,
}: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}