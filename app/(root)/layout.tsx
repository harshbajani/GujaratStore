"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import FlipkartHomeHeader from "@/components/FlipkartHomeHeader";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/context/CartContext";
import { SessionProvider } from "next-auth/react";
import { GuestProvider } from "@/context/GuestContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ParallaxProvider } from "react-scroll-parallax";
import { usePathname } from "next/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <SessionProvider
          basePath="/api/auth"
          refetchInterval={0}
          refetchOnWindowFocus={false}
        >
          <ParallaxProvider>
            <GuestProvider>
              <CartProvider>
                <WishlistProvider>
                  <div className="smooth-scroll-container">
                    {isHomePage ? <FlipkartHomeHeader /> : <Header />}
                    <main className=" flex-grow">{children}</main>
                    <Footer />
                  </div>
                  <Toaster richColors />
                </WishlistProvider>
              </CartProvider>
            </GuestProvider>
          </ParallaxProvider>
        </SessionProvider>
      </body>
    </html>
  );
};

export default Layout;
