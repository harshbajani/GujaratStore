import { IProductResponse } from "@/types";
import { useEffect, useState } from "react";

interface FilterState {
  primaryCategories: string[];
  secondaryCategories: string[];
  colors: string[];
  priceRange: [number, number];
}

const useProductFilter = (products: IProductResponse[]) => {
  const [filters, setFilters] = useState<FilterState>({
    primaryCategories: [],
    secondaryCategories: [],
    colors: [],
    priceRange: [0, 0],
  });

  const [filteredProducts, setFilteredProducts] =
    useState<IProductResponse[]>(products);

  const filterProducts = () => {
    let filtered = [...products];

    if (filters.primaryCategories.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.primaryCategory &&
          filters.primaryCategories.includes(product.primaryCategory._id)
      );
    }

    if (filters.secondaryCategories.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.secondaryCategory &&
          filters.secondaryCategories.includes(product.secondaryCategory._id)
      );
    }

    if (filters.colors.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.productColor &&
          filters.colors.includes(product.productColor.toLowerCase())
      );
    }

    filtered = filtered.filter(
      (product) =>
        product.netPrice >= filters.priceRange[0] &&
        product.netPrice <= filters.priceRange[1]
    );

    return filtered;
  };

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
    setFilteredProducts(filterProducts());
  }, [filters, products]);

  return { filters, setFilters, filteredProducts };
};

export default useProductFilter;
