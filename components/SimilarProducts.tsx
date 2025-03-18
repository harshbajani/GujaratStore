"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Product {
  _id: string;
  productName: string;
  productCoverImage: string;
  mrp: number;
  netPrice: number;
  productImages: string[];
  wishlist?: boolean;
  inCart?: boolean;
  parentCategory?: {
    name?: string;
  };
}

const SimilarProducts = () => {
  const params = useParams();
  const productId = params.id;
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to construct image URL from GridFS ID
  const getImageUrl = (imageId: string) => `/api/files/${imageId}`;

  // Toggle wishlist status
  const handleToggleWishlist = async (product: Product) => {
    try {
      let response;
      if (product.wishlist) {
        response = await fetch("/api/user/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id }),
        });
      } else {
        response = await fetch("/api/user/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id }),
        });
      }
      const data = await response.json();
      console.log("Wishlist response:", data);
      if (!data.success && data.message === "Not authenticated") {
        toast({
          title: "Error",
          description: "Please log in to add to wishlist!",
          variant: "destructive",
        });
        return;
      }
      setRelatedProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, wishlist: !p.wishlist } : p
        )
      );
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    }
  };

  // Toggle cart: add if not in cart, remove if already in cart
  const handleToggleCart = async (product: Product) => {
    try {
      let response;
      if (product.inCart) {
        // Remove from cart
        response = await fetch("/api/user/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id }),
        });
      } else {
        // Add to cart
        response = await fetch("/api/user/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id }),
        });
      }
      const data = await response.json();
      console.log("Cart toggle response:", data);
      if (!data.success && data.message === "Not authenticated") {
        toast({
          title: "Error",
          description: "Please log in to add to cart!",
          variant: "destructive",
        });
        return;
      }
      setRelatedProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, inCart: !p.inCart } : p
        )
      );
    } catch (err) {
      console.error("Error toggling cart:", err);
    }
  };

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        // Fetch the current product to get its category
        const productResponse = await fetch(`/api/products/${productId}`);
        const productData = await productResponse.json();

        if (!productData.success) {
          setError("Failed to fetch product details");
          setLoading(false);
          return;
        }

        const currentProduct = productData.data;
        const categoryName = currentProduct.parentCategory?.name?.toLowerCase();

        if (!categoryName) {
          setRelatedProducts([]);
          setLoading(false);
          return;
        }

        // Fetch all products in the same category
        const productsResponse = await fetch("/api/products");
        const productsData = await productsResponse.json();

        if (productsData.success) {
          // Filter products by the same category and exclude the current product
          let related = productsData.data.filter(
            (product: Product) =>
              product.parentCategory?.name?.toLowerCase() === categoryName &&
              product._id !== productId
          );

          // Limit to a reasonable number (e.g., 10)
          related = related.slice(0, 10);

          // Fetch current user data to mark wishlist and cart
          const userResponse = await fetch("/api/user/current");
          const userData = await userResponse.json();

          if (userData.success && userData.data) {
            const wishlistIds: string[] = userData.data.wishlist || [];
            const cartIds: string[] = userData.data.cart || [];

            related = related.map((product: Product) => ({
              ...product,
              wishlist: wishlistIds.includes(product._id),
              inCart: cartIds.includes(product._id),
            }));
          }

          setRelatedProducts(related);
        } else {
          setError("Failed to fetch related products");
        }
      } catch (err) {
        setError("Error fetching related products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchRelatedProducts();
    }
  }, [productId]);

  return (
    <>
      <div className="container mx-auto px-4 py-8 mb-16">
        <h2 className="text-2xl font-bold mb-6">Similar Products</h2>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            Loading...
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : relatedProducts.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No related products found
          </div>
        ) : (
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {relatedProducts.map((product) => (
                <CarouselItem
                  key={product._id}
                  className="pl-2 md:pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <div className="flex flex-col items-center justify-between rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md h-full">
                    {/* Image Container */}
                    <div className="mb-4 h-40 w-full overflow-hidden rounded-lg">
                      <Link href={`/clothing/${product._id}`}>
                        <Image
                          src={getImageUrl(product.productCoverImage)}
                          alt={product.productName}
                          width={200}
                          height={200}
                          className="h-full w-full object-cover object-top transition-transform duration-300 hover:scale-105"
                        />
                      </Link>
                    </div>

                    {/* Product Info */}
                    <Link href={`/clothing/${product._id}`} className="w-full">
                      <div className="flex w-full flex-1 flex-col items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="w-full">
                              <h3 className="mb-2 text-center text-sm font-semibold text-brand h-5 overflow-hidden">
                                {product.productName}
                              </h3>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-wrap">
                              {product.productName}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="mb-4 flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ₹
                            {Math.floor(product.netPrice).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                          {product.mrp > product.netPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{Math.floor(product.mrp).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Buttons Container */}
                    <div className="flex w-full items-center justify-between gap-2">
                      <Button
                        variant="secondary"
                        className="shadow-md flex items-center gap-2"
                        onClick={() => handleToggleCart(product)}
                      >
                        <div
                          className={cn(
                            product.inCart ? "bg-secondary/90" : "bg-brand",
                            "p-2 rounded -ml-3 transition-all duration-300"
                          )}
                        >
                          {product.inCart ? (
                            <Check className="size-5 text-green-500" />
                          ) : (
                            <ShoppingCart className="size-5 text-white" />
                          )}
                        </div>
                        {product.inCart ? "Remove from Cart" : "Add to Cart"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="aspect-square p-1 shadow-sm"
                        onClick={() => handleToggleWishlist(product)}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4",
                            product.wishlist ? "fill-red-500" : "text-red-600"
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="xl:-left-10 md:-left-4 sm:flex hidden" />
            <CarouselNext className="xl:-right-10 md:-right-4 sm:flex hidden" />
          </Carousel>
        )}
      </div>
    </>
  );
};

export default SimilarProducts;
