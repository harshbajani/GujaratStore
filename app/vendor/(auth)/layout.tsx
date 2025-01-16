"use client";

import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import Image from "next/image";
import { withAuthProtection } from "./HOC";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="grid grid-cols-2">
      <div className="bg-brand h-screen flex-center flex-col">
        <div>
          <Image
            src="/favicon.png"
            alt="logo"
            height={500}
            width={500}
            className="h-96 w-full object-contain "
          />
          <h1 className="text-left text-8xl text-white font-bold font-playfair">
            The Gujarat Store
          </h1>
        </div>
      </div>
      <div className="flex-center w-full h-full">
        <SessionProvider>
          <div>{children}</div>
          <Toaster />
        </SessionProvider>
      </div>
    </main>
  );
};

export default withAuthProtection(AuthenticatedLayout);
