import { Product, ProductPageResponse, ProductDetailResponse } from "@/types/product";
import { ApiResponse } from "@/types/apiResponse";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export const productService = {
    async getAllProducts(page: number, size: number): Promise<ProductPageResponse> {
        const response = await fetch(`${API_BASE_URL}/api/v1/products?page=${page}&size=${size}`);
        if (!response.ok) throw new Error("Failed to fetch products");
        return response.json();
    },
    async getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
        const response = await fetch(`${API_BASE_URL}/api/v1/products/featured`);
        if (!response.ok) throw new Error("Failed to fetch featured products");
        return response.json();
    },
    async getProductBySlug(slug: string): Promise<ProductDetailResponse> {
        const response = await fetch(`${API_BASE_URL}/api/v1/products/${slug}`);
        if (!response.ok) throw new Error("Failed to fetch product details");
        return response.json();
    },
    async searchProducts(keyword: string): Promise<ApiResponse<Product[]>> {
        const res = await fetch(`${API_BASE_URL}/api/v1/products/search?keyword=${encodeURIComponent(keyword)}`);
        if (!res.ok) throw new Error(`Failed to search products: ${res.statusText}`);
        return res.json();
    }
}



