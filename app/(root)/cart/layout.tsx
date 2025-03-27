"use client";
import { useAuth } from "@/hooks/useAuth";
import React, { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth({
    requireAuth: true,
    protectedRoutes: ["/cart"],
  });
  if (isAuthenticated) {
    return <div>{children}</div>;
  }
};

export default Layout;
