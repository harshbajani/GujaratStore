/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
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
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

const Wishlist = () => {
  const {
    wishlistItems,
    loading: isLoading,
    removeFromWishlist,
  } = useWishlist();
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const getImageUrl = (imageId: string | File) => `/api/files/${imageId}`;

  const handleToggleCart = async (
    e: React.MouseEvent,
    product: IProductResponse
  ) => {
    e.preventDefault();
    if (!product._id) return;

    try {
      const isInCart = cartItems.some((item) => item._id === product._id);

      if (isInCart) {
        await removeFromCart(product._id);
        toast({
          title: "Success",
          description: "Item removed from cart",
        });
      } else {
        await addToCart(product._id);
        toast({
          title: "Success",
          description: "Item added to cart",
        });
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

  const handleRemoveFromWishlist = async (
    e: React.MouseEvent,
    productId: string
  ) => {
    e.preventDefault();
    try {
      await removeFromWishlist(productId);
      toast({
        title: "Success",
        description: "Item removed from wishlist",
      });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
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
    <div className="space-y-6 max-h-[440px] sm:max-h-[430px] overflow-auto">
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
                      className="object-cover object-top"
                    />
                  )}
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white rounded-full h-8 w-8 shadow-md hover:bg-red-100"
                onClick={(e) => handleRemoveFromWishlist(e, item._id!)}
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
                className="shadow-md flex items-center gap-2"
                disabled={!item.productStatus || item.productQuantity <= 0}
                onClick={(e) => handleToggleCart(e, item)}
              >
                <div
                  className={cn(
                    cartItems.some((cartItem) => cartItem._id === item._id)
                      ? "bg-secondary/90"
                      : "bg-brand",
                    "p-2 rounded -ml-3 transition-all duration-300"
                  )}
                >
                  {cartItems.some((cartItem) => cartItem._id === item._id) ? (
                    <Check className="size-5 text-green-500" />
                  ) : (
                    <ShoppingCart className="size-5 text-white" />
                  )}
                </div>
                {cartItems.some((cartItem) => cartItem._id === item._id)
                  ? "Remove from Cart"
                  : "Add to Cart"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
