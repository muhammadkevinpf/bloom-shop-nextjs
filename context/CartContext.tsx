"use client";

import React, { createContext, useContext } from "react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (name: number) => void;
  clearCart: () => void;
  updateQuantity: (id: number, quantity: number) => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

const CART_STORAGE_EVENT = "cart-storage-change";
const emptyCart: CartItem[] = [];

function getCartSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem("cart") || "[]";
  } catch {
    return "[]";
  }
}

function getCartServerSnapshot(): string {
  return "[]";
}

function subscribeCart(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (e: StorageEvent) => {
    if (!e.key || e.key === "cart") callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CART_STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CART_STORAGE_EVENT, callback);
  };
}

function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem("cart", JSON.stringify(items));
    window.dispatchEvent(new Event(CART_STORAGE_EVENT));
  } catch {
    // Ignore write failures in private browsing/quotas
  }
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const cartJson = React.useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getCartServerSnapshot
  );

  const cart: CartItem[] = React.useMemo(() => {
    try {
      return JSON.parse(cartJson);
    } catch {
      return emptyCart;
    }
  }, [cartJson]);

  const addToCart = (item: CartItem) => {
    const existingIndex = cart.findIndex((cartItem) => cartItem.id === item.id);
    let newCart: CartItem[];
    if (existingIndex > -1) {
      newCart = cart.map((cartItem, idx) =>
        idx === existingIndex
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      newCart = [...cart, { ...item, quantity: 1 }];
    }
    saveCartToStorage(newCart);
  };

  const removeFromCart = (id: number) => {
    const newCart = cart.filter((item) => item.id !== id);
    saveCartToStorage(newCart);
  };

  const clearCart = () => {
    saveCartToStorage([]);
  };

  const updateQuantity = (id: number, quantity: number) => {
    const newCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    );
    saveCartToStorage(newCart);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
