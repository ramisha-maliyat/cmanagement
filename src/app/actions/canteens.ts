"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  canteenFormSchema,
  canteenStatusSchema,
  canteenUpdateSchema,
} from "@/lib/validations/canteen";
import { requireApprovedVendor } from "@/lib/vendor/current-vendor";

function getFormValue(
  formData: FormData,
  name: string,
): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

function firstValidationError(
  issues: Array<{ message: string }>,
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

function canteenDatabaseError(
  message: string,
  code?: string,
): string {
  const lowerMessage = message.toLowerCase();

  if (
    code === "23505" ||
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("unique")
  ) {
    return "That canteen URL name is already being used.";
  }

  if (
    lowerMessage.includes("row-level security") ||
    lowerMessage.includes("permission denied")
  ) {
    return "You do not have permission to manage this canteen.";
  }

  if (lowerMessage.includes("timezone")) {
    return "The selected timezone is invalid.";
  }

  return "The canteen information could not be saved.";
}

export async function createCanteenAction(
  formData: FormData,
): Promise<void> {
  const { vendor } = await requireApprovedVendor();

  const result = canteenFormSchema.safeParse({
    name: getFormValue(formData, "name"),
    slug: getFormValue(formData, "slug"),
    description: getFormValue(formData, "description"),
    location: getFormValue(formData, "location"),
    openingTime: getFormValue(formData, "openingTime"),
    closingTime: getFormValue(formData, "closingTime"),
    timezone: getFormValue(formData, "timezone"),
  });

  if (!result.success) {
    redirectWithMessage(
      "/vendor/canteens/new",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("canteens")
    .insert({
      vendor_id: vendor.id,
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description || null,
      location: result.data.location || null,
      opening_time: result.data.openingTime,
      closing_time: result.data.closingTime,
      timezone: result.data.timezone,
      is_active: true,
    });

  if (error) {
    console.error("Create canteen error:", error.message);

    redirectWithMessage(
      "/vendor/canteens/new",
      "error",
      canteenDatabaseError(error.message, error.code),
    );
  }

  revalidatePath("/vendor");
  revalidatePath("/vendor/canteens");

  redirectWithMessage(
    "/vendor/canteens",
    "message",
    "The canteen has been created.",
  );
}

export async function updateCanteenAction(
  formData: FormData,
): Promise<void> {
  const { vendor } = await requireApprovedVendor();

  const result = canteenUpdateSchema.safeParse({
    canteenId: getFormValue(formData, "canteenId"),
    name: getFormValue(formData, "name"),
    slug: getFormValue(formData, "slug"),
    description: getFormValue(formData, "description"),
    location: getFormValue(formData, "location"),
    openingTime: getFormValue(formData, "openingTime"),
    closingTime: getFormValue(formData, "closingTime"),
    timezone: getFormValue(formData, "timezone"),
  });

  const fallbackId = getFormValue(formData, "canteenId");

  if (!result.success) {
    redirectWithMessage(
      fallbackId
        ? `/vendor/canteens/${fallbackId}/edit`
        : "/vendor/canteens",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("canteens")
    .update({
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description || null,
      location: result.data.location || null,
      opening_time: result.data.openingTime,
      closing_time: result.data.closingTime,
      timezone: result.data.timezone,
    })
    .eq("id", result.data.canteenId)
    .eq("vendor_id", vendor.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Update canteen error:", error.message);

    redirectWithMessage(
      `/vendor/canteens/${result.data.canteenId}/edit`,
      "error",
      canteenDatabaseError(error.message, error.code),
    );
  }

  if (!data) {
    redirectWithMessage(
      "/vendor/canteens",
      "error",
      "The canteen was not found.",
    );
  }

  revalidatePath("/vendor");
  revalidatePath("/vendor/canteens");
  revalidatePath(
    `/vendor/canteens/${result.data.canteenId}/edit`,
  );

  redirectWithMessage(
    "/vendor/canteens",
    "message",
    "The canteen has been updated.",
  );
}

export async function changeCanteenStatusAction(
  formData: FormData,
): Promise<void> {
  const { vendor } = await requireApprovedVendor();

  const result = canteenStatusSchema.safeParse({
    canteenId: getFormValue(formData, "canteenId"),
    nextStatus: getFormValue(formData, "nextStatus"),
  });

  if (!result.success) {
    redirectWithMessage(
      "/vendor/canteens",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const isActive = result.data.nextStatus === "active";

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("canteens")
    .update({
      is_active: isActive,
    })
    .eq("id", result.data.canteenId)
    .eq("vendor_id", vendor.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Canteen status error:", error.message);

    redirectWithMessage(
      "/vendor/canteens",
      "error",
      canteenDatabaseError(error.message, error.code),
    );
  }

  if (!data) {
    redirectWithMessage(
      "/vendor/canteens",
      "error",
      "The canteen was not found.",
    );
  }

  revalidatePath("/");
  revalidatePath("/vendor");
  revalidatePath("/vendor/canteens");

  redirectWithMessage(
    "/vendor/canteens",
    "message",
    isActive
      ? "The canteen is now active."
      : "The canteen has been deactivated.",
  );
}