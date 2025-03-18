"use client";
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const DualThumbSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Slider>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Slider> & {
    className?: string;
  }
>(({ value, ...props }, ref) => {
  const isRange = Array.isArray(value) && value.length === 2;

  return (
    <SliderPrimitive.Slider
      ref={ref}
      {...props}
      value={value}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        props.className
      )}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {isRange ? (
        <>
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        </>
      ) : (
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      )}
    </SliderPrimitive.Slider>
  );
});

DualThumbSlider.displayName = SliderPrimitive.Slider.displayName;

export { DualThumbSlider };
