"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { ParallaxProvider } from "react-scroll-parallax";
// import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <SessionProvider basePath="/api/auth" refetchInterval={5 * 60}>
          <ParallaxProvider>
            {/* <SmoothScrollProvider> */}
            <div className="smooth-scroll-container">
              <Header />
              <main className="pt-[16px] md:pt-[52px] flex-grow">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
            {/* </SmoothScrollProvider> */}
          </ParallaxProvider>
        </SessionProvider>
      </body>
    </html>
  );
};

export default Layout;
