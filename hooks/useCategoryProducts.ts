"use client";

import { useCallback, useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getProductRating } from "@/lib/utils";
import useSWR from "swr";

interface Category {
  _id: string;
  name: string;
  count: number;
}

interface FilterState {
  primaryCategories: string[];
  secondaryCategories: string[];
  colors: string[];
  priceRange: [number, number];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useCategoryProducts = (categoryName: string) => {
  const { cartItems = [], addToCart, removeFromCart } = useCart();
  const {
    wishlistItems = [],
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();

  // Local state
  const [products, setProducts] = useState<IProductResponse[]>([]);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [filters, setFilters] = useState<FilterState>({
    primaryCategories: [],
    secondaryCategories: [],
    colors: [],
    priceRange: [0, 0],
  });
  const [tempFilters, setTempFilters] = useState<FilterState>({
    primaryCategories: [],
    secondaryCategories: [],
    colors: [],
    priceRange: [0, 0],
  });
  const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([
    0, 0,
  ]);
  const [secondaryCategories, setSecondaryCategories] = useState<Category[]>(
    []
  );
  const [availableColors, setAvailableColors] = useState<
    { color: string; count: number }[]
  >([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Process product data to extract categories, colors, and price range
  const processProductData = useCallback(
    (products: IProductResponse[]) => {
      // Extract secondary categories
      const secondaryCatMap = new Map<
        string,
        { id: string; name: string; count: number }
      >();
      products.forEach((product: IProductResponse) => {
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
      products.forEach((product: IProductResponse) => {
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
      const prices = products.map((p: IProductResponse) => p.netPrice);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      setPriceRange([minPrice, maxPrice]);

      // Only set initial price range if not initialized
      if (!isInitialized) {
        setCurrentPriceRange([minPrice, maxPrice]);
        setFilters((prev) => ({
          ...prev,
          priceRange: [minPrice, maxPrice],
        }));
        setTempFilters((prev) => ({
          ...prev,
          priceRange: [minPrice, maxPrice],
        }));
        setIsInitialized(true);
      }
    },
    [setSecondaryCategories, setAvailableColors, setPriceRange, isInitialized]
  );

  // Use SWR for data fetching with a stable key
  const { error, isLoading, mutate } = useSWR(
    `products-${categoryName}`,
    () => fetcher("/api/products?all=true"),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 0, // Remove the deduping interval to allow immediate revalidation
      onSuccess: (data) => {
        if (data?.success) {
          let filteredProducts = data.data.filter(
            (product: IProductResponse) =>
              product.parentCategory?.name?.toLowerCase() ===
              categoryName.toLowerCase()
          );

          // Update cart and wishlist status
          filteredProducts = filteredProducts.map(
            (product: IProductResponse) => ({
              ...product,
              wishlist: wishlistItems.some((item) => item._id === product._id),
              inCart: cartItems.some((item) => item._id === product._id),
            })
          );

          setProducts(filteredProducts);
          processProductData(filteredProducts);
        }
      },
      keepPreviousData: true,
    }
  );

  // Force revalidate when category changes
  useEffect(() => {
    setIsInitialized(false);
    mutate(); // Force revalidate when category changes
  }, [categoryName, mutate]);

  // Handle filter changes
  const handleSecondaryCategoryChange = (id: string, checked: boolean) => {
    const newSecondaryCategories = checked
      ? [...filters.secondaryCategories, id]
      : filters.secondaryCategories.filter((catId) => catId !== id);

    setFilters((prev) => ({
      ...prev,
      secondaryCategories: newSecondaryCategories,
    }));
    setTempFilters((prev) => ({
      ...prev,
      secondaryCategories: newSecondaryCategories,
    }));
  };

  const handleColorChange = (color: string, checked: boolean) => {
    const newColors = checked
      ? [...filters.colors, color]
      : filters.colors.filter((c) => c !== color);

    setFilters((prev) => ({
      ...prev,
      colors: newColors,
    }));
    setTempFilters((prev) => ({
      ...prev,
      colors: newColors,
    }));
  };

  const handlePriceRangeChange = (value: number[]) => {
    const newRange = [value[0], value[1]] as [number, number];
    setCurrentPriceRange(newRange);
    setFilters((prev) => ({
      ...prev,
      priceRange: newRange,
    }));
    setTempFilters((prev) => ({
      ...prev,
      priceRange: newRange,
    }));
  };

  const clearFilters = () => {
    const resetFilters = {
      primaryCategories: [],
      secondaryCategories: [],
      colors: [],
      priceRange: priceRange,
    };
    setFilters(resetFilters);
    setTempFilters(resetFilters);
    setCurrentPriceRange(priceRange);
  };

  // Handle cart/wishlist updates
  const handleToggleWishlist = async (
    e: React.MouseEvent,
    product: IProductResponse
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product._id) return;

    try {
      const isInWishlist = wishlistItems.some(
        (item) => item._id === product._id
      );

      // Optimistically update UI
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, wishlist: !isInWishlist } : p
        )
      );

      if (isInWishlist) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product._id);
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      // Revert optimistic update
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id
            ? {
                ...p,
                wishlist: wishlistItems.some(
                  (item) => item._id === product._id
                ),
              }
            : p
        )
      );
    }
  };

  const handleToggleCart = async (
    e: React.MouseEvent,
    product: IProductResponse
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product._id) return;

    try {
      const isInCart = cartItems.some((item) => item._id === product._id);

      // Optimistically update UI
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, inCart: !isInCart } : p
        )
      );

      if (isInCart) {
        await removeFromCart(product._id);
      } else {
        await addToCart(product._id);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      // Revert optimistic update
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id
            ? {
                ...p,
                inCart: cartItems.some((item) => item._id === product._id),
              }
            : p
        )
      );
    }
  };

  // Apply filters and sort
  const filteredProducts = products.filter((product) => {
    if (
      filters.secondaryCategories.length > 0 &&
      !filters.secondaryCategories.includes(
        product.secondaryCategory?._id || ""
      )
    ) {
      return false;
    }

    if (
      filters.colors.length > 0 &&
      !filters.colors.includes(product.productColor?.toLowerCase() || "")
    ) {
      return false;
    }

    if (
      product.netPrice < filters.priceRange[0] ||
      product.netPrice > filters.priceRange[1]
    ) {
      return false;
    }

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
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

  return {
    loading: isLoading,
    error,
    sortedProducts,
    sortBy,
    setSortBy,
    tempFilters,
    currentPriceRange,
    secondaryCategories,
    availableColors,
    priceRange,
    handleToggleCart,
    handleToggleWishlist,
    handleSecondaryCategoryChange,
    handleColorChange,
    handlePriceRangeChange,
    clearFilters,
  };
};
