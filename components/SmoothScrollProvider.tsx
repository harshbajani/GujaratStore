"use client";
import { ReactNode } from "react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export const SmoothScrollProvider = ({ children }: { children: ReactNode }) => {
  useSmoothScroll();
  return <>{children}</>;
};
