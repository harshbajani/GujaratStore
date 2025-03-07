// SmoothScrollProvider.tsx
"use client";

import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { ReactNode } from "react";

export const SmoothScrollProvider = ({ children }: { children: ReactNode }) => {
  // Use the hook (which now checks for screen size internally)
  useSmoothScroll();

  return <>{children}</>;
};
