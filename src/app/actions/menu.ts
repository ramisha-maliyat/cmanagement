"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  menuCategoryFormSchema,
  menuCategoryStatusSchema,
  menuCategoryUpdateSchema,
  menuItemAvailabilitySchema,
  menuItemFormSchema,
  menuItemUpdateSchema,
} from "@/lib/validations/menu";
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

function menuPath(canteenId: string): string {
  return `/vendor/canteens/${canteenId}/menu`;
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

function menuDatabaseError(
  message: string,
  code?: string,
): string {
  const lowerMessage = message.toLowerCase();

  if (
    code === "23505" ||
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("unique")
  ) {
    return "That URL name is already being used in this canteen.";
  }

  if (
    lowerMessage.includes("row-level security") ||
    lowerMessage.includes("permission denied")
  ) {
    return "You do not have permission to manage this menu.";
  }

  if (
    code === "23503" ||
    lowerMessage.includes("foreign key")
  ) {
    return "The selected canteen or category is invalid.";
  }

  if (
    code === "23514" ||
    lowerMessage.includes("check constraint")
  ) {
    return "One or more values are outside the allowed range.";
  }

  return "The menu information could not be saved.";
}

async function verifyManagedCanteen(
  vendorId: string,
  canteenId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("canteens")
    .select("id")
    .eq("id", canteenId)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (error || !data) {
    redirectWithMessage(
      "/vendor/canteens",
      "error",
      "The canteen was not found.",
    );
  }
}

async function verifyManagedCategory(
  vendorId: string,
  canteenId: string,
  categoryId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("vendor_id", vendorId)
    .eq("canteen_id", canteenId)
    .maybeSingle();

  if (error || !data) {
    redirectWithMessage(
      menuPath(canteenId),
      "error",
      "The menu category was not found.",
    );
  }
}

/* =========================================================
   CATEGORY ACTIONS
   ========================================================= */

export async function createMenuCategoryAction(
  formData: FormData,
): Promise<void> {
  const { vendor } = await requireApprovedVendor();

  const result = menuCategoryFormSchema.safeParse({
    canteenId: getFormValue(formData, "canteenId"),
    name: getFormValue(formData, "name"),
    slug: getFormValue(formData, "slug"),
    displayOrder: getFormValue(formData, "displayOrder"),
  });

  const fallbackCanteenId =
    getFormValue(formData, "canteenId");

  if (!result.success) {
    redirectWithMessage(
      `/vendor/canteens/${fallbackCanteenId}/menu/categories/new`,
      "error",
      firstValidationError(result.error.issues),
    );
  }

  await verifyManagedCanteen(
    vendor.id,
    result.data.canteenId,
  );

  const supabase = await createClient();

  const { error } = await supabase
    .from("menu_categories")
    .insert({
      vendor_id: vendor.id,
      canteen_id: result.data.canteenId,
      name: result.data.name,
      slug: result.data.slug,
      display_order: result.data.displayOrder,
      is_active: true,
    });

  if (error) {
    console.error(
      "Create menu category error:",
      error.message,
    );

    redirectWithMessage(
      `/vendor/canteens/${result.data.canteenId}/menu/categories/new`,
      "error",
      menuDatabaseError(error.message, error.code),
    );
  }

  revalidatePath(
    menuPath(result.data.canteenId),
  );

  redirectWithMessage(
    menuPath(result.data.canteenId),
    "message",
    "The menu category has been created.",
  );
}

export async function updateMenuCategoryAction(
  formData: FormData,
): Promise<void> {
  const { vendor } = await requireApprovedVendor();

  const result = menuCategoryUpdateSchema.safeParse({
    canteenId: getFormValue(formData, "canteenId"),
    categoryId: getFormValue(formData, "categoryId"),
    name: getFormValue(formData, "name"),
    slug: getFormValue(formData, "slug"),
    displayOrder: getFormValue(formData, "displayOrder"),
  });

  const fallbackCanteenId =
    getFormValue(formData, "canteenId");

  const fallbackCategoryId =
    getFormValue(formData, "categoryId");

  if (!result.success) {
    redirectWithMessage(
      `/vendor/canteens/${fallbackCanteenId}/menu/categories/${fallbackCategoryId}/edit`,
      "error",
      firstValidationError(result.error.issues),
    );
  }

  await verifyManagedCategory(
    vendor.id,
    result.data.canteenId,
    result.data.categoryId,
  );

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_categories")
    .update({
      name: result.data.name,
      slug: result.data.slug,
      display_order: result.data.displayOrder,
    })
    .eq("id", result.data.categoryId)
    .eq("canteen_id", result.data.canteenId)
    .eq("vendor_id", vendor.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Update menu category error:",
      error.message,
    );

    redirectWithMessage(
      `/vendor/canteens/${result.data.canteenId}/menu/categories/${result.data.categoryId}/edit`,
      "error",
      menuDatabaseError(error.message, error.code),
    );
  }

  if (!data) {
    redirectWithMessage(
      menuPath(result.data.canteenId),
      "error",
      "The menu category was not found.",
    );
  }

  revalidatePath(
    menuPath(result.data.canteenId),
  );

  redirectWithMessage(
    menuPath(result.data.canteenId),
    "message",
    "The menu category has been updated.",
  );
}

