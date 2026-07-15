import type {
  ReactNode,
} from "react";

import {
  DashboardShell,
} from "@/components/layout/dashboard-shell";
import {
  CustomerOrdersRealtime,
} from "@/components/realtime/customer-orders-realtime";
import {
  requireRole,
} from "@/lib/auth/guards";

type CustomerLayoutProps = {
  children: ReactNode;
};

export default async function CustomerLayout({
  children,
}: CustomerLayoutProps) {
  const {
    user,
    profile,
  } =
    await requireRole(
      "customer",
    );

  return (
    <DashboardShell profile={profile}>
      <CustomerOrdersRealtime
        customerId={user.id}
      />

      {children}
    </DashboardShell>
  );
}