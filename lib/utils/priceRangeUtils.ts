/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PriceRange {
  id: string;
  label: string;
  min: number;
  max: number;
  count?: number;
}

/**
 * Generates Amazon-style price range buckets based on min/max prices
 * @param minPrice - Lowest price in the dataset
 * @param maxPrice - Highest price in the dataset
 * @param products - Array of products to count items in each range
 * @returns Array of price range objects
 */
export function generatePriceRanges(
  minPrice: number,
  maxPrice: number,
  products: any[] = []
): PriceRange[] {
  if (minPrice >= maxPrice) {
    return [];
  }

  const priceRanges: PriceRange[] = [];
  const priceGap = maxPrice - minPrice;

  // Special case: If we have very few products, create ranges based on actual prices
  if (products.length <= 3) {
    const sortedPrices = products.map((p) => p.netPrice).sort((a, b) => a - b);
    sortedPrices.forEach((price) => {
      const rangeId = `${price}-${price}`;
      priceRanges.push({
        id: rangeId,
        label: `₹${price}`,
        min: price,
        max: price,
        count: products.filter((p) => p.netPrice === price).length,
      });
    });
    return priceRanges;
  }

  // Define different strategies based on price gap
  if (priceGap <= 500) {
    // Small price gap: ranges of 50-100
    const increment = priceGap <= 200 ? 50 : 100;
    let start = Math.floor(minPrice / increment) * increment;

    while (start < maxPrice) {
      const end = Math.min(start + increment, maxPrice);
      const count = products.filter((p) => {
        if (end === maxPrice) {
          // For the last range, include products at exactly maxPrice
          return p.netPrice >= start && p.netPrice <= end;
        } else {
          return p.netPrice >= start && p.netPrice < end;
        }
      }).length;

      if (count > 0) {
        priceRanges.push({
          id: `${start}-${end}`,
          label: end === maxPrice ? `₹${start}+` : `₹${start} - ₹${end}`,
          min: start,
          max: end,
          count,
        });
      }
      start = end;
    }
  } else if (priceGap <= 2000) {
    // Medium price gap: ranges of 200-500
    const ranges = [
      { start: minPrice, end: 500 },
      { start: 500, end: 1000 },
      { start: 1000, end: 1500 },
      { start: 1500, end: 2000 },
      { start: 2000, end: maxPrice },
    ];

    ranges.forEach(({ start, end }) => {
      if (start < maxPrice) {
        const adjustedEnd = Math.min(end, maxPrice);
        const count = products.filter((p) => {
          if (adjustedEnd === maxPrice) {
            // For the last range, include products at exactly maxPrice
            return p.netPrice >= start && p.netPrice <= adjustedEnd;
          } else {
            return p.netPrice >= start && p.netPrice < adjustedEnd;
          }
        }).length;

        if (count > 0) {
          priceRanges.push({
            id: `${start}-${adjustedEnd}`,
            label:
              adjustedEnd === maxPrice
                ? `₹${start}+`
                : `₹${start} - ₹${adjustedEnd}`,
            min: start,
            max: adjustedEnd,
            count,
          });
        }
      }
    });
  } else if (priceGap <= 10000) {
    // Large price gap: ranges of 1000-2000
    const ranges = [
      { start: minPrice, end: 1000 },
      { start: 1000, end: 2000 },
      { start: 2000, end: 5000 },
      { start: 5000, end: 10000 },
      { start: 10000, end: maxPrice },
    ];

    ranges.forEach(({ start, end }) => {
      if (start < maxPrice) {
        const adjustedEnd = Math.min(end, maxPrice);
        const count = products.filter((p) => {
          if (adjustedEnd === maxPrice) {
            // For the last range, include products at exactly maxPrice
            return p.netPrice >= start && p.netPrice <= adjustedEnd;
          } else {
            return p.netPrice >= start && p.netPrice < adjustedEnd;
          }
        }).length;

        if (count > 0) {
          priceRanges.push({
            id: `${start}-${adjustedEnd}`,
            label:
              adjustedEnd === maxPrice
                ? `₹${start}+`
                : `₹${start} - ₹${adjustedEnd}`,
            min: start,
            max: adjustedEnd,
            count,
          });
        }
      }
    });
  } else {
    // Very large price gap: custom ranges
    const ranges = [
      { start: minPrice, end: 1000 },
      { start: 1000, end: 5000 },
      { start: 5000, end: 10000 },
      { start: 10000, end: 25000 },
      { start: 25000, end: 50000 },
      { start: 50000, end: maxPrice },
    ];

    ranges.forEach(({ start, end }) => {
      if (start < maxPrice) {
        const adjustedEnd = Math.min(end, maxPrice);
        const count = products.filter((p) => {
          if (adjustedEnd === maxPrice) {
            // For the last range, include products at exactly maxPrice
            return p.netPrice >= start && p.netPrice <= adjustedEnd;
          } else {
            return p.netPrice >= start && p.netPrice < adjustedEnd;
          }
        }).length;

        if (count > 0) {
          priceRanges.push({
            id: `${start}-${adjustedEnd}`,
            label:
              adjustedEnd === maxPrice
                ? `₹${start}+`
                : `₹${start} - ₹${adjustedEnd}`,
            min: start,
            max: adjustedEnd,
            count,
          });
        }
      }
    });
  }

  const finalRanges = priceRanges.filter(
    (range) => range.count && range.count > 0
  );
  return finalRanges;
}

/**
 * Checks if a product falls within selected price ranges
 * @param productPrice - Price of the product
 * @param selectedRanges - Array of selected price range IDs
 * @param allRanges - Array of all available price ranges
 * @returns boolean indicating if product matches any selected range
 */
export function isProductInPriceRanges(
  productPrice: number,
  selectedRanges: string[],
  allRanges: PriceRange[]
): boolean {
  if (selectedRanges.length === 0) {
    return true; // No filters applied, show all products
  }

  return selectedRanges.some((rangeId) => {
    const range = allRanges.find((r) => r.id === rangeId);
    if (!range) {
      return false;
    }

    const matches = productPrice >= range.min && productPrice <= range.max;

    return matches;
  });
}

/**
 * Formats price for display
 * @param price - Price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
