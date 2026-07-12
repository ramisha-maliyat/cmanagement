import "server-only";

import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/types";

export type CurrentAccount = {
  user: User;
  profile: Profile;
};

export function dashboardPathForRole(role: AppRole): string {
  switch (role) {
    case "admin":
      return "/admin";

    case "vendor":
      return "/vendor";

    case "customer":
    default:
      return "/customer";
  }
}

export const getCurrentUser = cache(
  async (): Promise<User | null> => {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  },
);

export const getCurrentProfile = cache(
  async (): Promise<Profile | null> => {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile query error:", error.message);
      return null;
    }

    return data;
  },
);

export async function requireAccount(): Promise<CurrentAccount> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      "/login?error=Please%20sign%20in%20to%20continue.",
    );
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(
      "/auth/error?error=Your%20application%20profile%20could%20not%20be%20loaded.",
    );
  }

  return {
    user,
    profile,
  };
}

export async function requireActiveAccount(): Promise<CurrentAccount> {
  const account = await requireAccount();

  if (!account.profile.is_active) {
    redirect("/account-disabled");
  }

  return account;
}

export async function requireRole(
  requiredRole: AppRole,
): Promise<CurrentAccount> {
  const account = await requireActiveAccount();

  if (account.profile.role !== requiredRole) {
    redirect("/dashboard");
  }

  return account;
}