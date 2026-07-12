import { redirect } from "next/navigation";

import {
  dashboardPathForRole,
  requireAccount,
} from "@/lib/auth/guards";

export default async function DashboardPage(): Promise<never> {
  const { profile } = await requireAccount();

  if (!profile.is_active) {
    redirect("/account-disabled");
  }

  redirect(dashboardPathForRole(profile.role));
}