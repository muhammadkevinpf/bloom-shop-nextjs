import { ApiResponse } from "./apiResponse";

/** Cart item exactly as the order service stores it: a variant and a quantity. */
export interface ApiCartItem {
  id: string;
  variantId: string;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Cart item enriched with catalog data for rendering. The backend cart only
 * knows `variantId`, so name/price/image are resolved from the catalog service.
 */
export interface CartItem {
  /** Cart item id — the value the update/delete cart routes expect. */
  id: string;
  variantId: string;
  productId?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  sku?: string;
  color?: string;
  size?: string;
  /** False when the variant can no longer be resolved in the catalog. */
  isAvailable: boolean;
}

export type CartResponse = ApiResponse<ApiCartItem[]>;
