"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { useGuest } from "@/context/GuestContext";

interface CartItem extends IProductResponse {
  cartQuantity: number;
}

export const useCart = () => {
  const { data: session } = useSession();
  const { guestCart, addToGuestCart, removeFromGuestCart } = useGuest();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isGuest = !session;

  // Calculate cart totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.netPrice * item.cartQuantity,
    0
  );

  const deliveryCharges = cartItems.reduce(
    (sum, item) => sum + (item.deliveryCharges || 0),
    0
  );

  const total = subtotal + deliveryCharges;

  // Helper function to calculate delivery charges
  const calculateDeliveryCharges = useCallback(
    (product: IProductResponse): number => {
      return product.deliveryCharges;
    },
    []
  );

  // Helper for formatted delivery date
  const formattedDeliveryDate = useCallback((deliveryDays: number) => {
    const currentDate = new Date();
    const deliveryDate = new Date(
      currentDate.getTime() + deliveryDays * 24 * 60 * 60 * 1000
    );
    return deliveryDate
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "/");
  }, []);

  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (session) {
        // Fetch authenticated user's cart
        const userResponse = await fetch("/api/user/cart");
        const userData = await userResponse.json();

        if (!userData.success) {
          setError("Failed to load cart");
          setCartItems([]);
          return;
        }

        const cartProductIds = userData.data?.cart || [];
        if (cartProductIds.length === 0) {
          setCartItems([]);
          setLoading(false);
          return;
        }

        const productPromises = cartProductIds.map((id: string) =>
          fetch(`/api/vendor/products/${id}`).then((res) => res.json())
        );

        const productResponses = await Promise.all(productPromises);
        const cartProducts = productResponses
          .filter((response) => response.success)
          .map((response) => ({
            ...response.data,
            cartQuantity: 1,
            deliveryCharges: calculateDeliveryCharges(response.data),
            inCart: true,
          }));

        setCartItems(cartProducts);
      } else if (guestCart && guestCart.length > 0) {
        // Handle guest cart
        try {
          const productPromises = guestCart.map((id) =>
            fetch(`/api/vendor/products/${id}`).then((res) => res.json())
          );

          const productResponses = await Promise.all(productPromises);
          const cartProducts = productResponses
            .filter((response) => response.success)
            .map((response) => ({
              ...response.data,
              cartQuantity: 1,
              deliveryCharges: calculateDeliveryCharges(response.data),
              inCart: true,
            }));

          setCartItems(cartProducts);
        } catch (err) {
          console.error("Error fetching guest cart items:", err);
          setError("Failed to load guest cart items");
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Failed to load cart items");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [session, guestCart, calculateDeliveryCharges]);

  // Initialize cart items when session or guestCart changes
  useEffect(() => {
    fetchCartItems();
  }, [session?.user?.email, guestCart]); // Only depend on session email and guestCart

  const updateQuantity = async (productId: string, newQuantity: number) => {
    try {
      if (newQuantity < 1) return;

      // Optimistically update the UI
      setCartItems((prev) =>
        prev.map((item) =>
          item._id === productId ? { ...item, cartQuantity: newQuantity } : item
        )
      );

      if (session) {
        // Update quantity for authenticated user
        const response = await fetch("/api/user/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: newQuantity }),
        });

        const data = await response.json();

        if (!data.success) {
          // Revert changes if API call fails
          const prevItem = cartItems.find((item) => item._id === productId);
          if (prevItem) {
            setCartItems((prev) =>
              prev.map((item) =>
                item._id === productId
                  ? { ...item, cartQuantity: prevItem.cartQuantity }
                  : item
              )
            );
          }
          throw new Error(data.error);
        }
      }
      // For guest users, the quantity is only maintained in local state
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      // Store the item being removed for potential rollback
      const removedItem = cartItems.find((item) => item._id === productId);

      // Optimistically update UI
      setCartItems((prev) => prev.filter((item) => item._id !== productId));

      if (session) {
        // Remove from authenticated user's cart
        const response = await fetch("/api/user/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        const data = await response.json();

        if (!data.success) {
          // Revert if API call fails
          if (removedItem) {
            setCartItems((prev) => [...prev, removedItem]);
          }
          throw new Error(data.error);
        }
      } else {
        // Remove from guest cart and immediately update UI
        removeFromGuestCart(productId);
        // No need to wait for fetchCartItems since we've already updated the UI
        // and the guestCart state change will trigger a re-fetch
      }

      toast({
        title: "Success",
        description: "Item removed from cart",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Error removing item from cart:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const existingItem = cartItems.find((item) => item._id === productId);

      if (existingItem) {
        await updateQuantity(productId, existingItem.cartQuantity + 1);
        return;
      }

      // Fetch product data first
      const productResponse = await fetch(`/api/vendor/products/${productId}`);
      const productData = await productResponse.json();

      if (!productData.success) {
        throw new Error("Failed to fetch product data");
      }

      // Optimistically update UI
      const newItem = {
        ...productData.data,
        cartQuantity: 1,
        deliveryCharges: calculateDeliveryCharges(productData.data),
        inCart: true,
      };

      setCartItems((prev) => [...prev, newItem]);

      if (session) {
        // Add to authenticated user's cart
        const response = await fetch("/api/user/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        const data = await response.json();

        if (!data.success) {
          // Revert optimistic update
          setCartItems((prev) => prev.filter((item) => item._id !== productId));
          throw new Error(data.error);
        }
      } else {
        // Add to guest cart
        addToGuestCart(productId);
      }

      toast({
        title: "Success",
        description: "Item added to cart",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  return {
    cartItems,
    loading,
    error,
    subtotal,
    deliveryCharges,
    total,
    formattedDeliveryDate,
    fetchCartItems,
    updateQuantity,
    removeFromCart,
    addToCart,
    isGuest,
  };
};
