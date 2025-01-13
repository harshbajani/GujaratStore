"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen flex flex-col">
      <SessionProvider>
        <Header />
        <div className="flex-1 main-content">{children}</div>
        <Toaster />
        <Footer />
      </SessionProvider>
    </main>
  );
};

export default AuthenticatedLayout;
