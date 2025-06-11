"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Cookies from "js-cookie";

interface GuestContextType {
  guestCart: string[];
  guestWishlist: string[];
  addToGuestCart: (productId: string) => void;
  removeFromGuestCart: (productId: string) => void;
  addToGuestWishlist: (productId: string) => void;
  removeFromGuestWishlist: (productId: string) => void;
  clearGuestData: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const GuestProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [guestCart, setGuestCart] = useState<string[]>([]);
  const [guestWishlist, setGuestWishlist] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load guest data from cookies on mount
  useEffect(() => {
    if (!session && !isInitialized) {
      try {
        const storedCart = Cookies.get("guestCart");
        const storedWishlist = Cookies.get("guestWishlist");

        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          if (Array.isArray(parsedCart)) {
            setGuestCart(parsedCart);
          } else {
            console.error("Invalid guest cart data format");
            Cookies.remove("guestCart");
          }
        }

        if (storedWishlist) {
          const parsedWishlist = JSON.parse(storedWishlist);
          if (Array.isArray(parsedWishlist)) {
            setGuestWishlist(parsedWishlist);
          } else {
            console.error("Invalid guest wishlist data format");
            Cookies.remove("guestWishlist");
          }
        }
      } catch (error) {
        console.error("Error loading guest data:", error);
        Cookies.remove("guestCart");
        Cookies.remove("guestWishlist");
      } finally {
        setIsInitialized(true);
      }
    }
  }, [session, isInitialized]);

  // Update cookies when guest data changes
  useEffect(() => {
    if (!session && isInitialized) {
      try {
        // Set cookies with a 7-day expiry
        Cookies.set("guestCart", JSON.stringify(guestCart), { expires: 7 });
        Cookies.set("guestWishlist", JSON.stringify(guestWishlist), {
          expires: 7,
        });
      } catch (error) {
        console.error("Error saving guest data:", error);
      }
    }
  }, [guestCart, guestWishlist, session, isInitialized]);

  const addToGuestCart = (productId: string) => {
    if (!guestCart.includes(productId)) {
      setGuestCart((prev) => [...prev, productId]);
    }
  };

  const removeFromGuestCart = (productId: string) => {
    setGuestCart((prev) => prev.filter((id) => id !== productId));
  };

  const addToGuestWishlist = (productId: string) => {
    if (!guestWishlist.includes(productId)) {
      setGuestWishlist((prev) => [...prev, productId]);
    }
  };

  const removeFromGuestWishlist = (productId: string) => {
    setGuestWishlist((prev) => prev.filter((id) => id !== productId));
  };

  const clearGuestData = () => {
    setGuestCart([]);
    setGuestWishlist([]);
    Cookies.remove("guestCart");
    Cookies.remove("guestWishlist");
  };

  // Clear guest data when user signs in
  useEffect(() => {
    if (session) {
      clearGuestData();
    }
  }, [session]);

  return (
    <GuestContext.Provider
      value={{
        guestCart,
        guestWishlist,
        addToGuestCart,
        removeFromGuestCart,
        addToGuestWishlist,
        removeFromGuestWishlist,
        clearGuestData,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
};

export const useGuest = (): GuestContextType => {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error("useGuest must be used within a GuestProvider");
  }
  return context;
};
