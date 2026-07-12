import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";

export default async function VendorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireRole("vendor");

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}