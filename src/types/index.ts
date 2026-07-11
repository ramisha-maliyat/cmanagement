import type { Database } from "@/types/database";

export type Profile =
  Database["public"]["Tables"]["profiles"]["Row"];

export type Vendor =
  Database["public"]["Tables"]["vendors"]["Row"];

export type Canteen =
  Database["public"]["Tables"]["canteens"]["Row"];

export type MenuCategory =
  Database["public"]["Tables"]["menu_categories"]["Row"];

export type MenuItem =
  Database["public"]["Tables"]["menu_items"]["Row"];

export type Order =
  Database["public"]["Tables"]["orders"]["Row"];

export type OrderItem =
  Database["public"]["Tables"]["order_items"]["Row"];

export type Payment =
  Database["public"]["Tables"]["payments"]["Row"];

export type AppRole =
  Database["public"]["Enums"]["app_role"];

export type VendorStatus =
  Database["public"]["Enums"]["vendor_status"];

export type OrderStatus =
  Database["public"]["Enums"]["order_status"];

export type PaymentStatus =
  Database["public"]["Enums"]["payment_status"];

export type PaymentMethod =
  Database["public"]["Enums"]["payment_method"];

export type FulfillmentType =
  Database["public"]["Enums"]["fulfillment_type"];