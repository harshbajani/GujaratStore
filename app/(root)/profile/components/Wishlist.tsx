/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, ShoppingCart, Loader2, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Product = {
  _id: string;
  productName: string;
  productCoverImage: string;
  mrp: number;
  netPrice: number;
  discountValue: number;
  discountType: "percentage" | "amount";
  productQuantity: number;
  productStatus: boolean;
  inCart?: boolean;
};

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const getImageUrl = (imageId: string | File) => `/api/files/${imageId}`;

  useEffect(() => {
    fetchWishlistItems();
    fetchCartItems();
  }, []);

  const fetchWishlistItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/wishlist");
      const result = await response.json();

      if (result.success) {
        setWishlistItems(result.data);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch wishlist items",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast({
        title: "Error",
        description: "Something went wrong while fetching your wishlist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCartItems = async () => {
    try {
      const response = await fetch("/api/user/get-cart-items");
      const result = await response.json();

      if (result.success) {
        // Extract just the product IDs from cart items
        const cartIds = result.data.map((item: Product) => item._id);
        setCartItems(cartIds);

        // Update wishlist items with inCart status
        setWishlistItems((prevItems) =>
          prevItems.map((item) => ({
            ...item,
            inCart: cartIds.includes(item._id),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch("/api/user/wishlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      const result = await response.json();

      if (result.success) {
        setWishlistItems((prevItems) =>
          prevItems.filter((item) => item._id !== productId)
        );
        toast({
          title: "Success",
          description: "Item removed from wishlist",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to remove item from wishlist",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
        variant: "destructive",
      });
    }
  };

  const handleToggleCart = async (product: Product) => {
    try {
      if (product.inCart) {
        // Remove from cart
        const response = await fetch("/api/user/cart", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: product._id }),
        });

        const result = await response.json();

        if (result.success) {
          // Update local state
          setCartItems((prev) => prev.filter((id) => id !== product._id));
          setWishlistItems((prevItems) =>
            prevItems.map((item) =>
              item._id === product._id ? { ...item, inCart: false } : item
            )
          );
          toast({
            title: "Success",
            description: "Item removed from cart",
          });
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to remove item from cart",
            variant: "destructive",
          });
        }
      } else {
        // Add to cart
        const response = await fetch("/api/user/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: product._id }),
        });

        const result = await response.json();

        if (result.success) {
          // Update local state
          setCartItems((prev) => [...prev, product._id]);
          setWishlistItems((prevItems) =>
            prevItems.map((item) =>
              item._id === product._id ? { ...item, inCart: true } : item
            )
          );
          toast({
            title: "Success",
            description: "Item added to cart",
          });
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to add item to cart",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error toggling cart item:", error);
      toast({
        title: "Error",
        description: "Failed to update cart",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Heart className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-semibold">Your Wishlist is Empty</h2>
        <p className="text-gray-500 text-center">
          Add items to your wishlist to keep track of products you love
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-brand hover:bg-brand/90"
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Wishlist</h2>
        <p className="text-gray-500">{wishlistItems.length} item(s)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => (
          <Card key={item._id} className="overflow-hidden flex flex-col">
            <CardHeader className="p-0 relative">
              <Link prefetch href={`/product/${item._id}`}>
                <div className="h-48 w-full relative">
                  {item.productCoverImage && (
                    <Image
                      src={getImageUrl(item.productCoverImage)}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white rounded-full h-8 w-8 shadow-md hover:bg-red-100"
                onClick={() => removeFromWishlist(item._id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </CardHeader>
            <CardContent className="flex-grow p-4">
              <Link prefetch href={`/product/${item._id}`}>
                <h3 className="font-medium text-lg hover:text-brand transition-colors line-clamp-1">
                  {item.productName}
                </h3>
              </Link>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-semibold text-lg">
                  ₹{Math.floor(item.netPrice)}
                </span>
                {item.mrp > item.netPrice && (
                  <span className="text-gray-500 line-through text-sm">
                    ₹{item.mrp}
                  </span>
                )}
                {item.discountValue > 0 && (
                  <span className="text-green-600 text-sm">
                    {item.discountType === "percentage"
                      ? item.discountValue + "%"
                      : "₹" + item.discountValue}{" "}
                    off
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span
                  className={`text-sm ${
                    item.productQuantity > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.productQuantity > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                variant="secondary"
                className=" shadow-md flex items-center gap-2"
                disabled={!item.productStatus || item.productQuantity <= 0}
                onClick={() => handleToggleCart(item)}
              >
                <div
                  className={cn(
                    item.inCart ? "bg-secondary/90" : "bg-brand",
                    "p-2 rounded -ml-3 transition-all duration-300"
                  )}
                >
                  {item.inCart ? (
                    <Check className="size-5 text-green-500" />
                  ) : (
                    <ShoppingCart className="size-5 text-white" />
                  )}
                </div>
                {item.inCart ? "Remove from Cart" : "Add to Cart"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
