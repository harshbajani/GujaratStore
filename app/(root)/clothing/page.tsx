"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
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

const ClothingPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [organicRef, organicInView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  // Helper function to construct image URL from GridFS ID
  const getImageUrl = (imageId: string) => `/api/files/${imageId}`;

  // Toggle wishlist status.
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
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, wishlist: !p.wishlist } : p
        )
      );
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    }
  };

  // Toggle cart: add if not in cart, remove if already in cart.
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
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, inCart: !p.inCart } : p
        )
      );
    } catch (err) {
      console.error("Error toggling cart:", err);
    }
  };

  useEffect(() => {
    const fetchProductsAndUser = async () => {
      try {
        // Fetch products.
        const prodResponse = await fetch("/api/products");
        const prodData = await prodResponse.json();
        if (prodData.success) {
          let clothingProducts = prodData.data.filter(
            (product: Product) =>
              product.parentCategory?.name?.toLowerCase() === "clothing"
          );
          // Fetch current user data to mark wishlist and cart.
          const userResponse = await fetch("/api/user/current");
          const userData = await userResponse.json();
          if (userData.success && userData.data) {
            const wishlistIds: string[] = userData.data.wishlist || [];
            const cartIds: string[] = userData.data.cart || [];
            clothingProducts = clothingProducts.map((product: Product) => ({
              ...product,
              wishlist: wishlistIds.includes(product._id),
              inCart: cartIds.includes(product._id),
            }));
          }
          setProducts(clothingProducts);
        } else {
          setError("Failed to fetch products");
        }
      } catch (err) {
        setError("Error fetching products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ...Hero Section... */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          ref={organicRef}
          variants={containerVariants}
          initial="hidden"
          animate={organicInView ? "visible" : "hidden"}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {products.map((product) => (
            <motion.div
              variants={containerVariants}
              className="flex flex-col items-center justify-between rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              key={product._id}
            >
              {/* Image Container */}
              <div className="mb-4 h-48 w-full overflow-hidden rounded-lg">
                <Link href={`/clothing/${product._id}`}>
                  <Image
                    src={getImageUrl(product.productCoverImage)}
                    alt={product.productName}
                    width={250}
                    height={250}
                    className="h-full w-full object-cover object-top transition-transform duration-300 hover:scale-105"
                  />
                </Link>
              </div>

              {/* Product Info */}
              <Link href={`/clothing/${product._id}`}>
                <div className="flex w-full flex-1 flex-col items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
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
                      ₹{Math.floor(product.netPrice).toLocaleString("en-IN")}
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
              <div className="flex w-full items-center justify-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-1"
                >
                  <Button
                    variant="secondary"
                    className="shadow-md flex items-center gap-2"
                    onClick={() => handleToggleCart(product)}
                  >
                    <div className="bg-brand p-2 rounded -ml-3">
                      <ShoppingCart className="size-5 text-white" />
                    </div>
                    {product.inCart ? "Remove from Cart" : "Add to Cart"}
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="secondary"
                    className="aspect-square p-2 shadow-sm hover:shadow-md"
                    onClick={() => handleToggleWishlist(product)}
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        product.wishlist ? "fill-red-500" : "text-red-600"
                      )}
                    />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ClothingPage;
