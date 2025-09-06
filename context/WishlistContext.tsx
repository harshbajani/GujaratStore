"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistItems: IProductResponse[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<IProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const [guestWishlist, setGuestWishlist] = useState<string[]>([]);

  // Load guest wishlist from localStorage on mount
  useEffect(() => {
    if (!session) {
      const storedWishlist = localStorage.getItem("guestWishlist");
      if (storedWishlist) {
        const wishlistIds = JSON.parse(storedWishlist);
        setGuestWishlist(wishlistIds);
        // Fetch product details for guest wishlist items
        fetchGuestWishlistItems(wishlistIds);
      }
    }
    setLoading(false);
  }, [session]);

  // Fetch wishlist items based on session status
  useEffect(() => {
    const fetchWishlistItems = async () => {
      if (session) {
        try {
          setLoading(true);
          const response = await fetch("/api/user/wishlist");
          const data = await response.json();
          if (data.success) {
            // Fetch full product details for each wishlist item
            const productPromises = data.data.map((id: string) =>
              fetch(`/api/vendor/products/${id}`).then((res) => res.json())
            );
            const products = await Promise.all(productPromises);
            const wishlistProducts = products
              .filter((p) => p.success)
              .map((p) => ({ ...p.data, wishlist: true }));
            setWishlistItems(wishlistProducts);
          }
        } catch (error) {
          console.error("Error fetching wishlist items:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchWishlistItems();
  }, [session]);

  // Fetch product details for guest wishlist items
  const fetchGuestWishlistItems = async (wishlistIds: string[]) => {
    try {
      setLoading(true);
      const productPromises = wishlistIds.map((id) =>
        fetch(`/api/vendor/products/${id}`).then((res) => res.json())
      );
      const products = await Promise.all(productPromises);
      const wishlistProducts = products
        .filter((p) => p.success)
        .map((p) => ({ ...p.data, wishlist: true }));
      setWishlistItems(wishlistProducts);
    } catch (error) {
      console.error("Error fetching guest wishlist items:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    try {
      // Optimistically update the UI
      const productResponse = await fetch(`/api/vendor/products/${productId}`);
      const productData = await productResponse.json();
      if (productData.success) {
        setWishlistItems((prev) => [
          ...prev,
          { ...productData.data, wishlist: true },
        ]);
      }

      if (session) {
        // Make the API call for logged-in users
        const response = await fetch("/api/user/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          // Revert the optimistic update if the API call fails
          setWishlistItems((prev) =>
            prev.filter((item) => item._id !== productId)
          );
          throw new Error("Failed to add to wishlist");
        }
      } else {
        // Handle guest wishlist
        const newGuestWishlist = [...guestWishlist, productId];
        setGuestWishlist(newGuestWishlist);
        localStorage.setItem("guestWishlist", JSON.stringify(newGuestWishlist));
      }

      toast.success("Success", {
        description: "Product added to wishlist",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Oops!", {
        description: "Failed to add to wishlist",
        duration: 5000,
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      // Optimistically update the UI
      setWishlistItems((prev) => prev.filter((item) => item._id !== productId));

      if (session) {
        // Make the API call for logged-in users
        const response = await fetch("/api/user/wishlist", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          // Revert the optimistic update if the API call fails
          const productResponse = await fetch(
            `/api/vendor/products/${productId}`
          );
          const productData = await productResponse.json();
          if (productData.success) {
            setWishlistItems((prev) => [
              ...prev,
              { ...productData.data, wishlist: true },
            ]);
          }
          throw new Error("Failed to remove from wishlist");
        }
      } else {
        // Handle guest wishlist
        const newGuestWishlist = guestWishlist.filter((id) => id !== productId);
        setGuestWishlist(newGuestWishlist);
        localStorage.setItem("guestWishlist", JSON.stringify(newGuestWishlist));
      }

      toast.success("Success", {
        description: "Product removed from wishlist",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Oops!", {
        description: "Failed to remove from wishlist",
        duration: 5000,
      });
    }
  };

  const clearWishlist = async () => {
    try {
      // Optimistically update the UI
      setWishlistItems([]);

      if (session) {
        // Make the API call for logged-in users
        const response = await fetch("/api/user/wishlist", {
          method: "DELETE",
        });

        if (!response.ok) {
          // Revert the optimistic update if the API call fails
          const wishlistResponse = await fetch("/api/user/wishlist");
          const wishlistData = await wishlistResponse.json();
          if (wishlistData.success) {
            setWishlistItems(wishlistData.data);
          }
          throw new Error("Failed to clear wishlist");
        }
      } else {
        // Handle guest wishlist
        setGuestWishlist([]);
        localStorage.removeItem("guestWishlist");
      }
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      throw error;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
