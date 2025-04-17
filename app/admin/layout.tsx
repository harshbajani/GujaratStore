import { Toaster } from "@/components/ui/toaster";
import React from "react";

const AdminRootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
};

export default AdminRootLayout;
