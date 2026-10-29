import { ApiResponse, PageableData } from "./apiResponse";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface AddressSnapshot {
  recipientName: string;
  phoneNumber: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string;
}

export interface OrderItem {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  color?: string;
  size?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotalAmount: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: AddressSnapshot;
  billingAddress?: AddressSnapshot | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequest {
  cartItemIds: string[];
  shippingAddress: AddressSnapshot;
  billingAddress?: AddressSnapshot;
  notes?: string;
}

export type OrderResponse = ApiResponse<Order>;
export type OrderPageResponse = ApiResponse<PageableData<Order>>;
