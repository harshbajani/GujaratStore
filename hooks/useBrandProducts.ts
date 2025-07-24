"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { toast } from "@/hooks/use-toast";
import { getProductRating } from "@/lib/utils";

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

export const useBrandProducts = (brandId: string) => {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();

  const [products, setProducts] = useState<IProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    primaryCategories: [],
    secondaryCategories: [],
    colors: [],
    priceRange: [0, 0],
  });
  const [tempFilters, setTempFilters] = useState<FilterState>({ ...filters });
  const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([
    0, 0,
  ]);

  // Filter options
  const [secondaryCategories, setSecondaryCategories] = useState<Category[]>(
    []
  );
  const [availableColors, setAvailableColors] = useState<
    { color: string; count: number }[]
  >([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);

  // Filter products based on current filters
  const filteredProducts = products.filter((product) => {
    // Secondary category filter
    if (
      filters.secondaryCategories.length > 0 &&
      !filters.secondaryCategories.includes(product.secondaryCategory._id)
    ) {
      return false;
    }

    // Color filter
    if (
      filters.colors.length > 0 &&
      (!product.productColor ||
        !filters.colors.includes(product.productColor.toLowerCase()))
    ) {
      return false;
    }

    // Price range filter
    if (
      product.netPrice < filters.priceRange[0] ||
      product.netPrice > filters.priceRange[1]
    ) {
      return false;
    }

    return true;
  });

  // Apply sorting to filteredProducts
  function applySorting(products: IProductResponse[], sortMethod: string) {
    const sortedProducts = [...products];

    switch (sortMethod) {
      case "price-low-to-high":
        sortedProducts.sort((a, b) => a.netPrice - b.netPrice);
        break;
      case "price-high-to-low":
        sortedProducts.sort((a, b) => b.netPrice - a.netPrice);
        break;
      case "rating-high-to-low":
        sortedProducts.sort(
          (a, b) => getProductRating(b) - getProductRating(a)
        );
        break;
      case "rating-low-to-high":
        sortedProducts.sort(
          (a, b) => getProductRating(a) - getProductRating(b)
        );
        break;
      case "featured":
      default:
        // Keep the original order
        break;
    }

    return sortedProducts;
  }

  const sortedProducts = applySorting(filteredProducts, sortBy);

  // Toggle wishlist status
  const handleToggleWishlist = async (
    e: React.MouseEvent,
    product: IProductResponse
  ) => {
    if (!product._id) return;

    try {
      const isInWishlist = wishlistItems.some(
        (item) => item._id === product._id
      );

      if (isInWishlist) {
        await removeFromWishlist(product._id);
        setProducts((prev) =>
          prev.map((p) =>
            p._id === product._id ? { ...p, wishlist: false } : p
          )
        );
        toast({
          title: "Success",
          description: "Product removed from wishlist",
          className: "bg-green-500 text-white",
        });
      } else {
        await addToWishlist(product._id);
        setProducts((prev) =>
          prev.map((p) =>
            p._id === product._id ? { ...p, wishlist: true } : p
          )
        );
        toast({
          title: "Success",
          description: "Product added to wishlist",
          className: "bg-green-500 text-white",
        });
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    }
  };

  // Toggle cart status
  const handleToggleCart = async (
    e: React.MouseEvent,
    product: IProductResponse
  ) => {
    if (!product._id) return;

    try {
      const isInCart = cartItems.some((item) => item._id === product._id);

      if (isInCart) {
        await removeFromCart(product._id);
        setProducts((prev) =>
          prev.map((p) => (p._id === product._id ? { ...p, inCart: false } : p))
        );
        toast({
          title: "Success",
          description: "Product removed from cart",
          className: "bg-green-500 text-white",
        });
      } else {
        await addToCart(product._id);
        setProducts((prev) =>
          prev.map((p) => (p._id === product._id ? { ...p, inCart: true } : p))
        );
        toast({
          title: "Success",
          description: "Product added to cart",
          className: "bg-green-500 text-white",
        });
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      toast({
        title: "Error",
        description: "Failed to update cart",
        variant: "destructive",
      });
    }
  };

  // Handle filter changes
  const handleSecondaryCategoryChange = (id: string, checked: boolean) => {
    setTempFilters((prev) => ({
      ...prev,
      secondaryCategories: checked
        ? [...prev.secondaryCategories, id]
        : prev.secondaryCategories.filter((catId) => catId !== id),
    }));
    // Apply filters immediately (since we don't have a dialog in brand page)
    setFilters((prev) => ({
      ...prev,
      secondaryCategories: checked
        ? [...prev.secondaryCategories, id]
        : prev.secondaryCategories.filter((catId) => catId !== id),
    }));
  };

  const handleColorChange = (color: string, checked: boolean) => {
    setTempFilters((prev) => ({
      ...prev,
      colors: checked
        ? [...prev.colors, color]
        : prev.colors.filter((c) => c !== color),
    }));
    // Apply filters immediately
    setFilters((prev) => ({
      ...prev,
      colors: checked
        ? [...prev.colors, color]
        : prev.colors.filter((c) => c !== color),
    }));
  };

  const handlePriceRangeChange = (value: number[]) => {
    setCurrentPriceRange([value[0], value[1]] as [number, number]);
    setTempFilters((prev) => ({
      ...prev,
      priceRange: [value[0], value[1]] as [number, number],
    }));
    // Apply filters immediately
    setFilters((prev) => ({
      ...prev,
      priceRange: [value[0], value[1]] as [number, number],
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

  useEffect(() => {
    const fetchBrandProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/brand/${brandId}?all=true`);
        const data = await response.json();

        if (data.success) {
          let brandProducts = data.data;

          // Update cart and wishlist status for each product
          brandProducts = brandProducts.map((product: IProductResponse) => ({
            ...product,
            wishlist: wishlistItems.some((item) => item._id === product._id),
            inCart: cartItems.some((item) => item._id === product._id),
          }));

          setProducts(brandProducts);

          // Set brand name from first product
          if (brandProducts.length > 0) {
            setBrandName(brandProducts[0].brands.name);
          }

          // Extract secondary categories
          const secondaryCatMap = new Map<
            string,
            { id: string; name: string; count: number }
          >();
          brandProducts.forEach((product: IProductResponse) => {
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
          brandProducts.forEach((product: IProductResponse) => {
            if (product.productColor) {
              const color = product.productColor.toLowerCase();
              colorMap.set(color, (colorMap.get(color) || 0) + 1);
            }
          });

          const colors = Array.from(colorMap.entries()).map(
            ([color, count]) => ({
              color,
              count,
            })
          );
          setAvailableColors(colors);

          // Calculate price range
          const prices = brandProducts.map(
            (p: IProductResponse) => p.netPrice
          );
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange([minPrice, maxPrice]);
          setCurrentPriceRange([minPrice, maxPrice]);
          setFilters((prev) => ({
            ...prev,
            priceRange: [minPrice, maxPrice],
          }));
          setTempFilters((prev) => ({
            ...prev,
            priceRange: [minPrice, maxPrice],
          }));
        } else {
          setError("Failed to fetch brand products");
        }
      } catch (err) {
        setError("Error fetching brand products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandProducts();
  }, [brandId, cartItems, wishlistItems]);

  return {
    loading,
    error,
    sortedProducts,
    brandName,
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
