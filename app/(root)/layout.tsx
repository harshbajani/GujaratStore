"use client";
import dynamic from "next/dynamic";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { ParallaxProvider } from "react-scroll-parallax";

// Dynamically import the smooth scroll hook with no SSR
const SmoothScrollProvider = dynamic(
  () =>
    import("@/components/SmoothScrollProvider").then(
      (mod) => mod.SmoothScrollProvider
    ),
  { ssr: false }
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <SessionProvider basePath="/api/auth">
          <ParallaxProvider>
            <SmoothScrollProvider>
              <div className="smooth-scroll-container">
                <Header />
                <main className="pt-[16px] md:pt-[52px] flex-grow">
                  {children}
                </main>
                <Toaster />
                <Footer />
              </div>
            </SmoothScrollProvider>
          </ParallaxProvider>
        </SessionProvider>
      </body>
    </html>
  );
};

export default Layout;
