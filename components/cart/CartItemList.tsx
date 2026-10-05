"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartItem as CartItemType, useCartHydrated, useCartStore } from "@/lib/store/cart-store";
import { Trash2 } from "lucide-react";
import CartItem from "./CartItem";

const emptyItems: CartItemType[] = [];

export default function CartItemList() {
  const cart = useCartHydrated((state) => state.cart, emptyItems);
  const clearCart = useCartStore((state) => state.clearCart);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Cart Items</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {cart.map((item, index) => (
          <CartItem
            key={`${item.id}-${index}`}
            item={item}
            isLast={index === cart.length - 1}
          />
        ))}
      </CardContent>
    </Card>
  );
}
