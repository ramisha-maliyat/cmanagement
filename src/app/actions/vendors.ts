"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  vendorApplicationSchema,
  vendorReviewSchema,
} from "@/lib/validations/vendor";

function getFormValue(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

function firstValidationError(
  issues: Array<{
    message: string;
  }>,
): string {
  return issues[0]?.message ?? "Check the information entered.";
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

function applicationErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("authentication is required")) {
    return "Your session has expired. Sign out and sign in again.";
  }

  if (lowerMessage.includes("profile was not found")) {
    return message;
  }

  if (lowerMessage.includes("only customer accounts")) {
    return message;
  }

  if (lowerMessage.includes("account is disabled")) {
    return "Your account is currently disabled.";
  }

  if (lowerMessage.includes("pending vendor application")) {
    return "You already have a pending vendor application.";
  }

  if (lowerMessage.includes("already approved")) {
    return "Your vendor application is already approved.";
  }

  if (lowerMessage.includes("suspended")) {
    return "Your vendor account is currently suspended.";
  }

  if (
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("unique")
  ) {
    return "That business URL name is already being used.";
  }

  if (lowerMessage.includes("vendor slug")) {
    return "Use lowercase letters, numbers and hyphens for the business URL name.";
  }

  return message;
}

export async function submitVendorApplicationAction(
  formData: FormData,
): Promise<void> {
  //await requireRole("customer");
const { user, profile } = await requireRole("customer");

console.log("Vendor application user:", {
  userId: user.id,
  email: user.email,
  profileId: profile.id,
  profileRole: profile.role,
  isActive: profile.is_active,
});
  const result = vendorApplicationSchema.safeParse({
    businessName: getFormValue(formData, "businessName"),
    slug: getFormValue(formData, "slug"),
    description: getFormValue(formData, "description"),
    phone: getFormValue(formData, "phone"),
    email: getFormValue(formData, "email"),
    address: getFormValue(formData, "address"),
    currencyCode: getFormValue(formData, "currencyCode"),
  });

  if (!result.success) {
    redirectWithMessage(
      "/customer/vendor-application",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "submit_vendor_application",
    {
      p_business_name: result.data.businessName,
      p_slug: result.data.slug,
      p_description: result.data.description ?? "",
      p_phone: result.data.phone ?? "",
      p_email: result.data.email,
      p_address: result.data.address ?? "",
      p_currency_code: result.data.currencyCode,
    },
  );

  if (error) {
    console.error("Vendor application error:", error.message);

    redirectWithMessage(
      "/customer/vendor-application",
      "error",
      applicationErrorMessage(error.message),
    );
  }

  revalidatePath("/customer");
  revalidatePath("/customer/vendor-application");
  revalidatePath("/admin/vendors");

  redirectWithMessage(
    "/customer/vendor-application",
    "message",
    "Your vendor application has been submitted for review.",
  );
}

export async function reviewVendorApplicationAction(
  formData: FormData,
): Promise<void> {
  await requireRole("admin");

  const result = vendorReviewSchema.safeParse({
    vendorId: getFormValue(formData, "vendorId"),
    decision: getFormValue(formData, "decision"),
    reviewNotes: getFormValue(formData, "reviewNotes"),
  });

  if (!result.success) {
    redirectWithMessage(
      "/admin/vendors",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "review_vendor_application",
    {
      p_vendor_id: result.data.vendorId,
      p_decision: result.data.decision,
      p_review_notes: result.data.reviewNotes ?? "",
    },
  );

  if (error) {
    console.error("Vendor review error:", error.message);

    redirectWithMessage(
      "/admin/vendors",
      "error",
      "The vendor application could not be reviewed.",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/vendors");
  revalidatePath("/customer");
  revalidatePath("/customer/vendor-application");
  revalidatePath("/vendor");
  revalidatePath("/dashboard");

  const message =
    result.data.decision === "approved"
      ? "The vendor application has been approved."
      : "The vendor application has been rejected.";

  redirectWithMessage(
    "/admin/vendors",
    "message",
    message,
  );
}