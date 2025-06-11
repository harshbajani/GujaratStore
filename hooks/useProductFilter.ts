import { useState, useEffect, useMemo, useCallback } from "react";

interface Filters {
  primaryCategories: string[];
  secondaryCategories: string[];
  colors: string[];
  priceRange: [number, number];
}

const useProductFilter = (products: IProductResponse[]) => {
  const [filters, setFilters] = useState<Filters>({
    primaryCategories: [],
    secondaryCategories: [],
    colors: [],
    priceRange: [0, 0], // Initial placeholder
  });

  // Memoize price range calculations
  const priceRange = useMemo((): [number, number] => {
    if (products.length === 0) return [0, 0];
    const prices = products.map((p) => p.netPrice);
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    return [min, max];
  }, [products]);

  // Set initial price range when products change
  useEffect(() => {
    if (products.length > 0) {
      setFilters((prev) => ({
        ...prev,
        priceRange: priceRange,
      }));
    }
  }, [priceRange]);

  // Memoize filtered products
  const filteredProducts = useMemo(() => {
    let result = products;

    // Primary Category Filter
    if (filters.primaryCategories.length > 0) {
      result = result.filter((p) =>
        filters.primaryCategories.includes(p.primaryCategory?._id || "")
      );
    }

    // Secondary Category Filter
    if (filters.secondaryCategories.length > 0) {
      result = result.filter((p) =>
        filters.secondaryCategories.includes(p.secondaryCategory?._id || "")
      );
    }

    // Color Filter
    if (filters.colors.length > 0) {
      result = result.filter((p) =>
        filters.colors.includes(p.productColor?.toLowerCase() || "")
      );
    }

    // Price Range Filter
    result = result.filter(
      (p) =>
        p.netPrice >= filters.priceRange[0] &&
        p.netPrice <= filters.priceRange[1]
    );

    return result;
  }, [products, filters]);

  // Memoize filter update function
  const updateFilter = useCallback(
    (
      filterType: keyof Filters,
      value: string | [number, number],
      checked?: boolean
    ) => {
      setFilters((prev) => {
        switch (filterType) {
          case "primaryCategories":
          case "secondaryCategories":
          case "colors":
            const currentFilter = prev[filterType];
            return {
              ...prev,
              [filterType]: checked
                ? [...currentFilter, value as string]
                : currentFilter.filter((v) => v !== value),
            };
          case "priceRange":
            return {
              ...prev,
              priceRange: value as [number, number],
            };
        }
      });
    },
    []
  );

  // Memoize clear filters function
  const clearFilters = useCallback(() => {
    setFilters({
      primaryCategories: [],
      secondaryCategories: [],
      colors: [],
      priceRange: priceRange,
    });
  }, [priceRange]);

  return {
    filters,
    filteredProducts,
    updateFilter,
    clearFilters,
    setFilters,
  };
};

export default useProductFilter;
