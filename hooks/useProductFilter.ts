import { useState, useEffect } from "react";
import { IProductResponse } from "@/types";

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

  const [filteredProducts, setFilteredProducts] =
    useState<IProductResponse[]>(products);

  // Calculate and set initial price range when products change
  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map((p) => p.netPrice);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));

      setFilters((prev) => ({
        ...prev,
        priceRange: [minPrice, maxPrice],
      }));
    }
  }, [products]);

  useEffect(() => {
    // Apply all filters
    const applyFilters = () => {
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

      setFilteredProducts(result);
    };

    applyFilters();
  }, [products, filters]);

  // Method to update filters
  const updateFilter = (
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
  };

  // Method to clear all filters
  const clearFilters = () => {
    // Recalculate price range when clearing filters
    const prices = products.map((p) => p.netPrice);
    const minPrice = Math.floor(Math.min(...prices));
    const maxPrice = Math.ceil(Math.max(...prices));

    setFilters({
      primaryCategories: [],
      secondaryCategories: [],
      colors: [],
      priceRange: [minPrice, maxPrice],
    });
  };

  return {
    filters,
    filteredProducts,
    updateFilter,
    clearFilters,
    setFilters,
  };
};

export default useProductFilter;
