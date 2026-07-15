import { z } from "zod";

export const vendorOrderStatusSchema = z
  .object({
    orderId: z
      .string()
      .uuid("Invalid order identifier."),

    nextStatus: z.enum([
      "accepted",
      "preparing",
      "ready",
      "completed",
      "rejected",
    ]),

    rejectionReason: z
      .string()
      .trim()
      .max(
        500,
        "Rejection reason must not exceed 500 characters.",
      )
      .optional(),
  })
  .superRefine((values, context) => {
    if (
      values.nextStatus === "rejected" &&
      (!values.rejectionReason ||
        values.rejectionReason.length < 3)
    ) {
      context.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message:
          "Enter a rejection reason of at least 3 characters.",
      });
    }
  });