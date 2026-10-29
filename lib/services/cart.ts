import { ApiResponse } from "@/types/apiResponse";
import { ApiCartItem, CartItem } from "@/types/cart";
import { ProductVariantDetail } from "@/types/product";
import { request } from "./api";
import { productService } from "./product";

export const cartService = {
  /** GET /api/v1/cart — all items in the authenticated customer's cart. */
  async getCart(): Promise<ApiResponse<ApiCartItem[]>> {
    return request<ApiCartItem[]>("/api/v1/cart", { auth: true });
  },

  /**
   * POST /api/v1/cart/items — adds a variant, or increments the quantity when
   * that variant is already in the cart.
   */
  async addItem(variantId: string, quantity = 1): Promise<ApiResponse<ApiCartItem>> {
    return request<ApiCartItem>("/api/v1/cart/items", {
      method: "POST",
      auth: true,
      body: { variantId, quantity },
    });
  },

  /**
   * PUT /api/v1/cart/items — sets the absolute quantity of one item.
   * The backend deletes the item when `newQuantity` is 0 or lower.
   */
  async updateItemQuantity(itemId: string, newQuantity: number): Promise<ApiResponse<boolean>> {
    return request<boolean>("/api/v1/cart/items", {
      method: "PUT",
      auth: true,
      body: { itemId, newQuantity },
    });
  },

  /** DELETE /api/v1/cart/items/{id} — removes a single item from the cart. */
  async removeItem(itemId: string): Promise<ApiResponse<boolean>> {
    return request<boolean>(`/api/v1/cart/items/${itemId}`, {
      method: "DELETE",
      auth: true,
    });
  },

  /**
   * The API exposes no "clear cart" route, so removal fans out over the
   * individual item ids. Rejects if any removal fails so the caller can
   * reconcile against the server.
   */
  async clearCart(itemIds: string[]): Promise<void> {
    const results = await Promise.allSettled(
      itemIds.map((itemId) => cartService.removeItem(itemId))
    );

    const failed = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );

    if (failed) throw failed.reason;
  },
};

/** Variant metadata is immutable, so it is safe to cache for the session. */
const variantCache = new Map<string, ProductVariantDetail | null>();

/** The variant payload has no image, so productId -> imageUrl is cached too. */
let productImageMapPromise: Promise<Map<string, string>> | null = null;

async function getVariant(variantId: string): Promise<ProductVariantDetail | null> {
  if (variantCache.has(variantId)) return variantCache.get(variantId) ?? null;

  try {
    const res = await productService.getVariantById(variantId);
    const variant = res.success ? res.data : null;
    variantCache.set(variantId, variant);
    return variant;
  } catch {
    variantCache.set(variantId, null);
    return null;
  }
}

/**
 * The catalog has no "product by id" route, so every product is listed once and
 * indexed by id to resolve images for cart lines.
 */
function getProductImageMap(): Promise<Map<string, string>> {
  if (!productImageMapPromise) {
    productImageMapPromise = productService
      .getAllProducts(0, 100)
      .then((res) => {
        const map = new Map<string, string>();
        res.data?.content?.forEach((product) => {
          if (product.imageUrl) map.set(product.id, product.imageUrl);
        });
        return map;
      })
      .catch(() => {
        // Allow a later call to retry instead of caching the failure.
        productImageMapPromise = null;
        return new Map<string, string>();
      });
  }

  return productImageMapPromise;
}

/**
 * The cart stores only `variantId`, so each item is expanded with catalog data
 * before it can be rendered or priced.
 */
export async function enrichCartItems(items: ApiCartItem[]): Promise<CartItem[]> {
  if (items.length === 0) return [];

  const [variants, imageMap] = await Promise.all([
    Promise.all(items.map((item) => getVariant(item.variantId))),
    getProductImageMap(),
  ]);

  return items.map((item, index) => {
    const variant = variants[index];

    if (!variant) {
      return {
        id: item.id,
        variantId: item.variantId,
        name: "Unavailable product",
        price: 0,
        image: "",
        quantity: item.quantity,
        isAvailable: false,
      } satisfies CartItem;
    }

    return {
      id: item.id,
      variantId: item.variantId,
      productId: variant.productId,
      name: variant.productName,
      price: variant.price,
      image: imageMap.get(variant.productId) ?? "",
      quantity: item.quantity,
      sku: variant.sku,
      color: variant.color ?? undefined,
      size: variant.size ?? undefined,
      isAvailable: true,
    } satisfies CartItem;
  });
}
