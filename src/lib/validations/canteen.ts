import { z } from "zod";

import { isSupportedCanteenTimezone } from "@/config/canteens";

const optionalTimeSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    "Enter a valid time.",
  )
  .transform((value) => {
    return value === "" ? null : value;
  });

export const canteenFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Canteen name must contain at least 2 characters.")
    .max(150, "Canteen name must not exceed 150 characters."),

  slug: z
    .string()
    .trim()
    .min(2, "Canteen URL name is required.")
    .max(100, "Canteen URL name is too long.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single hyphens only.",
    ),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters.")
    .optional(),

  location: z
    .string()
    .trim()
    .max(500, "Location must not exceed 500 characters.")
    .optional(),

  openingTime: optionalTimeSchema,
  closingTime: optionalTimeSchema,

  timezone: z
    .string()
    .trim()
    .refine(
      isSupportedCanteenTimezone,
      "Select a supported timezone.",
    ),
});

export const canteenUpdateSchema =
  canteenFormSchema.extend({
    canteenId: z
      .string()
      .uuid("Invalid canteen identifier."),
  });

export const canteenStatusSchema = z.object({
  canteenId: z
    .string()
    .uuid("Invalid canteen identifier."),

  nextStatus: z.enum(["active", "inactive"]),
});