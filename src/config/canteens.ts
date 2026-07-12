export const CANTEEN_TIMEZONES = [
  {
    value: "Australia/Sydney",
    label: "Australia — Sydney",
  },
  {
    value: "Asia/Dhaka",
    label: "Bangladesh — Dhaka",
  },
  {
    value: "Europe/London",
    label: "United Kingdom — London",
  },
  {
    value: "UTC",
    label: "UTC",
  },
] as const;

export const DEFAULT_CANTEEN_TIMEZONE =
  "Australia/Sydney";

export function isSupportedCanteenTimezone(
  value: string,
): boolean {
  return CANTEEN_TIMEZONES.some(
    (timezone) => timezone.value === value,
  );
}