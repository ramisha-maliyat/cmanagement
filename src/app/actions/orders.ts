"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createOrderSchema } from "@/lib/validations/order";

type CreateOrderSuccess = {
  success: true;
  orderId: string;
  orderNumber: string;
  totalAmount: number;
};

type CreateOrderFailure = {
  success: false;
  error: string;
};

type CreateOrderResult =
  | CreateOrderSuccess
  | CreateOrderFailure;

function firstValidationError(
  issues: Array<{
    message: string;
  }>,
): string {
  return issues[0]?.message ??
    "Check your checkout information.";
}

function orderDatabaseError(
  message: string,
): string {
  const lowerMessage =
    message.toLowerCase();

  if (
    lowerMessage.includes(
      "insufficient stock",
    )
  ) {
    return message;
  }

  if (
    lowerMessage.includes(
      "currently unavailable",
    )
  ) {
    return message;
  }

  if (
    lowerMessage.includes(
      "category",
    ) &&
    lowerMessage.includes(
      "inactive",
    )
  ) {
    return message;
  }

  if (
    lowerMessage.includes(
      "canteen is currently inactive",
    )
  ) {
    return "This canteen is currently unavailable.";
  }

  if (
    lowerMessage.includes(
      "vendor is not currently",
    )
  ) {
    return "This vendor is not currently accepting orders.";
  }

  if (
    lowerMessage.includes(
      "pickup time",
    )
  ) {
    return message;
  }

  if (
    lowerMessage.includes(
      "only customer accounts",
    )
  ) {
    return "Only customer accounts can place orders.";
  }

  if (
    lowerMessage.includes(
      "authentication is required",
    )
  ) {
    return "Your session has expired. Sign in again.";
  }

  return "The order could not be created. Review your cart and try again.";
}

export async function createOrderAction(
  input: unknown,
): Promise<CreateOrderResult> {
  await requireRole("customer");

  const result =
    createOrderSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: firstValidationError(
        result.error.issues,
      ),
    };
  }

  const supabase =
    await createClient();

  const { data, error } =
    await supabase.rpc(
      "create_order",
      {
        p_canteen_id:
          result.data.canteenId,

        p_customer_name:
          result.data.customerName,

        p_customer_phone:
          result.data.customerPhone ?? "",

        p_pickup_time:
          result.data.pickupTime,

        p_notes:
          result.data.notes ?? "",

        p_payment_method:
          result.data.paymentMethod,

        p_items:
          result.data.items,
      },
    );

  if (error) {
    console.error(
      "Create order error:",
      error.message,
    );

    return {
      success: false,
      error: orderDatabaseError(
        error.message,
      ),
    };
  }

  const createdOrder =
    data?.[0];

  if (!createdOrder) {
    return {
      success: false,
      error:
        "The order was not returned by the database.",
    };
  }

  revalidatePath("/customer");
  revalidatePath("/customer/orders");
  revalidatePath("/vendors");
  revalidatePath("/cart");

  return {
    success: true,
    orderId:
      createdOrder.order_id,
    orderNumber:
      createdOrder.order_number,
    totalAmount:
      Number(
        createdOrder.total_amount,
      ),
  };
}