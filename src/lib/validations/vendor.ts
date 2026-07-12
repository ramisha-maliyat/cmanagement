import { z } from "zod";

export const vendorApplicationSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must contain at least 2 characters.")
    .max(150, "Business name must not exceed 150 characters."),

  slug: z
    .string()
    .trim()
    .min(2, "Business URL name is required.")
    .max(100, "Business URL name is too long.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single hyphens only.",
    ),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters.")
    .optional(),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number must not exceed 30 characters.")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Enter a valid business email.")
    .max(320, "Email address is too long.")
    .transform((email) => email.toLowerCase()),

  address: z
    .string()
    .trim()
    .max(500, "Address must not exceed 500 characters.")
    .optional(),

  currencyCode: z
    .string()
    .trim()
    .length(3, "Currency must contain exactly 3 letters.")
    .regex(/^[A-Za-z]{3}$/, "Currency must contain letters only.")
    .transform((value) => value.toUpperCase()),
});

export const vendorReviewSchema = z.object({
  vendorId: z.string().uuid("Invalid vendor application."),

  decision: z.enum(["approved", "rejected"], {
    message: "Select approve or reject.",
  }),

  reviewNotes: z
    .string()
    .trim()
    .max(1000, "Review notes must not exceed 1000 characters.")
    .optional(),
});