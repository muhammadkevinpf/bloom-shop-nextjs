"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/pricing";
import { orderService } from "@/lib/services/order";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-slate-100 text-slate-800",
};

const toMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params?.orderNumber;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"pay" | "complete" | null>(null);

  useEffect(() => {
    if (!orderNumber) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await orderService.getOrderByNumber(orderNumber);
        if (!cancelled) setOrder(res.data);
      } catch (err) {
        if (!cancelled) setError(toMessage(err, "Could not load this order"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  const runAction = async (action: "pay" | "complete") => {
    if (!orderNumber) return;

    setPendingAction(action);
    setError(null);

    try {
      const res =
        action === "pay"
          ? await orderService.payOrder(orderNumber)
          : await orderService.completeOrder(orderNumber);
      setOrder(res.data);
    } catch (err) {
      setError(toMessage(err, "Could not update this order"));
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Order not found</h1>
          <p className="text-muted-foreground">{error ?? "This order does not exist."}</p>
          <Button asChild>
            <Link href="/orders">View My Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canPay = order.paymentStatus === "PENDING" && order.status !== "CANCELLED";
  const canComplete =
    order.paymentStatus === "PAID" &&
    order.status !== "DELIVERED" &&
    order.status !== "CANCELLED";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{order.orderNumber}</h1>
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
                ORDER_STATUS_STYLES[order.status]
              )}
            >
              {order.status.toLowerCase()}
            </span>
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
                PAYMENT_STATUS_STYLES[order.paymentStatus]
              )}
            >
              payment {order.paymentStatus.toLowerCase()}
            </span>
          </div>
          <p className="text-muted-foreground mt-2">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/orders" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              My Orders
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
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
          <div className="rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground line-clamp-2">
                        {item.productName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {[item.color, item.size].filter(Boolean).join(" / ")}
                        {item.sku ? ` • ${item.sku}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-foreground shrink-0">
                      {formatPrice(item.totalPrice)}
                    </p>
                  </div>
                  {index < order.items.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Shipping Address</h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                {order.shippingAddress.recipientName}
              </p>
              <p>{order.shippingAddress.phoneNumber}</p>
              <p>{order.shippingAddress.streetLine1}</p>
              {order.shippingAddress.streetLine2 && <p>{order.shippingAddress.streetLine2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.stateProvince}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.countryCode}</p>
              {order.notes && <p className="pt-2 italic">Notes: {order.notes}</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border p-6 sticky top-4 space-y-4">
            <h2 className="font-semibold text-foreground">Payment Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatPrice(order.taxAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>

            {canPay && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => runAction("pay")}
                disabled={pendingAction !== null}
              >
                {pendingAction === "pay" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Pay Now (Simulated)
              </Button>
            )}

            {canComplete && (
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => runAction("complete")}
                disabled={pendingAction !== null}
              >
                {pendingAction === "complete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Mark as Delivered
              </Button>
            )}

            {order.status === "DELIVERED" && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                <Package className="h-4 w-4" />
                This order has been delivered.
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Payment and delivery are simulated by the order service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
