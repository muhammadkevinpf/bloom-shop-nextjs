import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

export interface CartStore {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: number) => void;
    updateQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set) => ({
            cart: [],
            addToCart: (item) =>
                set((state) => {
                    const existing = state.cart.find((i) => i.id === item.id);
                    if (existing) {
                        return {
                            cart: state.cart.map((i) =>
                                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                            ),
                        };
                    }
                    return {
                        cart: [...state.cart, { ...item, quantity: 1 }],
                    };
                }),
            removeFromCart: (id) =>
                set((state) => ({
                    cart: state.cart.filter((i) => i.id !== id),
                })),
            updateQuantity: (id, quantity) =>
                set((state) => ({
                    cart: state.cart.map((i) =>
                        i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
                    ),
                })),
            clearCart: () =>
                set(() => ({
                    cart: [],
                })),
        }),
        {
            name: "cart-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// Computed Selectors
export const selectCartCount = (state: CartStore) =>
    state.cart.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state: CartStore) =>
    state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

const emptySubscribe = () => () => {};

// SSR/Hydration safe hook helper for client components
export function useCartHydrated<T>(selector: (state: CartStore) => T, fallback: T): T {
    const storeValue = useCartStore(selector);
    const isClient = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false
    );

    return isClient ? storeValue : fallback;
}