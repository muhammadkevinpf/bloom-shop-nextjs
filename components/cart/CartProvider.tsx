"use client";

import { AUTH_CHANGE_EVENT } from "@/lib/services/auth";
import { useCartStore } from "@/lib/store/cart-store";
import { useEffect } from "react";

/**
 * Loads the server-side cart on mount and re-syncs whenever the session
 * changes (sign in, sign out, token refresh), so the header badge and cart page
 * always reflect the backend.
 */
export default function CartProvider() {
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    fetchCart();

    const handleAuthChange = () => {
      fetchCart();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, [fetchCart]);

  return null;
}
