"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FREE_SHIPPING_THRESHOLD,
  calculateTotals,
  formatPrice,
} from "@/lib/pricing";
import { selectCartCount, selectCartTotal, useCartStore } from "@/lib/store/cart-store";
import { CreditCard, Heart, Shield, Truck } from "lucide-react";
import Link from "next/link";

export default function OrderSummary() {
  const subtotal = useCartStore(selectCartTotal);
  const itemCount = useCartStore(selectCartCount);
  const hasUnavailableItems = useCartStore((state) =>
    state.items.some((item) => !item.isAvailable)
  );

  // Mirrors the order service calculation so the summary matches what checkout charges.
  const { shipping, tax, total } = calculateTotals(subtotal);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({itemCount} items)
            </span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? (
                <Badge variant="secondary" className="text-xs">
                  Free
                </Badge>
              ) : (
                formatPrice(shipping)
              )}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (11%)</span>
            <span className="font-medium">{formatPrice(tax)}</span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {shipping > 0 && (
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-accent-foreground" />
              <span className="text-sm font-medium text-accent-foreground">
                Free shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more to qualify!
            </p>
          </div>
        )}

        {hasUnavailableItems ? (
          <Button size="lg" className="w-full" disabled>
            <CreditCard className="h-4 w-4" />
            Remove unavailable items to continue
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            asChild
          >
            <Link href="/checkout" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Proceed to Checkout
            </Link>
          </Button>
        )}

        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Secure SSL checkout</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Truck className="h-4 w-4 text-blue-500" />
            <span>Free returns within 30 days</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-red-500" />
            <span>24/7 customer support</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
