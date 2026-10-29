"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItem as CartItemType, useCartStore } from "@/lib/store/cart-store";
import { ImageOff, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface CartItemProps {
  item: CartItemType;
  isLast: boolean;
}

export default function CartItem({ item, isLast }: CartItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const isPending = useCartStore((state) => state.pendingItemIds.includes(item.id));
  const [isRemoving, setIsRemoving] = useState(false);

  const variantLabel = [item.color, item.size].filter(Boolean).join(" / ");
  const busy = isPending || isRemoving;

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeItem(item.id);
    } catch {
      // The store rolls back the optimistic update and records the error.
    } finally {
      setIsRemoving(false);
    }
  };

  const handleQuantityChange = async (nextQuantity: number) => {
    if (nextQuantity < 1) return;
    try {
      await updateQuantity(item.id, nextQuantity);
    } catch {
      // Handled by the store.
    }
  };

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="relative w-[100px] h-[100px] shrink-0">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="100px"
              className="rounded-lg object-cover bg-muted"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
              <ImageOff className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="font-semibold text-foreground line-clamp-2">
                {item.name}
              </h2>
              {variantLabel && (
                <p className="text-sm text-muted-foreground mt-1">{variantLabel}</p>
              )}
              {item.sku && (
                <p className="text-xs text-muted-foreground mt-1">SKU: {item.sku}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                ${item.price.toFixed(2)} each
              </p>
              {!item.isAvailable && (
                <p className="text-sm text-destructive mt-1">
                  This variant is no longer available.
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={busy}
              aria-label={`Remove ${item.name} from cart`}
              className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center border border-border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={busy || item.quantity <= 1}
                aria-label="Decrease quantity"
                className="h-8 w-8 rounded-r-none"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="px-4 py-2 min-w-[50px] text-center text-sm font-medium">
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                ) : (
                  item.quantity
                )}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={busy}
                aria-label="Increase quantity"
                className="h-8 w-8 rounded-l-none"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!isLast && <Separator className="mt-4" />}
    </div>
  );
}
