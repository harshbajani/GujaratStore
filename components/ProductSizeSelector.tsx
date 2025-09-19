/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductSizeSelectorProps {
  productSizes: IProductSizePriceWithDetails[] | any[]; // Allow for flexible structure
  selectedSizeId?: string;
  onSizeSelect?: (sizePrice: IProductSizePriceWithDetails | any) => void;
  className?: string;
}

const ProductSizeSelector: React.FC<ProductSizeSelectorProps> = ({
  productSizes = [],
  selectedSizeId,
  onSizeSelect,
  className,
}) => {
  const [selectedSize, setSelectedSize] = useState<
    IProductSizePriceWithDetails | any | null
  >(null);

  // Initialize with first available size if no size selected
  useEffect(() => {
    if (productSizes.length > 0 && !selectedSize && !selectedSizeId) {
      const firstAvailableSize = productSizes.find((size) => size.quantity > 0);
      if (firstAvailableSize) {
        setSelectedSize(firstAvailableSize);
        onSizeSelect?.(firstAvailableSize);
      }
    }
  }, [productSizes, selectedSize, selectedSizeId, onSizeSelect]);

  // Handle external selectedSizeId changes
  useEffect(() => {
    if (selectedSizeId && productSizes.length > 0) {
      const size = productSizes.find(
        (s) =>
          getSizeId(s) === selectedSizeId || s.sizeId?._id === selectedSizeId
      );
      if (size) {
        setSelectedSize(size);
      }
    }
  }, [selectedSizeId, productSizes]);

  const handleSizeSelect = (sizePrice: IProductSizePriceWithDetails | any) => {
    if (sizePrice.quantity === 0) return; // Don't allow selection of out-of-stock sizes

    setSelectedSize(sizePrice);
    onSizeSelect?.(sizePrice);
  };

  // Helper function to safely get size label
  const getSizeLabel = (sizePrice: any) => {
    if (!sizePrice) return "Unknown Size";
    // Handle different structures
    if (sizePrice.size?.label) return sizePrice.size.label;
    if (sizePrice.sizeId?.label) return sizePrice.sizeId.label;
    // Fallback: if sizeId is not populated, create a label from other data
    if (sizePrice.mrp && sizePrice.netPrice) {
      return `Size ${sizePrice.netPrice} INR`;
    }
    return `Size ${sizePrice._id?.slice(-4) || "Unknown"}`;
  };

  // Helper function to safely get size ID for comparison
  const getSizeId = (sizePrice: any) => {
    if (!sizePrice) return null;
    // Handle different structures
    if (sizePrice.size?._id) return sizePrice.size._id;
    if (sizePrice.sizeId?._id) return sizePrice.sizeId._id;
    if (typeof sizePrice.sizeId === "string") return sizePrice.sizeId;
    // Fallback: use the productSize document _id
    return sizePrice._id;
  };

  const formatPrice = (price: number) => {
    if (typeof price !== "number" || isNaN(price)) {
      return "₹0";
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDiscountPercentage = (mrp: number, netPrice: number) => {
    if (
      typeof mrp !== "number" ||
      typeof netPrice !== "number" ||
      mrp === 0 ||
      isNaN(mrp) ||
      isNaN(netPrice)
    ) {
      return 0;
    }
    return Math.round(((mrp - netPrice) / mrp) * 100);
  };

  if (!productSizes || productSizes.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-center">
            No sizes available for this product.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check if productSizes has valid structure
  const hasValidSizeObjects = productSizes.every((size) => {
    return (
      size &&
      typeof size === "object" &&
      !Array.isArray(size) &&
      typeof size !== "string" &&
      (size.sizeId || size.mrp || size.netPrice) // Valid size object should have pricing info
    );
  });

  // Check if productSizes is just an array of strings (ObjectIds)
  const isStringArray = productSizes.every((size) => typeof size === "string");

  // If it's an array of strings (unpopulated ObjectIds), don't show size selector
  if (isStringArray) {
    console.warn(
      "ProductSize contains unpopulated ObjectId references:",
      productSizes
    );
    return null; // Don't render size selector for unpopulated references
  }

  if (!hasValidSizeObjects) {
    console.error("Invalid productSizes structure:", productSizes);
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-center text-red-500">
            Error loading size options. Please refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Size Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Select Size:</h3>
        <div className="flex flex-wrap gap-2">
          {productSizes
            .filter(Boolean)
            .map((sizePrice, index) => {
              if (!sizePrice) return null;

              const sizeId = getSizeId(sizePrice);
              const sizeLabel = getSizeLabel(sizePrice);
              const uniqueKey = sizeId || `size-${index}`;
              const isSelected =
                (selectedSize && getSizeId(selectedSize) === sizeId) ||
                selectedSize?._id === sizePrice._id;

              return (
                <Button
                  key={uniqueKey}
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handleSizeSelect(sizePrice)}
                  disabled={sizePrice.quantity === 0}
                  className={cn(
                    "relative",
                    sizePrice.quantity === 0 && "opacity-50 cursor-not-allowed",
                    isSelected ? "bg-brand hover:bg-brand-100" : "bg-none"
                  )}
                >
                  {sizeLabel}
                  {sizePrice.quantity === 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 text-xs px-1 py-0"
                    >
                      Out
                    </Badge>
                  )}
                </Button>
              );
            })
            .filter(Boolean)}
        </div>
      </div>

      {/* Selected Size Pricing Info */}
      {selectedSize && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Size: {selectedSize ? getSizeLabel(selectedSize) : "None"}
                </span>
                <Badge variant="outline">
                  {selectedSize.quantity > 0
                    ? `${selectedSize.quantity} in stock`
                    : "Out of stock"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-brand">
                  {formatPrice(selectedSize.netPrice)}
                </span>
                {selectedSize.mrp > selectedSize.netPrice && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(selectedSize.mrp)}
                    </span>
                    <Badge variant="secondary" className="text-green-600">
                      {getDiscountPercentage(
                        selectedSize.mrp,
                        selectedSize.netPrice
                      )}
                      % OFF
                    </Badge>
                  </>
                )}
              </div>

              {selectedSize.discountValue > 0 && (
                <div className="text-sm text-muted-foreground">
                  You save:{" "}
                  {formatPrice(selectedSize.mrp - selectedSize.netPrice)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductSizeSelector;
