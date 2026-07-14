import { z } from "zod";

const checkoutItemSchema = z.object({
  menuItemId: z
    .string()
    .uuid("Invalid menu item."),

  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(100, "Quantity cannot exceed 100."),
});

export const createOrderSchema = z
  .object({
    canteenId: z
      .string()
      .uuid("Invalid canteen."),

    customerName: z
      .string()
      .trim()
      .min(
        2,
        "Customer name must contain at least 2 characters.",
      )
      .max(
        120,
        "Customer name must not exceed 120 characters.",
      ),

    customerPhone: z
      .string()
      .trim()
      .max(
        30,
        "Phone number must not exceed 30 characters.",
      )
      .optional(),

    pickupTime: z
      .string()
      .datetime({
        offset: true,
        message: "Enter a valid pickup time.",
      }),

    notes: z
      .string()
      .trim()
      .max(
        500,
        "Order notes must not exceed 500 characters.",
      )
      .optional(),

    paymentMethod: z.literal("cash"),

    items: z
      .array(checkoutItemSchema)
      .min(1, "Your cart is empty.")
      .max(100, "Your cart contains too many items."),
  })
  .superRefine((values, context) => {
    const itemIds = new Set<string>();

    values.items.forEach((item, index) => {
      if (itemIds.has(item.menuItemId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index],
          message:
            "The same menu item cannot appear twice.",
        });
      }

      itemIds.add(item.menuItemId);
    });

    const pickupDate = new Date(
      values.pickupTime,
    );

    const pickupTimestamp =
      pickupDate.getTime();

    const now = Date.now();

    if (
      Number.isNaN(pickupTimestamp)
    ) {
      context.addIssue({
        code: "custom",
        path: ["pickupTime"],
        message:
          "Enter a valid pickup time.",
      });

      return;
    }

    if (
      pickupTimestamp <
      now - 60_000
    ) {
      context.addIssue({
        code: "custom",
        path: ["pickupTime"],
        message:
          "Pickup time cannot be in the past.",
      });
    }

    const fourteenDays =
      14 * 24 * 60 * 60 * 1000;

    if (
      pickupTimestamp >
      now + fourteenDays
    ) {
      context.addIssue({
        code: "custom",
        path: ["pickupTime"],
        message:
          "Pickup time cannot be more than 14 days ahead.",
      });
    }
  });