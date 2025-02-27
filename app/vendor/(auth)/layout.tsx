"use client";

import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import Image from "next/image";
import { withAuthProtection } from "./HOC";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="grid grid-cols-1 lg:grid-cols-2 w-full min-h-screen">
      <div className="hidden lg:flex bg-brand justify-center items-center flex-col">
        <div>
          <Image
            src="/favicon.png"
            alt="logo"
            height={500}
            width={500}
            className="h-96 w-full object-contain"
          />
          <h1 className="text-left text-8xl text-white font-bold font-playfair">
            The Gujarat Store
          </h1>
        </div>
      </div>
      <div className="w-full min-h-screen flex items-center justify-center">
        <SessionProvider>
          <div className="w-full">{children}</div>
          <Toaster />
        </SessionProvider>
      </div>
    </main>
  );
};

export default withAuthProtection(AuthenticatedLayout);
