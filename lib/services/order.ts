import { request } from "./api";
import { CheckoutRequest, OrderPageResponse, OrderResponse } from "@/types/order";

export const orderService = {
  /** GET /api/v1/orders — paginated order history for the current customer. */
  async getOrders(page = 0, size = 10): Promise<OrderPageResponse> {
    return request(`/api/v1/orders?page=${page}&size=${size}`, { auth: true });
  },

  /**
   * POST /api/v1/orders/checkout — turns the selected cart items into an order.
   * The backend removes those items from the cart as part of checkout.
   */
  async checkout(payload: CheckoutRequest): Promise<OrderResponse> {
    return request("/api/v1/orders/checkout", {
      method: "POST",
      auth: true,
      body: payload,
    });
  },

  /** GET /api/v1/orders/{orderNumber} — single order detail. */
  async getOrderByNumber(orderNumber: string): Promise<OrderResponse> {
    return request(`/api/v1/orders/${encodeURIComponent(orderNumber)}`, { auth: true });
  },

  /** POST /api/v1/orders/{orderNumber}/pay — mock payment, moves the order to SHIPPED. */
  async payOrder(orderNumber: string): Promise<OrderResponse> {
    return request(`/api/v1/orders/${encodeURIComponent(orderNumber)}/pay`, {
      method: "POST",
      auth: true,
    });
  },

  /** POST /api/v1/orders/{orderNumber}/complete — mock delivery, moves the order to DELIVERED. */
  async completeOrder(orderNumber: string): Promise<OrderResponse> {
    return request(`/api/v1/orders/${encodeURIComponent(orderNumber)}/complete`, {
      method: "POST",
      auth: true,
    });
  },
};
