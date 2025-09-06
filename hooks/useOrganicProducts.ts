"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { toast } from "sonner";

export interface OrganicProduct {
  _id: string;
  productName: string;
  slug: string;
  parentCategory: {
    name: string;
  };
  primaryCategory?: {
    name: string;
  };
  secondaryCategory?: {
    name: string;
  };
  brands: {
    _id: string;
    name: string;
  };
  productReviews?: Array<{ rating: number }>;
  productCoverImage: string;
  mrp: number;
  netPrice: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  productQuantity: number;
  productStatus: boolean;
  // Extended properties for UI
  inCart?: boolean;
  wishlist?: boolean;
}

export const useOrganicProducts = () => {
  const [products, setProducts] = useState<OrganicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { cartItems, addToCart, removeFromCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();

  // Fetch organic products - only for manual refetch
  const refetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/products/organic/featured");
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch organic products");
      }
    } catch (err) {
      console.error("Error fetching organic products:", err);
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  // Update products when cart or wishlist changes
  useEffect(() => {
    setProducts((prev) =>
      prev.map((product) => ({
        ...product,
        inCart: cartItems.some((item) => item._id === product._id),
        wishlist: wishlistItems.some((item) => item._id === product._id),
      }))
    );
  }, [cartItems, wishlistItems]);

  // Initial fetch - only fetch once on mount
  useEffect(() => {
    const fetchOnce = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/products/organic/featured");
        const data = await response.json();

        if (data.success) {
          setProducts(data.data);
        } else {
          throw new Error(data.error || "Failed to fetch organic products");
        }
      } catch (err) {
        console.error("Error fetching organic products:", err);
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchOnce();
  }, []); // Empty dependency array to run only once

  // Handle cart toggle
  const handleToggleCart = useCallback(
    async (e: React.MouseEvent, product: OrganicProduct) => {
      e.preventDefault();
      e.stopPropagation();

      // Optimistically update the UI immediately
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, inCart: !p.inCart } : p
        )
      );

      try {
        if (product.inCart) {
          await removeFromCart(product._id);
        } else {
          await addToCart(product._id);
        }
      } catch (error) {
        // Revert the optimistic update on error
        setProducts((prev) =>
          prev.map((p) =>
            p._id === product._id ? { ...p, inCart: product.inCart } : p
          )
        );
        console.error("Error toggling cart:", error);
        toast.error("Failed to update cart");
      }
    },
    [addToCart, removeFromCart]
  );

  // Handle wishlist toggle
  const handleToggleWishlist = useCallback(
    async (e: React.MouseEvent, product: OrganicProduct) => {
      e.preventDefault();
      e.stopPropagation();

      // Optimistically update the UI immediately
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, wishlist: !p.wishlist } : p
        )
      );

      try {
        if (product.wishlist) {
          await removeFromWishlist(product._id);
        } else {
          await addToWishlist(product._id);
        }
      } catch (error) {
        // Revert the optimistic update on error
        setProducts((prev) =>
          prev.map((p) =>
            p._id === product._id ? { ...p, wishlist: product.wishlist } : p
          )
        );
        console.error("Error toggling wishlist:", error);
        toast.error("Failed to update wishlist");
      }
    },
    [addToWishlist, removeFromWishlist]
  );

  return {
    products,
    loading,
    error,
    handleToggleCart,
    handleToggleWishlist,
    refetch: refetchProducts,
  };
};
