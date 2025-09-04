"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import { useGuest } from "./GuestContext";
import Cookies from "js-cookie";

interface CartItem extends IProductResponse {
  cartQuantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  subtotal: number;
  deliveryCharges: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const { guestCart, addToGuestCart, removeFromGuestCart } = useGuest();

  // Calculate cart totals
  const cartCount = cartItems.length;
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
      return product.deliveryCharges || 0;
    },
    []
  );

  // Fetch cart items function
  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);

      if (session) {
        // Fetch authenticated user's cart
        const response = await fetch("/api/user/cart");
        const data = await response.json();
        
        if (data.success) {
          const cartProductIds = data.data?.cart || [];
          
          if (cartProductIds.length === 0) {
            setCartItems([]);
            return;
          }

          // Fetch full product details for each cart item
          const productPromises = cartProductIds.map((id: string) =>
            fetch(`/api/vendor/products/${id}`).then((res) => res.json())
          );
          const products = await Promise.all(productPromises);
          const cartProducts = products
            .filter((p) => p.success)
            .map((p) => ({
              ...p.data,
              cartQuantity: 1,
              deliveryCharges: calculateDeliveryCharges(p.data),
              inCart: true
            }));
          setCartItems(cartProducts);
        } else {
          setCartItems([]);
        }
      } else if (guestCart && guestCart.length > 0) {
        // Fetch product details for guest cart items
        const productPromises = guestCart.map((id) =>
          fetch(`/api/vendor/products/${id}`).then((res) => res.json())
        );
        const products = await Promise.all(productPromises);
        const cartProducts = products
          .filter((p) => p.success)
          .map((p) => ({
            ...p.data,
            cartQuantity: 1,
            deliveryCharges: calculateDeliveryCharges(p.data),
            inCart: true
          }));
        setCartItems(cartProducts);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [session, guestCart, calculateDeliveryCharges]);

  // Initial cart load
  useEffect(() => {
    refreshCart();
  }, [session?.user?.email, guestCart]);

  const addToCart = useCallback(async (productId: string) => {
    try {
      // Check if item already exists
      const existingItem = cartItems.find(item => item._id === productId);
      if (existingItem) {
        await updateQuantity(productId, existingItem.cartQuantity + 1);
        return;
      }

      // Fetch product data first for optimistic update
      const productResponse = await fetch(`/api/vendor/products/${productId}`);
      const productData = await productResponse.json();
      
      if (!productData.success) {
        throw new Error("Failed to fetch product data");
      }

      // Optimistically update the UI immediately
      const newItem: CartItem = {
        ...productData.data,
        cartQuantity: 1,
        deliveryCharges: calculateDeliveryCharges(productData.data),
        inCart: true
      };
      
      setCartItems(prev => [...prev, newItem]);

      // Then make the API call
      if (session) {
        const response = await fetch("/api/user/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          // Revert the optimistic update if the API call fails
          setCartItems(prev => prev.filter(item => item._id !== productId));
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
  }, [cartItems, session, addToGuestCart, calculateDeliveryCharges]);

  const removeFromCart = useCallback(async (productId: string) => {
    try {
      // Store the item being removed for potential rollback
      const removedItem = cartItems.find(item => item._id === productId);

      // Optimistically update the UI immediately
      setCartItems(prev => prev.filter(item => item._id !== productId));

      // Then make the API call
      if (session) {
        const response = await fetch("/api/user/cart", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          // Revert the optimistic update if the API call fails
          if (removedItem) {
            setCartItems(prev => [...prev, removedItem]);
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
  }, [cartItems, session, removeFromGuestCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    try {
      if (quantity < 1) return;

      // Store the original item for potential rollback
      const originalItem = cartItems.find(item => item._id === productId);

      // Optimistically update the UI immediately
      setCartItems(prev => 
        prev.map(item => 
          item._id === productId 
            ? { ...item, cartQuantity: quantity }
            : item
        )
      );

      if (session) {
        const response = await fetch("/api/user/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });

        if (!response.ok) {
          // Revert the optimistic update if the API call fails
          if (originalItem) {
            setCartItems(prev => 
              prev.map(item => 
                item._id === productId 
                  ? { ...item, cartQuantity: originalItem.cartQuantity }
                  : item
              )
            );
          }
          throw new Error("Failed to update quantity");
        }
      }
      // For guest users, the quantity is only maintained in local state
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  }, [cartItems, session]);

  const clearCart = useCallback(async () => {
    try {
      // Store current cart for potential rollback
      const currentCart = [...cartItems];

      // Optimistically update the UI immediately
      setCartItems([]);

      if (session) {
        const response = await fetch("/api/user/cart", {
          method: "DELETE",
        });

        if (!response.ok) {
          // Revert the optimistic update if the API call fails
          setCartItems(currentCart);
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
  }, [cartItems, session]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        subtotal,
        deliveryCharges,
        total,
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
