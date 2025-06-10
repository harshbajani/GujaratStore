"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/use-toast";

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
  const [guestCart, setGuestCart] = useState<string[]>([]);

  // Load guest cart from localStorage on mount
  useEffect(() => {
    if (!session) {
      const storedCart = localStorage.getItem("guestCart");
      if (storedCart) {
        const cartIds = JSON.parse(storedCart);
        setGuestCart(cartIds);
        // Fetch product details for guest cart items
        fetchGuestCartItems(cartIds);
      }
    }
  }, [session]);

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
              fetch(`/api/products/${id}`).then((res) => res.json())
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
      }
    };

    fetchCartItems();
  }, [session]);

  // Fetch product details for guest cart items
  const fetchGuestCartItems = async (cartIds: string[]) => {
    try {
      const productPromises = cartIds.map((id) =>
        fetch(`/api/products/${id}`).then((res) => res.json())
      );
      const products = await Promise.all(productPromises);
      const cartProducts = products
        .filter((p) => p.success)
        .map((p) => ({ ...p.data, inCart: true }));
      setCartItems(cartProducts);
    } catch (error) {
      console.error("Error fetching guest cart items:", error);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      // Optimistically update the UI
      const productResponse = await fetch(`/api/products/${productId}`);
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
        // Handle guest cart
        const newGuestCart = [...guestCart, productId];
        setGuestCart(newGuestCart);
        localStorage.setItem("guestCart", JSON.stringify(newGuestCart));
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
          const productResponse = await fetch(`/api/products/${productId}`);
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
        // Handle guest cart
        const newGuestCart = guestCart.filter((id) => id !== productId);
        setGuestCart(newGuestCart);
        localStorage.setItem("guestCart", JSON.stringify(newGuestCart));
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
        // Handle guest cart
        setGuestCart([]);
        localStorage.removeItem("guestCart");
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
