"use client";

import CartItemList from "@/components/cart/CartItemList";
import EmptyCart from "@/components/cart/EmptyCart";
import OrderSummary from "@/components/cart/OrderSummary";
import Recommendations from "@/components/cart/Recommendations";
import { Button } from "@/components/ui/button";
import { selectCartCount, useCartStore } from "@/lib/store/cart-store";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Cart() {
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore(selectCartCount);
  const hasLoaded = useCartStore((state) => state.hasLoaded);
  const isLoading = useCartStore((state) => state.isLoading);
  const error = useCartStore((state) => state.error);
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (!hasLoaded) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading your cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
          <p className="text-muted-foreground mt-2">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <Button
          variant="ghost"
          asChild
          className="text-muted-foreground hover:text-foreground"
        >
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <CartItemList />
        </div>

        <div className="lg:col-span-1">
          <OrderSummary />
        </div>
      </div>

      {isLoading && (
        <p className="sr-only" aria-live="polite">
          Updating cart
        </p>
      )}

      <Recommendations />
    </div>
  );
}
