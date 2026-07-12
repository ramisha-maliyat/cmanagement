type MenuStatusBadgeProps = {
  active: boolean;
  activeText?: string;
  inactiveText?: string;
};

export function MenuStatusBadge({
  active,
  activeText = "Active",
  inactiveText = "Inactive",
}: MenuStatusBadgeProps) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
          : "inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
      }
    >
      {active ? activeText : inactiveText}
    </span>
  );
}