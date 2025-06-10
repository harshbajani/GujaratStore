"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

type CartContextType = {
  cartItems: IProductResponse[];
  loading: boolean;
  error: string | null;
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<IProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Load on mount
  useEffect(() => {
    fetch("/api/user/cart")
      .then((r) => r.json())
      .then((r) => {
        if (r.success) setCartItems(r.data.cart || []);
        else setError("Could not load cart");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  // 2) Add
  const addToCart = async (productId: string) => {
    // Optimistic
    setCartItems((prev) => [...prev, { _id: productId } as any]);

    const res = await fetch("/api/user/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const json = await res.json();

    if (!json.success) {
      toast({
        title: "Error",
        description: json.message,
        variant: "destructive",
      });
      // rollback
      setCartItems((prev) => prev.filter((p) => p._id !== productId));
    }
  };

  // 3) Remove
  const removeFromCart = async (productId: string) => {
    setCartItems((prev) => prev.filter((p) => p._id !== productId));

    const res = await fetch("/api/user/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const json = await res.json();
    if (!json.success) {
      toast({
        title: "Error",
        description: json.message,
        variant: "destructive",
      });
      // rollback
      setCartItems((prev) => [...prev, { _id: productId } as any]);
    }
  };

  return (
    <CartContext.Provider
      value={{ cartItems, loading, error, addToCart, removeFromCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("`useCart` must be inside `<CartProvider>`");
  return ctx;
};
