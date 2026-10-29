import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OrderStatus, PaymentStatus } from "@/types/order";

const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING: "border-transparent bg-amber-100 text-amber-900",
  CONFIRMED: "border-transparent bg-blue-100 text-blue-900",
  SHIPPED: "border-transparent bg-indigo-100 text-indigo-900",
  DELIVERED: "border-transparent bg-green-100 text-green-900",
  CANCELLED: "border-transparent bg-red-100 text-red-900",
};

const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  PENDING: "border-transparent bg-amber-100 text-amber-900",
  PAID: "border-transparent bg-green-100 text-green-900",
  FAILED: "border-transparent bg-red-100 text-red-900",
  REFUNDED: "border-transparent bg-gray-200 text-gray-900",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={cn("capitalize", ORDER_STATUS_CLASSES[status])}>
      {status.toLowerCase()}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={cn("capitalize", PAYMENT_STATUS_CLASSES[status])}>
      {status.toLowerCase()}
    </Badge>
  );
}
