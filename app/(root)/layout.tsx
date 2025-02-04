"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { SessionProvider } from "next-auth/react";
import { ParallaxProvider } from "react-scroll-parallax";

// Main Layout component
const Layout = ({ children }: { children: React.ReactNode }) => {
  useSmoothScroll();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <SessionProvider basePath="/api/auth">
          <ParallaxProvider>
            <div className="smooth-scroll-container">
              <Header />
              <main className="pt-[16px] md:pt-[52px] flex-grow">
                {children}
              </main>
              <Toaster />
              <Footer />
            </div>
          </ParallaxProvider>
        </SessionProvider>
      </body>
    </html>
  );
};

export default Layout;
