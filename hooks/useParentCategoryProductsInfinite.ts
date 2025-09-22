"use client";

import { useState, useCallback, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useDebounce } from "./useDebounce";
import { getProductRating } from "@/lib/utils";
import {
  generatePriceRanges,
  isProductInPriceRanges,
} from "@/lib/utils/priceRangeUtils";
import {
  urlParamsToFilters,
  updateUrlWithFilters,
  generateShareableUrl,
  hasActiveFilters,
} from "@/lib/utils/urlParams";
import { useSearchParams, usePathname } from "next/navigation";

interface Category {
  _id: string;
  name: string;
  count: number;
}

interface FilterState {
  secondaryCategories: string[];
  colors: string[];
  priceRange: [number, number];
  priceRanges: string[];
}

interface UseParentCategoryProductsInfiniteProps {
  parentCategorySlug: string;
  initialLimit?: number;
}

export const useParentCategoryProductsInfinite = ({
  parentCategorySlug,
  initialLimit = 10,
}: UseParentCategoryProductsInfiniteProps) => {
  const { cartItems = [], addToCart, removeFromCart } = useCart();
  const {
    wishlistItems = [],
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();

  // URL and routing hooks
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Filter and sort states - initialize from URL params
  const [isInitialized, setIsInitialized] = useState(false);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [filters, setFilters] = useState<FilterState>({
    secondaryCategories: [],
    colors: [],
    priceRange: [0, 0],
    priceRanges: [],
  });
  const [tempFilters, setTempFilters] = useState<FilterState>({
    secondaryCategories: [],
    colors: [],
    priceRange: [0, 0],
    priceRanges: [],
  });

  // tempFilters are kept for compatibility but auto-sync with filters
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([
    0, 0,
  ]);

  // Metadata states
  const [secondaryCategories, setSecondaryCategories] = useState<Category[]>(
    []
  );
  const [availableColors, setAvailableColors] = useState<
    { color: string; count: number }[]
  >([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [allCategoryProducts, setAllCategoryProducts] = useState<
    IProductResponse[]
  >([]);

  // Initialize filters and sort from URL parameters
  useEffect(() => {
    if (
      searchParams &&
      priceRange[0] !== 0 &&
      priceRange[1] !== 0 &&
      !isInitialized
    ) {
      const urlState = urlParamsToFilters(searchParams, priceRange);
      setFilters(urlState.filters);
      setSortBy(urlState.sortBy);
      setCurrentPriceRange(urlState.filters.priceRange);
      setIsInitialized(true);
    }
  }, [searchParams, priceRange, isInitialized]);

  // Sync URL when filters or sort changes (but only after initialization)
  useEffect(() => {
    if (isInitialized && priceRange[0] !== 0 && priceRange[1] !== 0) {
      updateUrlWithFilters(filters, sortBy, pathname);
    }
  }, [filters, sortBy, pathname, isInitialized, priceRange]);

  const loadMetadata = useCallback(async () => {
    try {
      // First get the parent category ID from slug
      const categoryResponse = await fetch(`/api/category/${parentCategorySlug}`);
      const categoryData = await categoryResponse.json();
      
      if (!categoryData.success) {
        console.error("Failed to fetch parent category:", categoryData.error);
        return;
      }
      
      const parentCategoryId = categoryData.data._id;
      
      const response = await fetch("/api/products?all=true");
      const result = await response.json();

      if (result.success && result.data) {
        // Filter products by parent category ID
        const filteredProducts = result.data.filter(
          (product: IProductResponse) => {
            const productParentId =
              typeof product.parentCategory === "object"
                ? product.parentCategory._id
                : product.parentCategory;
            return productParentId === parentCategoryId;
          }
        );
        processProductMetadata(filteredProducts);
      }
    } catch (error) {
      console.error("Error loading metadata:", error);
    }
  }, [parentCategorySlug]);

  // Fetch function for infinite scroll
  const fetchProducts = useCallback(
    async (page: number): Promise<PaginatedResponse<IProductResponse>> => {
      try {
        // First get the parent category ID from slug
        const categoryResponse = await fetch(`/api/category/${parentCategorySlug}`);
        const categoryData = await categoryResponse.json();
        
        if (!categoryData.success) {
          console.error("Failed to fetch parent category:", categoryData.error);
          return {
            success: false,
            error: categoryData.error || "Failed to fetch parent category",
          };
        }
        
        const parentCategoryId = categoryData.data._id;
        
        const response = await fetch("/api/products?all=true");
        const result = await response.json();

        if (!result.success || !result.data) {
          console.error("Failed to fetch products:", result.error);
          return {
            success: false,
            error: result.error || "Failed to fetch products",
          };
        }

        // Filter products by parent category ID
        let filteredProducts = result.data.filter((product: IProductResponse) => {
          const productParentId =
            typeof product.parentCategory === "object"
              ? product.parentCategory._id
              : product.parentCategory;
          return productParentId === parentCategoryId;
        });

      // Apply filters
      if (filters.secondaryCategories.length > 0) {
        filteredProducts = filteredProducts.filter(
          (product: IProductResponse) =>
            filters.secondaryCategories.includes(
              product.secondaryCategory?._id || ""
            )
        );
      }

      if (filters.colors.length > 0) {
        filteredProducts = filteredProducts.filter(
          (product: IProductResponse) =>
            filters.colors.includes(product.productColor?.toLowerCase() || "")
        );
      }

      // Apply price range filter (Amazon-style)
      if (filters.priceRanges.length > 0) {
        // Build price ranges from the full category dataset
        const allCategoryPrices = result.data.filter((p: IProductResponse) => {
          const productParentId =
            typeof p.parentCategory === "object"
              ? p.parentCategory._id
              : p.parentCategory;
          return productParentId === parentCategoryId;
        });
        const minPrice = Math.min(
          ...allCategoryPrices.map((p: IProductResponse) => p.netPrice)
        );
        const maxPrice = Math.max(
          ...allCategoryPrices.map((p: IProductResponse) => p.netPrice)
        );

        const availablePriceRanges = generatePriceRanges(
          minPrice,
          maxPrice,
          allCategoryPrices
        );

        filteredProducts = filteredProducts.filter(
          (product: IProductResponse) => {
            const matches = isProductInPriceRanges(
              product.netPrice,
              filters.priceRanges,
              availablePriceRanges
            );
            return matches;
          }
        );
      }

      // Apply price range filter only if it's different from the full range
      const hasMinPriceFilter =
        filters.priceRange[0] > 0 &&
        filters.priceRange[0] >
          Math.min(...result.data.map((p: IProductResponse) => p.netPrice));
      const hasMaxPriceFilter =
        filters.priceRange[1] > 0 &&
        filters.priceRange[1] <
          Math.max(...result.data.map((p: IProductResponse) => p.netPrice));

      if (hasMinPriceFilter || hasMaxPriceFilter) {
        filteredProducts = filteredProducts.filter(
          (product: IProductResponse) => {
            const price = product.netPrice;
            const minPrice = hasMinPriceFilter ? filters.priceRange[0] : 0;
            const maxPrice = hasMaxPriceFilter
              ? filters.priceRange[1]
              : Number.MAX_VALUE;
            return price >= minPrice && price <= maxPrice;
          }
        );
      }

      // Apply sorting
      filteredProducts.sort((a: IProductResponse, b: IProductResponse) => {
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

      // Apply pagination
      const startIndex = (page - 1) * initialLimit;
      const endIndex = startIndex + initialLimit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      const totalItems = filteredProducts.length;
      const totalPages = Math.ceil(totalItems / initialLimit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const data = {
        success: true,
        data: paginatedProducts,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: initialLimit,
          hasNext,
          hasPrev,
        },
      };

      if (data.success && data.data) {
        // Update cart and wishlist status
        data.data = data.data.map((product: IProductResponse) => ({
          ...product,
          wishlist: wishlistItems.some((item) => item._id === product._id),
          inCart: cartItems.some((item) => item._id === product._id),
        }));

        // Store all category products for calculating price ranges
        if (page === 1) {
          const categoryProducts = result.data.filter(
            (product: IProductResponse) => {
              const productParentId =
                typeof product.parentCategory === "object"
                  ? product.parentCategory._id
                  : product.parentCategory;
              return productParentId === parentCategoryId;
            }
          );
          setAllCategoryProducts(categoryProducts);
        }

        // Load metadata only on first page and first load
        if (page === 1 && !metadataLoaded) {
          await loadMetadata();
          setMetadataLoaded(true);
        }
      }

      return data;
    } catch (error) {
      console.error("Error in fetchProducts:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch products",
      };
    }
    },
    [
      parentCategorySlug,
      initialLimit,
      sortBy,
      filters,
      cartItems,
      wishlistItems,
      metadataLoaded,
      loadMetadata,
    ]
  );

  // Process product data to extract categories, colors, and price range
  const processProductMetadata = useCallback(
    (products: IProductResponse[]) => {
      // Extract secondary categories
      const secondaryCatMap = new Map<
        string,
        { id: string; name: string; count: number }
      >();
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

      const secondaryCats = Array.from(secondaryCatMap.values()).map(
        ({ id, name, count }) => ({
          _id: id,
          name,
          count,
        })
      );
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
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setPriceRange([minPrice, maxPrice]);

        // Set initial filters if not already set
        if (currentPriceRange[0] === 0 && currentPriceRange[1] === 0) {
          setCurrentPriceRange([minPrice, maxPrice]);
          setFilters((prev) => ({ ...prev, priceRange: [minPrice, maxPrice] }));
        }
      }
    },
    [currentPriceRange]
  );

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
    enabled: true,
    threshold: 0.1,
    rootMargin: "200px",
  });

  // Products are already sorted server-side, so just return them as-is
  const sortedProducts = products;

  // Handle filter changes
  const handleSecondaryCategoryChange = useCallback(
    (id: string, checked: boolean) => {
      setFilters((prev) => {
        const newSecondaryCategories = checked
          ? [...prev.secondaryCategories, id]
          : prev.secondaryCategories.filter((catId) => catId !== id);
        return { ...prev, secondaryCategories: newSecondaryCategories };
      });
      // Trigger refresh immediately after filter change
      setTimeout(() => refresh(), 0);
    },
    [setFilters, refresh]
  );

  const handleColorChange = useCallback(
    (color: string, checked: boolean) => {
      setFilters((prev) => {
        const newColors = checked
          ? [...prev.colors, color]
          : prev.colors.filter((c) => c !== color);
        return { ...prev, colors: newColors };
      });
      // Trigger refresh immediately after filter change
      setTimeout(() => refresh(), 0);
    },
    [setFilters, refresh]
  );

  // Debounce price range changes to avoid constant refreshing
  const debouncedPriceRange = useDebounce(currentPriceRange, 800);

  const handlePriceRangeChange = useCallback((value: number[]) => {
    const newRange = [value[0], value[1]] as [number, number];
    setCurrentPriceRange(newRange);
  }, []);

  // Apply debounced price range changes
  useEffect(() => {
    if (
      debouncedPriceRange[0] !== filters.priceRange[0] ||
      debouncedPriceRange[1] !== filters.priceRange[1]
    ) {
      const newFilters = { ...filters, priceRange: debouncedPriceRange };
      setFilters(newFilters);
      refresh();
    }
  }, [debouncedPriceRange, filters.priceRange, filters, refresh]);

  const handlePriceRangeSelection = useCallback(
    (rangeId: string, checked: boolean) => {
      setFilters((prev) => {
        const newPriceRanges = checked
          ? [...prev.priceRanges, rangeId]
          : prev.priceRanges.filter((id) => id !== rangeId);
        return { ...prev, priceRanges: newPriceRanges };
      });
      // Trigger refresh immediately after filter change
      setTimeout(() => refresh(), 0);
    },
    [setFilters, refresh]
  );

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      secondaryCategories: [],
      colors: [],
      priceRange: priceRange,
      priceRanges: [],
    });
    setCurrentPriceRange(priceRange);
    setSortBy("featured");
    // Trigger refresh immediately after clearing filters
    setTimeout(() => refresh(), 0);
  }, [priceRange, refresh]);

  // Handle wishlist toggle
  const handleToggleWishlist = useCallback(
    async (e: React.MouseEvent, product: IProductResponse) => {
      e.preventDefault();
      e.stopPropagation();

      if (!product._id) return;

      try {
        const isInWishlist = wishlistItems.some(
          (item) => item._id === product._id
        );

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
    if (metadataLoaded && isInitialized) {
      refresh();
    }
  }, [sortBy, refresh, metadataLoaded, isInitialized]);

  // Refresh when non-slider filters change
  useEffect(() => {
    if (metadataLoaded && isInitialized) {
      refresh();
    }
  }, [
    filters.secondaryCategories,
    filters.colors,
    filters.priceRanges,
    metadataLoaded,
    isInitialized,
    refresh,
  ]);

  return {
    // Data
    products: sortedProducts,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,

    // Sorting
    sortBy,
    setSortBy: handleSortChange,

    // Filtering
    filters,
    tempFilters,
    currentPriceRange,
    secondaryCategories,
    availableColors,
    priceRange,
    allCategoryProducts,

    // Actions
    handleToggleCart,
    handleToggleWishlist,
    handleSecondaryCategoryChange,
    handleColorChange,
    handlePriceRangeChange,
    handlePriceRangeSelection,
    clearFilters,
    refresh,

    // URL utilities
    generateShareableUrl: () => {
      const baseUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${pathname}`
          : "";
      return generateShareableUrl(filters, sortBy, baseUrl);
    },
    hasActiveFilters: () => hasActiveFilters(filters, sortBy),

    // Infinite scroll
    loadMoreRef,
  };
};
