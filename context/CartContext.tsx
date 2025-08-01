"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import { useGuest } from "./GuestContext";
import Cookies from "js-cookie";

interface CartContextType {
  cartItems: IProductResponse[];
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<IProductResponse[]>([]);
  const { data: session } = useSession();
  const { guestCart, addToGuestCart, removeFromGuestCart } = useGuest();

  // Fetch cart items based on session status
  useEffect(() => {
    const fetchCartItems = async () => {
      if (session) {
        try {
          const response = await fetch("/api/user/cart");
          const data = await response.json();
          if (data.success) {
            // Fetch full product details for each cart item
            const productPromises = data.data.cart.map((id: string) =>
              fetch(`/api/vendor/products/${id}`).then((res) => res.json())
            );
            const products = await Promise.all(productPromises);
            const cartProducts = products
              .filter((p) => p.success)
              .map((p) => ({ ...p.data, inCart: true }));
            setCartItems(cartProducts);
          }
        } catch (error) {
          console.error("Error fetching cart items:", error);
        }
      } else if (guestCart.length > 0) {
        // Fetch product details for guest cart items
        try {
          const productPromises = guestCart.map((id) =>
            fetch(`/api/vendor/products/${id}`).then((res) => res.json())
          );
          const products = await Promise.all(productPromises);
          const cartProducts = products
            .filter((p) => p.success)
            .map((p) => ({ ...p.data, inCart: true }));
          setCartItems(cartProducts);
        } catch (error) {
          console.error("Error fetching guest cart items:", error);
        }
      } else {
        setCartItems([]);
      }
    };

    fetchCartItems();
  }, [session, guestCart]); // Re-fetch when session or guestCart changes

  const addToCart = async (productId: string) => {
    try {
      // Optimistically update the UI
      const productResponse = await fetch(`/api/vendor/products/${productId}`);
      const productData = await productResponse.json();
      if (productData.success) {
        setCartItems((prev) => [
          ...prev,
          { ...productData.data, inCart: true },
        ]);
      }

      if (session) {
        // Make the API call for logged-in users
        const response = await fetch("/api/user/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          // Revert the optimistic update if the API call fails
          setCartItems((prev) => prev.filter((item) => item._id !== productId));
          throw new Error("Failed to add to cart");
        }
      } else {
        // Use GuestContext to handle guest cart
        addToGuestCart(productId);
      }

      toast({
        title: "Success",
        description: "Product added to cart",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      // Optimistically update the UI
      setCartItems((prev) => prev.filter((item) => item._id !== productId));

      if (session) {
        // Make the API call for logged-in users
        const response = await fetch("/api/user/cart", {
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
            setCartItems((prev) => [
              ...prev,
              { ...productData.data, inCart: true },
            ]);
          }
          throw new Error("Failed to remove from cart");
        }
      } else {
        // Use GuestContext to handle guest cart
        removeFromGuestCart(productId);
      }

      toast({
        title: "Success",
        description: "Product removed from cart",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast({
        title: "Error",
        description: "Failed to remove from cart",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    try {
      // Optimistically update the UI
      setCartItems([]);

      if (session) {
        // Make the API call for logged-in users
        const response = await fetch("/api/user/cart", {
          method: "DELETE",
        });

        if (!response.ok) {
          // Revert the optimistic update if the API call fails
          const cartResponse = await fetch("/api/user/cart");
          const cartData = await cartResponse.json();
          if (cartData.success) {
            setCartItems(cartData.data);
          }
          throw new Error("Failed to clear cart");
        }
      } else {
        // Clear guest cart cookie
        Cookies.remove("guestCart");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
