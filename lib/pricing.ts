/**
 * Mirrors `OrderService#calculateTotal` in the order service so the cart
 * summary shows the same numbers the checkout endpoint will charge.
 */
export const FREE_SHIPPING_THRESHOLD = 100;
export const STANDARD_SHIPPING_FEE = 15;
export const TAX_RATE = 0.11;

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function calculateTotals(subtotal: number): OrderTotals {
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const tax = round2(subtotal * TAX_RATE);

  return {
    subtotal: round2(subtotal),
    shipping,
    tax,
    total: round2(subtotal + shipping + tax),
  };
}

export const formatPrice = (value: number) => `$${value.toFixed(2)}`;
