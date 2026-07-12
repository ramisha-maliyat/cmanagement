import type { VendorStatus } from "@/types";

type VendorStatusBadgeProps = {
  status: VendorStatus;
};

const statusStyles: Record<VendorStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-slate-200 text-slate-700",
};

export function VendorStatusBadge({
  status,
}: VendorStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}