"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/CartContext";
import { GuestProvider } from "@/context/GuestContext";
import { SessionProvider } from "next-auth/react";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen flex flex-col">
      <SessionProvider>
        <GuestProvider>
          <CartProvider>
            <Header />
            <script src="https://accounts.google.com/gsi/client" async defer />
            <div className="flex-1 py-14">{children}</div>
            <Toaster />
            <Footer />
          </CartProvider>
        </GuestProvider>
      </SessionProvider>
    </main>
  );
};

export default AuthenticatedLayout;
