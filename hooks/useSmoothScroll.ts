// smoothScroll.ts
import { useEffect, useRef } from "react";

export const useSmoothScroll = () => {
  // Only initialize the ref if we're in the browser
  const targetPosition = useRef(
    typeof window !== "undefined" ? window.scrollY : 0
  );
  const rafId = useRef<number | null>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    // Early return if we're not in the browser
    if (typeof window === "undefined") return;

    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const smoothScrollAnimation = () => {
      const currentPosition = window.scrollY;
      const nextPosition = lerp(currentPosition, targetPosition.current, 0.1);

      if (Math.abs(targetPosition.current - currentPosition) > 0.5) {
        window.scrollTo(0, nextPosition);
        rafId.current = requestAnimationFrame(smoothScrollAnimation);
      } else {
        isScrolling.current = false;
        if (rafId.current) cancelAnimationFrame(rafId.current);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const scrollMultiplier = 0.5;
      const newTargetPosition =
        targetPosition.current + e.deltaY * scrollMultiplier;

      targetPosition.current = Math.max(
        0,
        Math.min(
          newTargetPosition,
          document.documentElement.scrollHeight - window.innerHeight
        )
      );

      if (!isScrolling.current) {
        isScrolling.current = true;
        rafId.current = requestAnimationFrame(smoothScrollAnimation);
      }
    };

    let lastTouchY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        isScrolling.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;
      lastTouchY = touchY;

      const newTargetPosition = window.scrollY + deltaY;
      targetPosition.current = Math.max(
        0,
        Math.min(
          newTargetPosition,
          document.documentElement.scrollHeight - window.innerHeight
        )
      );

      if (!isScrolling.current) {
        isScrolling.current = true;
        rafId.current = requestAnimationFrame(smoothScrollAnimation);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []); // Empty dependency array
};
