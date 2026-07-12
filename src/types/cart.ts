export type CartItemInput = {
  menuItemId: string;

  vendorId: string;
  vendorName: string;
  vendorSlug: string;

  canteenId: string;
  canteenName: string;
  canteenSlug: string;

  categoryId: string;

  name: string;
  price: number;
  imageUrl: string | null;
  preparationMinutes: number;

  trackStock: boolean;
  stockQuantity: number;

  currencyCode: string;
};

export type CartItem = CartItemInput & {
  quantity: number;
};

export type ShoppingCart = {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;

  canteenId: string;
  canteenName: string;
  canteenSlug: string;

  currencyCode: string;

  items: CartItem[];
};

export type AddToCartResult =
  | "added"
  | "different-canteen";