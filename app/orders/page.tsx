"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import { orderService } from "@/lib/services/order";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const PAGE_SIZE = 10;

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

interface OrderPage {
  content: Order[];
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  totalElements: number;
}

export default function OrdersPage() {
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<OrderPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Loading and error are set inside the async body rather than
      // synchronously in the effect, so paging does not cascade renders.
      setIsLoading(true);
      setError(null);

      try {
        const res = await orderService.getOrders(page, PAGE_SIZE);
        if (!cancelled) setData(res.data as unknown as OrderPage);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your orders");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground mt-2">
            Track and review your past purchases
          </p>
        </div>

        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="max-w-lg mx-auto py-32 text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => setReloadKey((key) => key + 1)}>Try Again</Button>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="max-w-lg mx-auto py-32 text-center space-y-4">
          <Package className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">No orders yet</h2>
          <p className="text-muted-foreground">
            Once you place an order, it will appear here.
          </p>
          <Button asChild>
            <Link href="/">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.content.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.orderNumber}`}
              className="block rounded-xl border border-border p-6 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {order.orderNumber}
                    </span>
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
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(order.createdAt).toLocaleString()} •{" "}
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </p>
                </div>

                <span className="text-lg font-bold text-foreground">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </Link>
          ))}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={!data.hasPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page + 1} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => current + 1)}
                disabled={!data.hasNext}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
