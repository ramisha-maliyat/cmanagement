export type PageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export function getQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  return value?.[0];
}