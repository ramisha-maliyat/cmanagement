import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";

type CustomerLayoutProps = {
  children: ReactNode;
};

export default async function CustomerLayout({
  children,
}: CustomerLayoutProps) {
  const { profile } = await requireRole("customer");

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}