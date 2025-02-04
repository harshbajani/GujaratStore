// smoothScroll.ts
import { useEffect, useRef } from "react";

export const useSmoothScroll = () => {
  const targetPosition = useRef(window.scrollY);
  const rafId = useRef<number | null>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const smoothScrollAnimation = () => {
      const currentPosition = window.scrollY;

      // Use a very small lerp factor for smoother transition
      const nextPosition = lerp(currentPosition, targetPosition.current, 0.1); // * Increase this value for faster transitions

      // Only scroll if the difference is significant
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

      // Calculate new target position with reduced multiplier
      const scrollMultiplier = 0.4; // Reduced from 1.2 for more control // * Increase this value for faster scrolling
      const newTargetPosition =
        targetPosition.current + e.deltaY * scrollMultiplier;

      // Clamp target position to valid scroll range
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

    // Touch handling
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

      // Update target position with touch movement
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

    // Add event listeners
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);
};
