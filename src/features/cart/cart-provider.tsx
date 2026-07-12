"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  AddToCartResult,
  CartItemInput,
  ShoppingCart,
} from "@/types/cart";

const STORAGE_KEY = "cmanagement-shopping-cart-v1";

type AddItemOptions = {
  replaceExisting?: boolean;
};

type CartContextValue = {
  cart: ShoppingCart | null;
  hydrated: boolean;
  itemCount: number;
  subtotal: number;

  addItem: (
    item: CartItemInput,
    options?: AddItemOptions,
  ) => AddToCartResult;

  updateQuantity: (
    menuItemId: string,
    quantity: number,
  ) => void;

  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
};

const CartContext =
  createContext<CartContextValue | null>(null);

function createCartFromItem(
  item: CartItemInput,
): ShoppingCart {
  return {
    vendorId: item.vendorId,
    vendorName: item.vendorName,
    vendorSlug: item.vendorSlug,

    canteenId: item.canteenId,
    canteenName: item.canteenName,
    canteenSlug: item.canteenSlug,

    currencyCode: item.currencyCode,

    items: [
      {
        ...item,
        quantity: 1,
      },
    ],
  };
}

function isStoredCart(
  value: unknown,
): value is ShoppingCart {
  if (
    !value ||
    typeof value !== "object" ||
    !("items" in value)
  ) {
    return false;
  }

  const candidate = value as {
    canteenId?: unknown;
    currencyCode?: unknown;
    items?: unknown;
  };

  return (
    typeof candidate.canteenId === "string" &&
    typeof candidate.currencyCode === "string" &&
    Array.isArray(candidate.items)
  );
}

export function CartProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [cart, setCart] =
    useState<ShoppingCart | null>(null);

  const [hydrated, setHydrated] =
    useState(false);

  useEffect(() => {
    try {
      const storedValue =
        window.localStorage.getItem(STORAGE_KEY);

      if (storedValue) {
        const parsedValue: unknown =
          JSON.parse(storedValue);

        if (isStoredCart(parsedValue)) {
          setCart(parsedValue);
        }
      }
    } catch (error) {
      console.error(
        "Could not restore cart:",
        error,
      );

      window.localStorage.removeItem(
        STORAGE_KEY,
      );
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!cart || cart.items.length === 0) {
      window.localStorage.removeItem(
        STORAGE_KEY,
      );

      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cart),
    );
  }, [cart, hydrated]);

  function addItem(
    item: CartItemInput,
    options: AddItemOptions = {},
  ): AddToCartResult {
    if (
      cart &&
      cart.canteenId !== item.canteenId &&
      !options.replaceExisting
    ) {
      return "different-canteen";
    }

    setCart((currentCart) => {
      if (
        !currentCart ||
        currentCart.canteenId !== item.canteenId
      ) {
        return createCartFromItem(item);
      }

      const existingItem =
        currentCart.items.find(
          (cartItem) =>
            cartItem.menuItemId ===
            item.menuItemId,
        );

      if (!existingItem) {
        return {
          ...currentCart,
          items: [
            ...currentCart.items,
            {
              ...item,
              quantity: 1,
            },
          ],
        };
      }

      const maximumQuantity =
        item.trackStock
          ? item.stockQuantity
          : Number.MAX_SAFE_INTEGER;

      return {
        ...currentCart,
        items: currentCart.items.map(
          (cartItem) =>
            cartItem.menuItemId ===
            item.menuItemId
              ? {
                  ...cartItem,
                  quantity: Math.min(
                    cartItem.quantity + 1,
                    maximumQuantity,
                  ),
                }
              : cartItem,
        ),
      };
    });

    return "added";
  }

  function updateQuantity(
    menuItemId: string,
    quantity: number,
  ): void {
    setCart((currentCart) => {
      if (!currentCart) {
        return null;
      }

      if (quantity <= 0) {
        const remainingItems =
          currentCart.items.filter(
            (item) =>
              item.menuItemId !== menuItemId,
          );

        return remainingItems.length > 0
          ? {
              ...currentCart,
              items: remainingItems,
            }
          : null;
      }

      return {
        ...currentCart,

        items: currentCart.items.map(
          (item) => {
            if (
              item.menuItemId !== menuItemId
            ) {
              return item;
            }

            const maximumQuantity =
              item.trackStock
                ? item.stockQuantity
                : Number.MAX_SAFE_INTEGER;

            return {
              ...item,
              quantity: Math.min(
                Math.max(1, quantity),
                maximumQuantity,
              ),
            };
          },
        ),
      };
    });
  }

  function removeItem(
    menuItemId: string,
  ): void {
    setCart((currentCart) => {
      if (!currentCart) {
        return null;
      }

      const remainingItems =
        currentCart.items.filter(
          (item) =>
            item.menuItemId !== menuItemId,
        );

      return remainingItems.length > 0
        ? {
            ...currentCart,
            items: remainingItems,
          }
        : null;
    });
  }

  function clearCart(): void {
    setCart(null);
  }

  const itemCount = useMemo(
    () =>
      cart?.items.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      ) ?? 0,
    [cart],
  );

  const subtotal = useMemo(
    () =>
      cart?.items.reduce(
        (total, item) =>
          total +
          item.price * item.quantity,
        0,
      ) ?? 0,
    [cart],
  );

  const contextValue =
    useMemo<CartContextValue>(
      () => ({
        cart,
        hydrated,
        itemCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }),
      [
        cart,
        hydrated,
        itemCount,
        subtotal,
      ],
    );

  return (
    <CartContext.Provider
      value={contextValue}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider.",
    );
  }

  return context;
}