import { CheckoutClient } from "@/components/checkout/checkout-client";
import { requireRole } from "@/lib/auth/guards";

export default async function CheckoutPage() {
  const { profile } =
    await requireRole("customer");

  return (
    <CheckoutClient
      defaultName={
        profile.full_name
      }
      defaultPhone={
        profile.phone ?? ""
      }
    />
  );
}