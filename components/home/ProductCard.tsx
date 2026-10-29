"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { productService } from "@/lib/services/product";
import { useCartStore } from "@/lib/store/cart-store";
import { authService } from "@/lib/services/auth";
import { cn } from "@/lib/utils";

import { Product } from "@/types/product";
import { Check, Eye, Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from 'next/navigation';

export default function ProductCard({ product }: { product: Product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const { isAuthenticated } = authService;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated()) {
      router.push("/signin");
      return;
    }

    setIsAdding(true);

    try {
      // The cart stores a variant, so the product's default variant is resolved
      // first; the product page offers the full colour/size picker.
      const res = await productService.getProductBySlug(product.slug);
      const variant = res.data?.variants?.[0];

      if (!variant) {
        router.push(`/product/${product.slug}`);
        return;
      }

      await addItem(variant.id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch {
      // The store records the failure in `error`.
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <Card className="group overflow-hidden bg-card border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          name="Like Button"
          className={cn(
            "absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/80 backdrop-blur-sm hover:bg-background",
            isLiked && "opacity-100 text-destructive",
          )}
          onClick={handleToggleLike}
        >
          <Heart
            name="Like Icon"
            className={cn("h-4 w-4", isLiked && "fill-current")}
          />
        </Button>

        <Link href={`/product/${product.slug}`} className="block relative">
          <div className="aspect-square overflow-hidden bg-muted">
            {!imageError ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-muted-foreground text-sm">
                  Image not available
                </div>
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <span
              className={cn(
                buttonVariants({ size: "sm" }),
                "pointer-events-none",
              )}
            >
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </span>
          </div>
        </Link>
      </div>

      <CardContent className="p-4 space-y-3">
        <Link href={`/product/${product.slug}`}>
          <h2 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h2>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            ${product.basePrice.toFixed(2)}
          </span>
        </div>

        <Button
          className={cn(
            "w-full transition-all duration-300",
            justAdded
              ? "bg-green-600 text-white hover:bg-green-600"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
      </CardContent>
    </Card>
  );
}