export async function changeMenuCategoryStatusAction(
  formData: FormData,
): Promise<void> {
  const { vendor } = await requireApprovedVendor();

  const result = menuCategoryStatusSchema.safeParse({
    canteenId: getFormValue(formData, "canteenId"),
    categoryId: getFormValue(formData, "categoryId"),
    nextStatus: getFormValue(formData, "nextStatus"),
  });

  if (!result.success) {
    redirectWithMessage(
      "/vendor/canteens",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const isActive =
    result.data.nextStatus === "active";

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_categories")
    .update({
      is_active: isActive,
    })
    .eq("id", result.data.categoryId)
    .eq("canteen_id", result.data.canteenId)
    .eq("vendor_id", vendor.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Menu category status error:",
      error.message,
    );

    redirectWithMessage(
      menuPath(result.data.canteenId),
      "error",
      menuDatabaseError(error.message, error.code),
    );
  }

  if (!data) {
    redirectWithMessage(
      menuPath(result.data.canteenId),
      "error",
      "The menu category was not found.",
    );
  }

  revalidatePath("/");
  revalidatePath(
    menuPath(result.data.canteenId),
  );

  redirectWithMessage(
    menuPath(result.data.canteenId),
    "message",
    isActive
      ? "The menu category is now active."
      : "The menu category has been deactivated.",
  );
}

/* =========================================================
   MENU ITEM ACTIONS
   ========================================================= */

export async function createMenuItemAction(
  formData: FormData,
): Promise<void> {
  const { vendor } = await requireApprovedVendor();

  const result = menuItemFormSchema.safeParse({
    canteenId: getFormValue(formData, "canteenId"),
    categoryId: getFormValue(formData, "categoryId"),
    name: getFormValue(formData, "name"),
    slug: getFormValue(formData, "slug"),
    description: getFormValue(formData, "description"),
    price: getFormValue(formData, "price"),
    imageUrl: getFormValue(formData, "imageUrl"),
    preparationMinutes: getFormValue(
      formData,
      "preparationMinutes",
    ),
    trackStock: getFormValue(formData, "trackStock"),
    stockQuantity: getFormValue(
      formData,
      "stockQuantity",
    ),
  });

  const fallbackCanteenId =
    getFormValue(formData, "canteenId");

  if (!result.success) {
    redirectWithMessage(
      `/vendor/canteens/${fallbackCanteenId}/menu/items/new`,
      "error",
      firstValidationError(result.error.issues),
    );
  }

  await verifyManagedCategory(
    vendor.id,
    result.data.canteenId,
    result.data.categoryId,
  );

  const supabase = await createClient();

  const { error } = await supabase
    .from("menu_items")
    .insert({
      vendor_id: vendor.id,
      canteen_id: result.data.canteenId,
      category_id: result.data.categoryId,
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description || null,
      price: result.data.price,
      image_url: result.data.imageUrl || null,
      preparation_minutes:
        result.data.preparationMinutes,
      track_stock: result.data.trackStock,
      stock_quantity: result.data.trackStock
        ? result.data.stockQuantity
        : 0,
      is_available: true,
    });

  if (error) {
    console.error(
      "Create menu item error:",
      error.message,
    );

    redirectWithMessage(
      `/vendor/canteens/${result.data.canteenId}/menu/items/new`,
      "error",
      menuDatabaseError(error.message, error.code),
    );
  }

  revalidatePath(
    menuPath(result.data.canteenId),
  );

  redirectWithMessage(
    menuPath(result.data.canteenId),
    "message",
    "The menu item has been created.",
  );
}

export async function updateMenuItemAction(
  formData: FormData,
): Promise<void> {
  const { vendor } = await requireApprovedVendor();

  const result = menuItemUpdateSchema.safeParse({
    canteenId: getFormValue(formData, "canteenId"),
    categoryId: getFormValue(formData, "categoryId"),
    menuItemId: getFormValue(formData, "menuItemId"),
    name: getFormValue(formData, "name"),
    slug: getFormValue(formData, "slug"),
    description: getFormValue(formData, "description"),
    price: getFormValue(formData, "price"),
    imageUrl: getFormValue(formData, "imageUrl"),
    preparationMinutes: getFormValue(
      formData,
      "preparationMinutes",
    ),
    trackStock: getFormValue(formData, "trackStock"),
    stockQuantity: getFormValue(
      formData,
      "stockQuantity",
    ),
  });

  const fallbackCanteenId =
    getFormValue(formData, "canteenId");

  const fallbackMenuItemId =
    getFormValue(formData, "menuItemId");

  if (!result.success) {
    redirectWithMessage(
      `/vendor/canteens/${fallbackCanteenId}/menu/items/${fallbackMenuItemId}/edit`,
      "error",
      firstValidationError(result.error.issues),
    );
  }

  await verifyManagedCategory(
    vendor.id,
    result.data.canteenId,
    result.data.categoryId,
  );

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_items")
    .update({
      category_id: result.data.categoryId,
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description || null,
      price: result.data.price,
      image_url: result.data.imageUrl || null,
      preparation_minutes:
        result.data.preparationMinutes,
      track_stock: result.data.trackStock,
      stock_quantity: result.data.trackStock
        ? result.data.stockQuantity
        : 0,
    })
    .eq("id", result.data.menuItemId)
    .eq("canteen_id", result.data.canteenId)
    .eq("vendor_id", vendor.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Update menu item error:",
      error.message,
    );

    redirectWithMessage(
      `/vendor/canteens/${result.data.canteenId}/menu/items/${result.data.menuItemId}/edit`,
      "error",
      menuDatabaseError(error.message, error.code),
    );
  }

  if (!data) {
    redirectWithMessage(
      menuPath(result.data.canteenId),
      "error",
      "The menu item was not found.",
    );
  }

  revalidatePath("/");
  revalidatePath(
    menuPath(result.data.canteenId),
  );

  redirectWithMessage(
    menuPath(result.data.canteenId),
    "message",
    "The menu item has been updated.",
  );
}

