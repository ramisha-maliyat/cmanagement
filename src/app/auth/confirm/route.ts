import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const allowedEmailTypes: EmailOtpType[] = [
  "email",
  "recovery",
  "signup",
  "invite",
  "magiclink",
  "email_change",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return (
    value !== null &&
    allowedEmailTypes.includes(value as EmailOtpType)
  );
}

function getSafeNextPath(
  value: string | null,
  fallback: string,
): string {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return fallback;
}

export async function GET(request: NextRequest): Promise<never> {
  const searchParams = request.nextUrl.searchParams;

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const defaultNext =
    type === "recovery" ? "/reset-password" : "/dashboard";

  const nextPath = getSafeNextPath(
    searchParams.get("next"),
    defaultNext,
  );

  if (tokenHash && isEmailOtpType(type)) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      redirect(nextPath);
    }

    console.error("Email confirmation error:", error.message);
  }

  const query = new URLSearchParams({
    error:
      "The authentication link is invalid, expired or has already been used.",
  });

  redirect(`/auth/error?${query.toString()}`);
}