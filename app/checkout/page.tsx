"use client";

import EmptyCart from "@/components/cart/EmptyCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Label from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { calculateTotals, formatPrice } from "@/lib/pricing";
import { orderService } from "@/lib/services/order";
import { selectCartCount, selectCartTotal, useCartStore } from "@/lib/store/cart-store";
import { AddressSnapshot } from "@/types/order";
import { AlertCircle, ArrowLeft, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EMPTY_ADDRESS: AddressSnapshot = {
  recipientName: "",
  phoneNumber: "",
  streetLine1: "",
  streetLine2: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  countryCode: "ID",
};

type AddressField = keyof AddressSnapshot;

const REQUIRED_FIELDS: Array<{ key: AddressField; label: string }> = [
  { key: "recipientName", label: "Recipient name" },
  { key: "phoneNumber", label: "Phone number" },
  { key: "streetLine1", label: "Street address" },
  { key: "city", label: "City" },
  { key: "stateProvince", label: "State / province" },
  { key: "postalCode", label: "Postal code" },
  { key: "countryCode", label: "Country code" },
];

export default function Checkout() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const hasLoaded = useCartStore((state) => state.hasLoaded);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const reset = useCartStore((state) => state.reset);

  const subtotal = useCartStore(selectCartTotal);
  const itemCount = useCartStore(selectCartCount);
  const totals = calculateTotals(subtotal);

  const [address, setAddress] = useState<AddressSnapshot>(EMPTY_ADDRESS);
  const [notes, setNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AddressField, string>>>({});

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateField = (key: AddressField, value: string) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const errors: Partial<Record<AddressField, string>> = {};
    REQUIRED_FIELDS.forEach(({ key, label }) => {
      if (!address[key]?.trim()) errors[key] = `${label} is required`;
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    setIsPlacingOrder(true);
    setError(null);

    try {
      const res = await orderService.checkout({
        cartItemIds: items.map((item) => item.id),
        shippingAddress: {
          ...address,
          streetLine2: address.streetLine2?.trim() || undefined,
        },
        notes: notes.trim() || undefined,
      });

      // Checkout removes the purchased items on the server, so drop the local copy.
      reset();
      router.push(`/orders/${res.data.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place your order.");
      setIsPlacingOrder(false);
    }
  };

  if (!hasLoaded) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading checkout...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
          <p className="text-muted-foreground mt-2">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/cart" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient name</Label>
                  <Input
                    id="recipientName"
                    value={address.recipientName}
                    onChange={(e) => updateField("recipientName", e.target.value)}
                    placeholder="Jane Doe"
                  />
                  {fieldErrors.recipientName && (
                    <p className="text-xs text-destructive">{fieldErrors.recipientName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone number</Label>
                  <Input
                    id="phoneNumber"
                    value={address.phoneNumber}
                    onChange={(e) => updateField("phoneNumber", e.target.value)}
                    placeholder="+62 812 3456 7890"
                  />
                  {fieldErrors.phoneNumber && (
                    <p className="text-xs text-destructive">{fieldErrors.phoneNumber}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetLine1">Street address</Label>
                <Input
                  id="streetLine1"
                  value={address.streetLine1}
                  onChange={(e) => updateField("streetLine1", e.target.value)}
                  placeholder="Jl. Bloom No. 123"
                />
                {fieldErrors.streetLine1 && (
                  <p className="text-xs text-destructive">{fieldErrors.streetLine1}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetLine2">Apartment, suite, etc. (optional)</Label>
                <Input
                  id="streetLine2"
                  value={address.streetLine2 ?? ""}
                  onChange={(e) => updateField("streetLine2", e.target.value)}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={address.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                  {fieldErrors.city && (
                    <p className="text-xs text-destructive">{fieldErrors.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stateProvince">State / province</Label>
                  <Input
                    id="stateProvince"
                    value={address.stateProvince}
                    onChange={(e) => updateField("stateProvince", e.target.value)}
                  />
                  {fieldErrors.stateProvince && (
                    <p className="text-xs text-destructive">{fieldErrors.stateProvince}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input
                    id="postalCode"
                    value={address.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                  />
                  {fieldErrors.postalCode && (
                    <p className="text-xs text-destructive">{fieldErrors.postalCode}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 sm:w-1/3">
                <Label htmlFor="countryCode">Country code</Label>
                <Input
                  id="countryCode"
                  value={address.countryCode}
                  onChange={(e) => updateField("countryCode", e.target.value.toUpperCase())}
                  maxLength={2}
                  placeholder="ID"
                />
                {fieldErrors.countryCode && (
                  <p className="text-xs text-destructive">{fieldErrors.countryCode}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Order notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery instructions, gift message, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground line-clamp-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (11%)</span>
                  <span className="font-medium">{formatPrice(totals.tax)}</span>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(totals.total)}
                  </span>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing Order...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Place Order
                  </div>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Payment is simulated on the next step.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
