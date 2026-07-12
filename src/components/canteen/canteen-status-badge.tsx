type CanteenStatusBadgeProps = {
  isActive: boolean;
};

export function CanteenStatusBadge({
  isActive,
}: CanteenStatusBadgeProps) {
  return (
    <span
      className={
        isActive
          ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
          : "inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
      }
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}