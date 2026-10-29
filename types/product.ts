import { ApiResponse, PageableData } from "./apiResponse";
import { Category } from "./category";

export interface ProductVariant {
  id: string;
  sku: string;
  color?: string;
  size?: string;
  priceAdjustment: number;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  status: string;
  featured: boolean;
  imageUrl: string;
  category?: Category;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
}

/** Shape returned by GET /api/v1/products/variants/{variantId}. */
export interface ProductVariantDetail {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  color?: string | null;
  size?: string | null;
  price: number;
}



export type ProductPageResponse = ApiResponse<PageableData<Product>>;
export type ProductDetailResponse = ApiResponse<ProductDetail>;