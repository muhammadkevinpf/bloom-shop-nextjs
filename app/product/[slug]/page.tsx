"use client";

import Features from "@/components/product/Features";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductNotFound from "@/components/product/ProductNotFound";
import RelatedProducts from "@/components/product/RelatedProducts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/lib/services/auth";
import { useCartStore } from "@/lib/store/cart-store";
import { useProductStore } from "@/lib/store/product-store";
import { cn } from "@/lib/utils";
import { ProductDetail, ProductVariant } from "@/types/product";
import {
  Check,
  Heart,
  Loader2,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Star,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Product() {
  const { selectedProduct: product, error, fetchProductBySlug } = useProductStore();
  const { slug } = useParams();

  useEffect(() => {
    if (slug) fetchProductBySlug(slug as string);
  }, [slug, fetchProductBySlug]);

  // Nothing loaded and no error yet means the request has not settled, so show
  // the skeleton instead of flashing "product not found".
  if (!product && !error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return <ProductNotFound />;
  }

  // Keyed so the colour/size/quantity selection resets for each product.
  return <ProductDetailView key={product.id} product={product} />;
}

function ProductDetailView({ product }: { product: ProductDetail }) {
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const { isAuthenticated } = authService;

  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const colors = useMemo(
    () => [...new Set(variants.map((variant) => variant.color ?? "Default"))],
    [variants]
  );

  const [selectedColor, setSelectedColor] = useState(() => colors[0] ?? "Default");
  const [selectedSize, setSelectedSize] = useState<string | null>(
    () => variants[0]?.size ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizesForColor = useMemo(
    () => variants.filter((variant) => (variant.color ?? "Default") === selectedColor),
    [variants, selectedColor]
  );

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    const match = sizesForColor.find((variant) => variant.size === selectedSize);
    return match ?? sizesForColor[0] ?? variants[0] ?? null;
  }, [sizesForColor, selectedSize, variants]);

  const unitPrice = product.basePrice + (selectedVariant?.priceAdjustment ?? 0);
  const primaryImage =
    product.images?.find((image) => image.isPrimary)?.imageUrl ??
    product.images?.[0]?.imageUrl ??
    "";

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const firstForColor = variants.find(
      (variant) => (variant.color ?? "Default") === color
    );
    setSelectedSize(firstForColor?.size ?? null);
  };

  const handleAddToCart = async (): Promise<boolean> => {
    if (!isAuthenticated()) {
      router.push("/signin");
      return false;
    }

    if (!selectedVariant) {
      setError("This product has no variants available right now.");
      return false;
    }

    setError(null);
    setIsAdding(true);

    try {
      await addItem(selectedVariant.id, quantity);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this item to your cart.");
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (await handleAddToCart()) router.push("/cart");
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductBreadcrumb />

      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        <div className="space-y-4">
          <div className="w-full max-w-[500px] mx-auto flex flex-col items-center px-4">
            <div className="rounded-xl shadow-lg overflow-hidden mb-4 w-full">
              {primaryImage && (
                <Image
                  src={primaryImage}
                  alt={product.name}
                  width={600}
                  height={600}
                  priority
                  fetchPriority="high"
                  className="rounded-xl object-cover w-full h-auto max-h-[500px]"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              (4.8) • 127 reviews
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-foreground">
              ${unitPrice.toFixed(2)}
            </span>
            {selectedVariant && (
              <span className="text-sm text-muted-foreground">
                SKU: {selectedVariant.sku}
              </span>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <Separator />

          <div className="space-y-4">
            {colors.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Colour
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <Button
                      key={color}
                      type="button"
                      variant="outline"
                      onClick={() => handleColorChange(color)}
                      aria-pressed={color === selectedColor}
                      className={cn(
                        "h-9 px-4",
                        color === selectedColor && "border-primary ring-1 ring-primary"
                      )}
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {sizesForColor.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map((variant) => (
                    <Button
                      key={variant.id}
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedSize(variant.size ?? null)}
                      aria-pressed={variant.id === selectedVariant?.id}
                      className={cn(
                        "h-9 min-w-[52px] px-3",
                        variant.id === selectedVariant?.id &&
                          "border-primary ring-1 ring-primary"
                      )}
                    >
                      {variant.size ?? "One size"}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="h-10 w-10 rounded-r-none"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="h-10 w-10 rounded-l-none"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className={cn(
                  "flex-1 transition-all duration-300",
                  justAdded
                    ? "bg-green-600 text-white hover:bg-green-600"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={handleAddToCart}
                disabled={isAdding}
              >
                {isAdding ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </div>
                ) : justAdded ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Added to Cart!
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </div>
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleBuyNow}
                disabled={isAdding}
                className="flex-1"
              >
                Buy Now
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  isLiked && "text-destructive"
                )}
              >
                <Heart
                  className={cn("h-4 w-4 mr-2", isLiked && "fill-current")}
                />
                Add to Wishlist
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Features />

      <RelatedProducts />
    </div>
  );
}
