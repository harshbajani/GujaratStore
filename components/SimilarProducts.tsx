"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
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
  slug: string;
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
  const productSlug = params.slug;
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();

  // Helper function to construct image URL from GridFS ID
  const getImageUrl = (imageId: string) => `/api/files/${imageId}`;

  // Toggle wishlist status
  const handleToggleWishlist = async (
    e: React.MouseEvent,
    product: Product
  ) => {
    e.preventDefault();
    if (!product._id) return;

    try {
      if (product.wishlist) {
        await removeFromWishlist(product._id);
        setRelatedProducts((prev) =>
          prev.map((p) =>
            p._id === product._id ? { ...p, wishlist: false } : p
          )
        );
        toast({
          title: "Success",
          description: "Product removed from wishlist",
          className: "bg-green-500 text-white",
        });
      } else {
        await addToWishlist(product._id);
        setRelatedProducts((prev) =>
          prev.map((p) =>
            p._id === product._id ? { ...p, wishlist: true } : p
          )
        );
        toast({
          title: "Success",
          description: "Product added to wishlist",
          className: "bg-green-500 text-white",
        });
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    }
  };

  // Toggle cart status
  const handleToggleCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (!product._id) return;

    try {
      if (product.inCart) {
        await removeFromCart(product._id);
        setRelatedProducts((prev) =>
          prev.map((p) => (p._id === product._id ? { ...p, inCart: false } : p))
        );
        toast({
          title: "Success",
          description: "Product removed from cart",
          className: "bg-green-500 text-white",
        });
      } else {
        await addToCart(product._id);
        setRelatedProducts((prev) =>
          prev.map((p) => (p._id === product._id ? { ...p, inCart: true } : p))
        );
        toast({
          title: "Success",
          description: "Product added to cart",
          className: "bg-green-500 text-white",
        });
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      toast({
        title: "Error",
        description: "Failed to update cart",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        // Fetch the current product to get its category
        const productResponse = await fetch(
          `/api/vendor/products/slug/${productSlug}`
        );
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
        const productsResponse = await fetch("/api/vendor/products?all=true");
        const productsData = await productsResponse.json();

        if (productsData.success) {
          // Filter products by the same category and exclude the current product
          let related = productsData.data.filter(
            (product: Product) =>
              product.parentCategory?.name?.toLowerCase() === categoryName &&
              product._id !== productSlug
          );

          // Limit to a reasonable number (e.g., 10)
          related = related.slice(0, 10);

          // Update cart and wishlist status for each product
          related = related.map((product: Product) => ({
            ...product,
            wishlist: wishlistItems.some((item) => item._id === product._id),
            inCart: cartItems.some((item) => item._id === product._id),
          }));

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

    if (productSlug) {
      fetchRelatedProducts();
    }
  }, [productSlug, cartItems, wishlistItems]);

  return (
    <>
      <div className="dynamic-container mx-auto px-4 sm:py-8 py-0 mb-16">
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
                      <Link
                        prefetch
                        href={`/${product.parentCategory?.name}/${product.slug}`}
                      >
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
                    <Link
                      prefetch
                      href={`/${product.parentCategory?.name}/${product.slug}`}
                      className="w-full"
                    >
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
                        onClick={(e) => handleToggleCart(e, product)}
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
                        onClick={(e) => handleToggleWishlist(e, product)}
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
