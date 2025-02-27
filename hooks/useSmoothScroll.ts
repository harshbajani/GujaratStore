// smoothScroll.ts
import { useEffect, useRef } from "react";

export const useSmoothScroll = () => {
  // Only initialize refs if we're in the browser
  const targetPosition = useRef(
    typeof window !== "undefined" ? window.scrollY : 0
  );
  const currentPosition = useRef(
    typeof window !== "undefined" ? window.scrollY : 0
  );
  const rafId = useRef<number | null>(null);
  const isScrolling = useRef(false);
  const isLargeScreen = useRef(false);
  const viewportHeight = useRef(
    typeof window !== "undefined" ? window.innerHeight : 0
  );
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Early return if we're not in the browser
    if (typeof window === "undefined") return;

    // Check if screen is large enough and update viewport height
    const updateViewportInfo = () => {
      const wasLargeScreen = isLargeScreen.current;
      isLargeScreen.current = window.innerWidth >= 1024;
      viewportHeight.current = window.innerHeight;

      // If transitioning from large to small screen, reset any ongoing animations
      if (wasLargeScreen && !isLargeScreen.current) {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        isScrolling.current = false;
      }
    };

    // Initial check and setup
    updateViewportInfo();
    currentPosition.current = window.scrollY;
    targetPosition.current = window.scrollY;

    // Update current position on regular scroll
    const handleScroll = () => {
      if (!isScrolling.current) {
        currentPosition.current = window.scrollY;
        targetPosition.current = window.scrollY;
      }
    };

    // Adaptive lerp function based on viewport and distance
    const lerp = (start: number, end: number, factor: number) => {
      // Calculate distance to target
      const distance = Math.abs(end - start);

      // Use a faster factor for larger distances, scaled by viewport height
      let adaptiveFactor = factor;
      const viewportFactor = Math.min(1, 800 / viewportHeight.current);

      if (distance > viewportHeight.current * 0.5)
        adaptiveFactor = 0.15 * viewportFactor;
      else if (distance > viewportHeight.current * 0.2)
        adaptiveFactor = 0.12 * viewportFactor;

      return start + (end - start) * adaptiveFactor;
    };

    const smoothScrollAnimation = () => {
      // Update current position reference
      currentPosition.current = window.scrollY;

      // Calculate next position with adaptive damping
      const nextPosition = lerp(
        currentPosition.current,
        targetPosition.current,
        0.1
      );

      // Only continue animation if there's meaningful movement remaining
      if (Math.abs(targetPosition.current - currentPosition.current) > 1) {
        window.scrollTo(0, nextPosition);
        rafId.current = requestAnimationFrame(smoothScrollAnimation);
      } else {
        // Snap to exact position to avoid subtle jittering
        window.scrollTo(0, targetPosition.current);
        isScrolling.current = false;
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Skip smooth scrolling if not on a large screen
      if (!isLargeScreen.current) return;

      e.preventDefault();

      // Clear any pending scroll timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Calculate scroll multiplier based on viewport height
      // Smaller screens get a larger multiplier to move more content per scroll
      const viewportAdjustment = Math.max(0.8, 1000 / viewportHeight.current);
      const scrollMultiplier = 1.2 * viewportAdjustment;

      // Scale the delta for more consistent behavior across devices
      const deltaY = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120);

      // Calculate new target position with viewport-adjusted multiplier
      const newTargetPosition =
        targetPosition.current + deltaY * scrollMultiplier;

      // Clamp to valid scroll range
      targetPosition.current = Math.max(
        0,
        Math.min(
          newTargetPosition,
          document.documentElement.scrollHeight - window.innerHeight
        )
      );

      // Start animation if not already running
      if (!isScrolling.current) {
        isScrolling.current = true;
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(smoothScrollAnimation);
      }

      // Set a timeout to stop scrolling after a period of inactivity
      scrollTimeout.current = setTimeout(() => {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        isScrolling.current = false;
      }, 150);
    };

    // Add event listeners
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateViewportInfo);

    return () => {
      // Clean up all event listeners and animations
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateViewportInfo);
    };
  }, []); // Empty dependency array
};