export async function changeMenuItemAvailabilityAction(
  formData: FormData,
): Promise<void> {
  const { vendor } = await requireApprovedVendor();

  const result = menuItemAvailabilitySchema.safeParse({
    canteenId: getFormValue(formData, "canteenId"),
    menuItemId: getFormValue(formData, "menuItemId"),
    nextStatus: getFormValue(formData, "nextStatus"),
  });

  if (!result.success) {
    redirectWithMessage(
      "/vendor/canteens",
      "error",
      firstValidationError(result.error.issues),
    );
  }

  const isAvailable =
    result.data.nextStatus === "available";

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_items")
    .update({
      is_available: isAvailable,
    })
    .eq("id", result.data.menuItemId)
    .eq("canteen_id", result.data.canteenId)
    .eq("vendor_id", vendor.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Menu item availability error:",
      error.message,
    );

    redirectWithMessage(
      menuPath(result.data.canteenId),
      "error",
      menuDatabaseError(error.message, error.code),
    );
  }

  if (!data) {
    redirectWithMessage(
      menuPath(result.data.canteenId),
      "error",
      "The menu item was not found.",
    );
  }

  revalidatePath("/");
  revalidatePath(
    menuPath(result.data.canteenId),
  );

  redirectWithMessage(
    menuPath(result.data.canteenId),
    "message",
    isAvailable
      ? "The menu item is now available."
      : "The menu item is now unavailable.",
  );
}