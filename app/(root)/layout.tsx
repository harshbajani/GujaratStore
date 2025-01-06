"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SessionProvider } from "next-auth/react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SessionProvider>
          <Header />
          <main className="pt-[16px] md:pt-[52px] flex-grow">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
};

export default Layout;
