import type {
  ReactNode,
} from "react";

import {
  DashboardShell,
} from "@/components/layout/dashboard-shell";
import {
  VendorOrdersRealtime,
} from "@/components/realtime/vendor-orders-realtime";
import {
  requireRole,
} from "@/lib/auth/guards";
import {
  createClient,
} from "@/lib/supabase/server";

type VendorLayoutProps = {
  children: ReactNode;
};

export default async function VendorLayout({
  children,
}: VendorLayoutProps) {
  const {
    user,
    profile,
  } = await requireRole("vendor");

  const supabase =
    await createClient();

  const {
    data: vendor,
    error,
  } = await supabase
    .from("vendors")
    .select(
      "id, status",
    )
    .eq(
      "owner_id",
      user.id,
    )
    .maybeSingle();

  if (error) {
    console.error(
      "Vendor layout query error:",
      error.message,
    );
  }

  return (
    <DashboardShell profile={profile}>
      {vendor &&
        vendor.status ===
          "approved" && (
          <VendorOrdersRealtime
            vendorId={vendor.id}
          />
        )}

      {children}
    </DashboardShell>
  );
}