import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireRole("admin");

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}