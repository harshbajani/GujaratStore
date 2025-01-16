"use client";

import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <main>{children}</main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
};

export default Layout;
