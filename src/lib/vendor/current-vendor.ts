import "server-only";

import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Vendor } from "@/types";

type ApprovedVendorAccount = Awaited<
  ReturnType<typeof requireRole>
> & {
  vendor: Vendor;
};

function redirectToVendorWithError(
  message: string,
): never {
  const query = new URLSearchParams({
    error: message,
  });

  redirect(`/vendor?${query.toString()}`);
}

export async function requireApprovedVendor(): Promise<ApprovedVendorAccount> {
  const account = await requireRole("vendor");

  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("owner_id", account.user.id)
    .maybeSingle();

  if (error || !vendor) {
    console.error(
      "Current vendor query error:",
      error?.message,
    );

    redirectToVendorWithError(
      "Your vendor business could not be loaded.",
    );
  }

  if (vendor.status !== "approved") {
    redirectToVendorWithError(
      "Your vendor business is not currently approved.",
    );
  }

  return {
    ...account,
    vendor,
  };
}