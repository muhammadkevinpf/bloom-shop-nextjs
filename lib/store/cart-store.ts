import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { CartItem } from "@/types/cart";
import { cartService, enrichCartItems } from "@/lib/services/cart";
import { UnauthorizedError } from "@/lib/services/api";
import { getStoredTokens } from "@/lib/services/auth";

export type { CartItem } from "@/types/cart";

export interface CartStore {
  /** Cart items enriched with catalog data. The backend remains the source of truth. */
  items: CartItem[];
  isLoading: boolean;
  /** True once the first fetch settles, so the page can show a skeleton. */
  hasLoaded: boolean;
  /** Cart item ids with a request in flight, so rows can disable their controls. */
  pendingItemIds: string[];
  error: string | null;

  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  reset: () => void;
}

const toMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

const withPending = (ids: string[], id: string) =>
  ids.includes(id) ? ids : [...ids, id];

const withoutPending = (ids: string[], id: string) =>
  ids.filter((pendingId) => pendingId !== id);

/** Collapses concurrent reads (header badge and cart page mount together). */
let inFlightFetch: Promise<void> | null = null;

export const useCartStore = create<CartStore>()(
  devtools(
    (set, get) => ({
      items: [],
      isLoading: false,
      hasLoaded: false,
      pendingItemIds: [],
      error: null,

      fetchCart: async () => {
        // Signed out: the cart is empty and there is nothing to fetch.
        if (!getStoredTokens()?.access_token) {
          set({ items: [], isLoading: false, hasLoaded: true, error: null });
          return;
        }

        if (inFlightFetch) return inFlightFetch;

        set({ isLoading: true, error: null });

        inFlightFetch = (async () => {
          try {
            const res = await cartService.getCart();
            const items = await enrichCartItems(res.data ?? []);
            set({ items, isLoading: false, hasLoaded: true, error: null });
          } catch (error) {
            const message =
              error instanceof UnauthorizedError
                ? "Your session has expired. Please sign in again."
                : toMessage(error);
            set({ items: [], isLoading: false, hasLoaded: true, error: message });
          } finally {
            inFlightFetch = null;
          }
        })();

        return inFlightFetch;
      },

      addItem: async (variantId, quantity = 1) => {
        set({ isLoading: true, error: null });

        try {
          await cartService.addItem(variantId, quantity);
          // The API increments an existing line instead of returning the merged
          // quantity, so re-read the cart to stay in sync with the server.
          const res = await cartService.getCart();
          const items = await enrichCartItems(res.data ?? []);
          set({ items, isLoading: false, hasLoaded: true, error: null });
        } catch (error) {
          const message =
            error instanceof UnauthorizedError
              ? "Your session has expired. Please sign in again."
              : toMessage(error);
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      updateQuantity: async (itemId, quantity) => {
        const previous = get().items;
        const next = previous.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );

        // Apply optimistically, then reconcile with the server.
        set({
          items: next,
          pendingItemIds: withPending(get().pendingItemIds, itemId),
          error: null,
        });

        try {
          await cartService.updateItemQuantity(itemId, quantity);
          set({ pendingItemIds: withoutPending(get().pendingItemIds, itemId) });
        } catch (error) {
          set({
            items: previous,
            pendingItemIds: withoutPending(get().pendingItemIds, itemId),
            error: toMessage(error),
          });
          throw error;
        }
      },

      removeItem: async (itemId) => {
        const previous = get().items;
        set({
          items: previous.filter((item) => item.id !== itemId),
          pendingItemIds: withPending(get().pendingItemIds, itemId),
          error: null,
        });

        try {
          await cartService.removeItem(itemId);
          set({ pendingItemIds: withoutPending(get().pendingItemIds, itemId) });
        } catch (error) {
          set({
            items: previous,
            pendingItemIds: withoutPending(get().pendingItemIds, itemId),
            error: toMessage(error),
          });
          throw error;
        }
      },

      clearCart: async () => {
        const previous = get().items;
        if (previous.length === 0) return;

        set({
          items: [],
          pendingItemIds: previous.map((item) => item.id),
          error: null,
        });

        try {
          await cartService.clearCart(previous.map((item) => item.id));
          set({ pendingItemIds: [] });
        } catch (error) {
          // Some removals may have succeeded, so re-read instead of restoring a
          // list that no longer matches the server.
          set({ pendingItemIds: [], error: toMessage(error) });
          await get().fetchCart();
          throw error;
        }
      },

      reset: () =>
        set({
          items: [],
          isLoading: false,
          hasLoaded: false,
          pendingItemIds: [],
          error: null,
        }),
    }),
    { name: "cart-store" }
  )
);

// Computed Selectors
export const selectCartCount = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
