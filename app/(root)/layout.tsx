"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/CartContext";
import { SessionProvider } from "next-auth/react";
import { GuestProvider } from "@/context/GuestContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ParallaxProvider } from "react-scroll-parallax";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <SessionProvider
          basePath="/api/auth"
          refetchInterval={0}
          refetchOnWindowFocus={false}
        >
          <ParallaxProvider>
            <CartProvider>
              <GuestProvider>
                <WishlistProvider>
                  <div className="smooth-scroll-container">
                    <Header />
                    <main className="pt-[16px] md:pt-[52px] flex-grow">
                      {children}
                    </main>
                    <Footer />
                  </div>
                  <Toaster />
                </WishlistProvider>
              </GuestProvider>
            </CartProvider>
          </ParallaxProvider>
        </SessionProvider>
      </body>
    </html>
  );
};

export default Layout;
