"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { vendorOrderStatusSchema } from "@/lib/validations/vendor-order";
import { requireApprovedVendor } from "@/lib/vendor/current-vendor";

function getFormValue(
  formData: FormData,
  name: string,
): string {
  const value = formData.get(name);

  return typeof value === "string"
    ? value
    : "";
}

function firstValidationError(
  issues: Array<{
    message: string;
  }>,
): string {
  return (
    issues[0]?.message ??
    "Check the order update information."
  );
}

function redirectWithMessage(
  pathname: string,
  type: "error" | "message",
  message: string,
): never {
  const query = new URLSearchParams({
    [type]: message,
  });

  redirect(
    `${pathname}?${query.toString()}`,
  );
}

function vendorOrderError(
  message: string,
): string {
  const lowerMessage =
    message.toLowerCase();

  if (
    lowerMessage.includes(
      "pending order can only",
    ) ||
    lowerMessage.includes(
      "accepted order can only",
    ) ||
    lowerMessage.includes(
      "preparing order can only",
    ) ||
    lowerMessage.includes(
      "ready order can only",
    )
  ) {
    return message;
  }

  if (
    lowerMessage.includes(
      "can no longer be changed",
    )
  ) {
    return "This order has already reached a final status.";
  }

  if (
    lowerMessage.includes(
      "rejection reason",
    )
  ) {
    return message;
  }

  if (
    lowerMessage.includes(
      "permission",
    )
  ) {
    return "You do not have permission to manage this order.";
  }

  if (
    lowerMessage.includes(
      "order was not found",
    )
  ) {
    return "The order was not found.";
  }

  if (
    lowerMessage.includes(
      "authentication is required",
    )
  ) {
    return "Your session has expired. Sign in again.";
  }

  return "The order status could not be updated.";
}

function successMessage(
  status:
    | "accepted"
    | "preparing"
    | "ready"
    | "completed"
    | "rejected",
): string {
  switch (status) {
    case "accepted":
      return "The order has been accepted.";

    case "preparing":
      return "The order is now being prepared.";

    case "ready":
      return "The order is ready for collection.";

    case "completed":
      return "The order has been completed.";

    case "rejected":
      return "The order has been rejected and reserved stock was restored.";
  }
}

export async function updateVendorOrderStatusAction(
  formData: FormData,
): Promise<void> {
  const { vendor } =
    await requireApprovedVendor();

  const result =
    vendorOrderStatusSchema.safeParse({
      orderId:
        getFormValue(
          formData,
          "orderId",
        ),

      nextStatus:
        getFormValue(
          formData,
          "nextStatus",
        ),

      rejectionReason:
        getFormValue(
          formData,
          "rejectionReason",
        ),
    });

  const fallbackOrderId =
    getFormValue(
      formData,
      "orderId",
    );

  if (!result.success) {
    const pathname =
      fallbackOrderId
        ? `/vendor/orders/${fallbackOrderId}`
        : "/vendor/orders";

    redirectWithMessage(
      pathname,
      "error",
      firstValidationError(
        result.error.issues,
      ),
    );
  }

  const supabase =
    await createClient();

  /*
   * The RPC performs its own ownership and transition checks.
   * The vendor ID is not sent by the browser.
   */
  const { error } =
    await supabase.rpc(
      "update_vendor_order_status",
      {
        p_order_id:
          result.data.orderId,

        p_next_status:
          result.data.nextStatus,

        p_rejection_reason:
          result.data.rejectionReason ?? "",
      },
    );

  if (error) {
    console.error(
      "Vendor order status error:",
      {
        vendorId: vendor.id,
        orderId:
          result.data.orderId,
        message:
          error.message,
      },
    );

    redirectWithMessage(
      `/vendor/orders/${result.data.orderId}`,
      "error",
      vendorOrderError(
        error.message,
      ),
    );
  }

  revalidatePath("/vendor");
  revalidatePath("/vendor/orders");

  revalidatePath(
    `/vendor/orders/${result.data.orderId}`,
  );

  revalidatePath("/customer");
  revalidatePath("/customer/orders");

  revalidatePath(
    `/customer/orders/${result.data.orderId}`,
  );

  redirectWithMessage(
    `/vendor/orders/${result.data.orderId}`,
    "message",
    successMessage(
      result.data.nextStatus,
    ),
  );
}