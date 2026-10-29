import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Product, ProductDetail, ProductVariant } from '@/types/product';
import { PageableData } from '@/types/apiResponse';
import { productService } from '@/lib/services/product';

interface ProductStore {
    products: Product[];
    featuredProducts: Product[];
    pagination: Omit<PageableData<Product>, "content"> | null;
    isLoading: boolean;
    error: string | null;
    selectedProduct: ProductDetail | null;
    selectedVariant: ProductVariant | null;
    fetchProducts: (page?: number, size?: number) => Promise<void>;
    fetchFeaturedProducts: () => Promise<void>;
    fetchProductBySlug: (slug: string) => Promise<void>;
    setSelectedVariant: (variant: ProductVariant | null) => void;
    clearSelectedProduct: () => void;
}

export const useProductStore = create<ProductStore>()(devtools((set, get) => ({
    products: [],
    featuredProducts: [],
    pagination: null,
    isLoading: false,
    error: null,
    selectedProduct: null,
    selectedVariant: null,

    fetchProducts: async (page = 0, size = 10) => {
        set({ isLoading: true, error: null });
        try {
            const res = await productService.getAllProducts(page, size);

            if (res.success) {
                const { content, ...pageMeta } = res.data;
                set({ products: content, pagination: pageMeta, isLoading: false })
            } else {
                set({ error: res.message, isLoading: false })
            }
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
    fetchProductBySlug: async (slug: string) => {
        // Clear the previous product so the page cannot render a stale one
        // while the new slug is loading.
        set({ isLoading: true, error: null, selectedProduct: null, selectedVariant: null });
        try {
            const res = await productService.getProductBySlug(slug);

            if (res.success) {
                const productDetail: ProductDetail = res.data;
                set({
                    selectedProduct: productDetail,
                    selectedVariant: productDetail.variants?.[0] || null,
                    isLoading: false
                })
            } else {
                set({ error: res.message, isLoading: false })
            }
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
    fetchFeaturedProducts: async () => {
        set({ isLoading: true })
        try {
            const res = await productService.getFeaturedProducts();

            if (res.success) {
                set({ featuredProducts: res.data, isLoading: false })
            } else {
                set({ isLoading: false, error: res.message })
            }
        } catch (error: any) {
            set({ isLoading: false, error: error.message });
        }
    },
    setSelectedVariant: (variant: ProductVariant | null) => {
        set({ selectedVariant: variant });
    },
    clearSelectedProduct: () => {
        set({ selectedProduct: null, selectedVariant: null });
    }
}), {
    name: 'product-store',
}))