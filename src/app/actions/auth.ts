"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

function getFormValue(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

function redirectWithMessage(
  pathname: string,
  type: "error" | "message",
  message: string,
): never {
  const query = new URLSearchParams({
    [type]: message,
  });

  redirect(`${pathname}?${query.toString()}`);
}

function firstValidationError(
  issues: Array<{
    message: string;
  }>,
): string {
  return issues[0]?.message ?? "Check the information you entered.";
}

export async function registerAction(formData: FormData): Promise<void> {
  const result = registerSchema.safeParse({
    fullName: getFormValue(formData, "fullName"),
    phone: getFormValue(formData, "phone"),
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
    confirmPassword: getFormValue(formData, "confirmPassword"),
  });

  if (!result.success) {
    redirectWithMessage(
      "/register",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const { fullName, phone, email, password } = result.data;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/confirm`,
      data: {
        full_name: fullName,
        phone: phone || null,
      },
    },
  });

  if (error) {
    console.error("Registration error:", error.message);

    redirectWithMessage(
      "/register",
      "error",
      "We could not create your account. Check your details and try again.",
    );
  }

  /*
   * When email confirmation is disabled, Supabase may create
   * a session immediately. Otherwise, the user must confirm
   * their email first.
   */
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  redirect("/check-email");
}

export async function loginAction(formData: FormData): Promise<void> {
  const result = loginSchema.safeParse({
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
  });

  if (!result.success) {
    redirectWithMessage(
      "/login",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    console.error("Login error:", error.message);

    redirectWithMessage(
      "/login",
      "error",
      "Invalid email or password, or the email has not been confirmed.",
    );
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();

  /*
   * Local scope logs the user out of this session only,
   * rather than every device.
   */
  await supabase.auth.signOut({
    scope: "local",
  });

  revalidatePath("/", "layout");

  redirectWithMessage(
    "/login",
    "message",
    "You have been signed out successfully.",
  );
}

export async function forgotPasswordAction(
  formData: FormData,
): Promise<void> {
  const result = forgotPasswordSchema.safeParse({
    email: getFormValue(formData, "email"),
  });

  if (!result.success) {
    redirectWithMessage(
      "/forgot-password",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    result.data.email,
    {
      redirectTo: `${getSiteUrl()}/auth/confirm`,
    },
  );

  if (error) {
    console.error("Password recovery error:", error.message);
  }

  /*
   * Always use a generic response so the page does not
   * reveal whether an email address has an account.
   */
  redirectWithMessage(
    "/forgot-password",
    "message",
    "If an account exists for that email, a password reset link has been sent.",
  );
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<void> {
  const result = resetPasswordSchema.safeParse({
    password: getFormValue(formData, "password"),
    confirmPassword: getFormValue(formData, "confirmPassword"),
  });

  if (!result.success) {
    redirectWithMessage(
      "/reset-password",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithMessage(
      "/login",
      "error",
      "The password reset link is invalid or has expired.",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    console.error("Password update error:", error.message);

    redirectWithMessage(
      "/reset-password",
      "error",
      "The password could not be updated. Request another reset link.",
    );
  }

  /*
   * A global logout revokes the user's refresh tokens on
   * all devices after a password recovery.
   */
  await supabase.auth.signOut({
    scope: "global",
  });

  revalidatePath("/", "layout");

  redirectWithMessage(
    "/login",
    "message",
    "Your password has been changed. Sign in with the new password.",
  );
}