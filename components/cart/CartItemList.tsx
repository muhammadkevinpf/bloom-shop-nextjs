"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/lib/store/cart-store";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import CartItem from "./CartItem";

export default function CartItemList() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await clearCart();
    } catch {
      // The store surfaces the failure through `error`.
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Cart Items</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={isClearing}
          className="text-muted-foreground hover:text-destructive"
        >
          {isClearing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Clear All
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <CartItem
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </CardContent>
    </Card>
  );
}
