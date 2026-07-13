import { CartPageClient } from "@/components/cart/cart-page-client";
import { PublicShell } from "@/components/layout/public-shell";

export default function CartPage() {
  return (
    <PublicShell>
      <CartPageClient />
    </PublicShell>
  );
}