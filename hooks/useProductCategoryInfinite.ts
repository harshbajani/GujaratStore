"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { getProductRating } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  count: number;
}

interface FilterState {
  secondaryCategories: string[];
  colors: string[];
  priceRange: [number, number];
}

interface UseProductCategoryInfiniteProps {
  categoryId: string;
  initialLimit?: number;
}

export const useProductCategoryInfinite = ({
  categoryId,
  initialLimit = 12,
}: UseProductCategoryInfiniteProps) => {
  const { cartItems = [], addToCart, removeFromCart } = useCart();
  const {
    wishlistItems = [],
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();

  // Filter and sort states
  const [sortBy, setSortBy] = useState<string>("featured");
  const [filters, setFilters] = useState<FilterState>({
    secondaryCategories: [],
    colors: [],
    priceRange: [0, 0],
  });
  const [tempFilters, setTempFilters] = useState<FilterState>({
    secondaryCategories: [],
    colors: [],
    priceRange: [0, 0],
  });
  const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([0, 0]);

  // Metadata states
  const [secondaryCategories, setSecondaryCategories] = useState<Category[]>([]);
  const [availableColors, setAvailableColors] = useState<{ color: string; count: number }[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  // Fetch function for infinite scroll
  const fetchProducts = useCallback(
    async (page: number): Promise<PaginatedResponse<IProductResponse>> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: initialLimit.toString(),
        categoryId: categoryId,
        sortBy,
        sortOrder: getSortOrder(sortBy),
      });

      // Add filters
      if (filters.secondaryCategories.length > 0) {
        params.append("secondaryCategories", filters.secondaryCategories.join(","));
      }
      if (filters.colors.length > 0) {
        params.append("colors", filters.colors.join(","));
      }
      if (filters.priceRange[0] > 0 || filters.priceRange[1] > 0) {
        if (filters.priceRange[0] > 0) params.append("minPrice", filters.priceRange[0].toString());
        if (filters.priceRange[1] > 0) params.append("maxPrice", filters.priceRange[1].toString());
      }

      const response = await fetch(`/api/product-category?${params.toString()}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Update cart and wishlist status
        data.data = data.data.map((product: IProductResponse) => ({
          ...product,
          wishlist: wishlistItems.some((item) => item._id === product._id),
          inCart: cartItems.some((item) => item._id === product._id),
        }));

        // Load metadata only on first page and first load
        if (page === 1 && !metadataLoaded) {
          await loadMetadata();
          setMetadataLoaded(true);
        }
      }

      return data;
    },
    [categoryId, initialLimit, sortBy, filters, cartItems, wishlistItems, metadataLoaded]
  );

  // Load metadata (categories, colors, price range) - separate call to get all data for filters
  const loadMetadata = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Get a large number to calculate metadata
        categoryId: categoryId,
      });

      const response = await fetch(`/api/product-category?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        const products = result.data;
        processProductMetadata(products);
      }
    } catch (error) {
      console.error("Error loading metadata:", error);
    }
  }, [categoryId]);

  // Process product data to extract categories, colors, and price range
  const processProductMetadata = useCallback((products: IProductResponse[]) => {
    // Extract secondary categories
    const secondaryCatMap = new Map<string, { id: string; name: string; count: number }>();
    products.forEach((product) => {
      if (product.secondaryCategory) {
        const id = product.secondaryCategory._id;
        if (secondaryCatMap.has(id)) {
          const cat = secondaryCatMap.get(id)!;
          cat.count += 1;
          secondaryCatMap.set(id, cat);
        } else {
          secondaryCatMap.set(id, {
            id,
            name: product.secondaryCategory.name,
            count: 1,
          });
        }
      }
    });

    const secondaryCats = Array.from(secondaryCatMap.values()).map(({ id, name, count }) => ({
      _id: id,
      name,
      count,
    }));
    setSecondaryCategories(secondaryCats);

    // Extract available colors
    const colorMap = new Map<string, number>();
    products.forEach((product) => {
      if (product.productColor) {
        const color = product.productColor.toLowerCase();
        colorMap.set(color, (colorMap.get(color) || 0) + 1);
      }
    });

    const colors = Array.from(colorMap.entries()).map(([color, count]) => ({
      color,
      count,
    }));
    setAvailableColors(colors);

    // Calculate price range
    if (products.length > 0) {
      const prices = products.map((p) => p.netPrice);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      setPriceRange([minPrice, maxPrice]);

      // Set initial filters if not already set
      if (currentPriceRange[0] === 0 && currentPriceRange[1] === 0) {
        setCurrentPriceRange([minPrice, maxPrice]);
        setFilters((prev) => ({ ...prev, priceRange: [minPrice, maxPrice] }));
        setTempFilters((prev) => ({ ...prev, priceRange: [minPrice, maxPrice] }));
      }
    }
  }, [currentPriceRange]);

  const {
    data: products,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    refresh,
    ref: loadMoreRef,
  } = useInfiniteScroll<IProductResponse>({
    fetchFunction: fetchProducts,
    enabled: !!categoryId,
    threshold: 0.1,
    rootMargin: "200px",
  });

  // Helper function to get sort order
  const getSortOrder = (sortBy: string): "asc" | "desc" => {
    switch (sortBy) {
      case "price-low-to-high":
      case "rating-low-to-high":
        return "asc";
      default:
        return "desc";
    }
  };

  // Sort products client-side for better UX (since we have all loaded products)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case "price-low-to-high":
          return a.netPrice - b.netPrice;
        case "price-high-to-low":
          return b.netPrice - a.netPrice;
        case "rating-high-to-low":
          return getProductRating(b) - getProductRating(a);
        case "rating-low-to-high":
          return getProductRating(a) - getProductRating(b);
        case "featured":
        default:
          return 0;
      }
    });
  }, [products, sortBy]);

  // Handle filter changes
  const handleSecondaryCategoryChange = useCallback((id: string, checked: boolean) => {
    const newSecondaryCategories = checked
      ? [...filters.secondaryCategories, id]
      : filters.secondaryCategories.filter((catId) => catId !== id);

    const newFilters = { ...filters, secondaryCategories: newSecondaryCategories };
    setFilters(newFilters);
    setTempFilters(newFilters);
    refresh(); // Refresh data with new filters
  }, [filters, refresh]);

  const handleColorChange = useCallback((color: string, checked: boolean) => {
    const newColors = checked
      ? [...filters.colors, color]
      : filters.colors.filter((c) => c !== color);

    const newFilters = { ...filters, colors: newColors };
    setFilters(newFilters);
    setTempFilters(newFilters);
    refresh(); // Refresh data with new filters
  }, [filters, refresh]);

  const handlePriceRangeChange = useCallback((value: number[]) => {
    const newRange = [value[0], value[1]] as [number, number];
    setCurrentPriceRange(newRange);
    
    const newFilters = { ...filters, priceRange: newRange };
    setFilters(newFilters);
    setTempFilters(newFilters);
    refresh(); // Refresh data with new filters
  }, [filters, refresh]);

  const clearFilters = useCallback(() => {
    const resetFilters = {
      secondaryCategories: [],
      colors: [],
      priceRange: priceRange,
    };
    setFilters(resetFilters);
    setTempFilters(resetFilters);
    setCurrentPriceRange(priceRange);
    refresh(); // Refresh data with cleared filters
  }, [priceRange, refresh]);

  // Handle wishlist toggle
  const handleToggleWishlist = useCallback(
    async (e: React.MouseEvent, product: IProductResponse) => {
      e.preventDefault();
      e.stopPropagation();

      if (!product._id) return;

      try {
        const isInWishlist = wishlistItems.some((item) => item._id === product._id);

        if (isInWishlist) {
          await removeFromWishlist(product._id);
        } else {
          await addToWishlist(product._id);
        }
      } catch (error) {
        console.error("Error updating wishlist:", error);
      }
    },
    [wishlistItems, addToWishlist, removeFromWishlist]
  );

  // Handle cart toggle
  const handleToggleCart = useCallback(
    async (e: React.MouseEvent, product: IProductResponse) => {
      e.preventDefault();
      e.stopPropagation();

      if (!product._id) return;

      try {
        const isInCart = cartItems.some((item) => item._id === product._id);

        if (isInCart) {
          await removeFromCart(product._id);
        } else {
          await addToCart(product._id);
        }
      } catch (error) {
        console.error("Error updating cart:", error);
      }
    },
    [cartItems, addToCart, removeFromCart]
  );

  // Refresh when sort changes
  useEffect(() => {
    if (metadataLoaded) {
      refresh();
    }
  }, [sortBy, refresh, metadataLoaded]);

  return {
    // Data
    products: sortedProducts,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    
    // Sorting
    sortBy,
    setSortBy,
    
    // Filtering
    filters,
    tempFilters,
    currentPriceRange,
    secondaryCategories,
    availableColors,
    priceRange,
    
    // Actions
    handleToggleCart,
    handleToggleWishlist,
    handleSecondaryCategoryChange,
    handleColorChange,
    handlePriceRangeChange,
    clearFilters,
    refresh,
    
    // Infinite scroll
    loadMoreRef,
  };
};
