import type { Metadata } from "next";

import { CartProvider } from "@/features/cart/cart-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CManagement",
    template: "%s | CManagement",
  },

  description:
    "A multi-vendor canteen menu, ordering and management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
<body suppressHydrationWarning>
  <CartProvider>{children}</CartProvider>
</body>
    </html>
  );
}