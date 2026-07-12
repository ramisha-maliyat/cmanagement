import "server-only";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireApprovedVendor } from "@/lib/vendor/current-vendor";
import type { Canteen } from "@/types";

type VendorCanteenAccount = Awaited<
  ReturnType<typeof requireApprovedVendor>
> & {
  canteen: Canteen;
};

export async function requireVendorCanteen(
  canteenId: string,
): Promise<VendorCanteenAccount> {
  const account = await requireApprovedVendor();

  const supabase = await createClient();

  const { data: canteen, error } = await supabase
    .from("canteens")
    .select("*")
    .eq("id", canteenId)
    .eq("vendor_id", account.vendor.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Vendor canteen query error:",
      error.message,
    );
  }

  if (error || !canteen) {
    notFound();
  }

  return {
    ...account,
    canteen,
  };
}