import { z } from "zod";

const uuidSchema = z
  .string()
  .uuid("Invalid record identifier.");

const slugSchema = z
  .string()
  .trim()
  .min(2, "URL name must contain at least 2 characters.")
  .max(100, "URL name must not exceed 100 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens only.",
  );

const nonNegativeIntegerSchema = (
  fieldName: string,
  maximum: number,
) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${fieldName} must be a whole number.`)
    .transform(Number)
    .refine(
      (value) => value >= 0 && value <= maximum,
      `${fieldName} must be between 0 and ${maximum}.`,
    );

const priceSchema = z
  .string()
  .trim()
  .regex(
    /^\d+(?:\.\d{1,2})?$/,
    "Enter a valid price with no more than 2 decimal places.",
  )
  .transform(Number)
  .refine(
    (value) => value >= 0 && value <= 999999.99,
    "Price is outside the supported range.",
  );

const optionalImageUrlSchema = z
  .string()
  .trim()
  .max(2048, "Image URL is too long.")
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("https://") ||
      value.startsWith("http://"),
    "Image URL must begin with http:// or https://.",
  );

const checkboxSchema = z
  .enum(["", "on"])
  .transform((value) => value === "on");

export const menuCategoryFormSchema = z.object({
  canteenId: uuidSchema,

  name: z
    .string()
    .trim()
    .min(2, "Category name must contain at least 2 characters.")
    .max(100, "Category name must not exceed 100 characters."),

  slug: slugSchema,

  displayOrder: nonNegativeIntegerSchema(
    "Display order",
    10000,
  ),
});

export const menuCategoryUpdateSchema =
  menuCategoryFormSchema.extend({
    categoryId: uuidSchema,
  });

export const menuCategoryStatusSchema = z.object({
  canteenId: uuidSchema,
  categoryId: uuidSchema,
  nextStatus: z.enum(["active", "inactive"]),
});

export const menuItemFormSchema = z.object({
  canteenId: uuidSchema,
  categoryId: uuidSchema,

  name: z
    .string()
    .trim()
    .min(2, "Item name must contain at least 2 characters.")
    .max(150, "Item name must not exceed 150 characters."),

  slug: slugSchema,

  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters.")
    .optional(),

  price: priceSchema,

  imageUrl: optionalImageUrlSchema,

  preparationMinutes: nonNegativeIntegerSchema(
    "Preparation time",
    1440,
  ),

  trackStock: checkboxSchema,

  stockQuantity: nonNegativeIntegerSchema(
    "Stock quantity",
    1000000,
  ),
});

export const menuItemUpdateSchema =
  menuItemFormSchema.extend({
    menuItemId: uuidSchema,
  });

export const menuItemAvailabilitySchema = z.object({
  canteenId: uuidSchema,
  menuItemId: uuidSchema,
  nextStatus: z.enum(["available", "unavailable"]),
});