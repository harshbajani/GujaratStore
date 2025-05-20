/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn, getProductRating } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Filter, Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import Loader from "@/components/Loader";
import { toast } from "@/hooks/use-toast";
import useProductFilter from "@/hooks/useProductFilter";

import BreadcrumbHeader from "@/components/BreadcrumbHeader";
import ProductFilterSidebar from "@/components/ProductFilterSidebar";
import { useCart } from "@/context/CartContext";

const ArtisanPage = () => {
  const [products, setProducts] = useState<IProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("featured");
  const { cartItems, addToCart, removeFromCart } = useCart();

  // State for filter metadata
  const [primaryCategories, setPrimaryCategories] = useState<
    { _id: string; name: string; count: number }[]
  >([]);
  const [secondaryCategories, setSecondaryCategories] = useState<
    { _id: string; name: string; count: number }[]
  >([]);
  const [availableColors, setAvailableColors] = useState<
    { color: string; count: number }[]
  >([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Use the product filter hook
  const { filters, filteredProducts, updateFilter, clearFilters } =
    useProductFilter(products);

  // Animation ref
  const [organicRef, organicInView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  // Helper function to construct image URL from GridFS ID
  const getImageUrl = (imageId: string | File) => `/api/files/${imageId}`;

  // Toggle wishlist status.
  const handleToggleWishlist = async (product: IProductResponse) => {
    try {
      let response;
      if (product.wishlist) {
        response = await fetch("/api/user/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id }),
        });
      } else {
        response = await fetch("/api/user/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id }),
        });
      }
      const data = await response.json();
      console.log("Wishlist response:", data);
      if (!data.success && data.message === "Not authenticated") {
        toast({
          title: "Error",
          description: "Please log in to add to wishlist!",
          variant: "destructive",
        });
        return;
      }
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, wishlist: !p.wishlist } : p
        )
      );
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    }
  };

  const handleToggleCart = async (product: IProductResponse) => {
    if (cartItems.some((ci) => ci._id === product._id)) {
      await removeFromCart(product._id!);
    } else {
      await addToCart(product._id!);
    }
  };

  // Now applySorting can use getProductRating since it's defined above
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

  // Apply sorting to filteredProducts
  const sortedProducts = applySorting(filteredProducts, sortBy).map((p) => ({
    ...p,
    inCart: cartItems.some((ci) => ci._id === p._id),
  }));

  useEffect(() => {
    const fetchProductsAndUser = async () => {
      try {
        // Fetch products
        const prodResponse = await fetch("/api/products?all=true");
        const prodData = await prodResponse.json();

        if (prodData.success) {
          // Filter clothing products
          let clothingProducts = prodData.data.filter(
            (product: IProductResponse) =>
              product.parentCategory?.name?.toLowerCase() === "artisans"
          );

          // Fetch current user data
          const userResponse = await fetch("/api/user/current");
          const userData = await userResponse.json();

          if (userData.success && userData.data) {
            const wishlistIds: string[] = userData.data.wishlist || [];
            const cartIds: string[] = userData.data.cart || [];

            clothingProducts = clothingProducts.map(
              (product: IProductResponse) => ({
                ...product,
                wishlist: wishlistIds.includes(product._id!),
                inCart: cartIds.includes(product._id!),
              })
            );
          }

          // Set products
          setProducts(clothingProducts);

          // Prepare primary categories
          const primaryCatMap = new Map<
            string,
            { id: string; name: string; count: number }
          >();
          clothingProducts.forEach((product: IProductResponse) => {
            if (product.primaryCategory) {
              const id = product.primaryCategory._id;
              if (primaryCatMap.has(id)) {
                const cat = primaryCatMap.get(id)!;
                cat.count += 1;
                primaryCatMap.set(id, cat);
              } else {
                primaryCatMap.set(id, {
                  id,
                  name: product.primaryCategory.name,
                  count: 1,
                });
              }
            }
          });

          const primaryCats = Array.from(primaryCatMap.values()).map(
            ({ id, name, count }) => ({
              _id: id,
              name,
              count,
            })
          );
          setPrimaryCategories(primaryCats);

          // Prepare secondary categories (similar to primary categories)
          const secondaryCatMap = new Map<
            string,
            { id: string; name: string; count: number }
          >();
          clothingProducts.forEach((product: IProductResponse) => {
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

          // Prepare colors
          const colorMap = new Map<string, number>();
          clothingProducts.forEach((product: IProductResponse) => {
            if (product.productColor) {
              const color = product.productColor.toLowerCase();
              colorMap.set(color, (colorMap.get(color) || 0) + 1);
            }
          });

          const colors = Array.from(colorMap.entries()).map(
            ([color, count]) => ({ color, count })
          );
          setAvailableColors(colors);

          // Set price range
          const prices = clothingProducts.map(
            (p: IProductResponse) => p.netPrice
          );
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange([minPrice, maxPrice]);
        } else {
          setError("Failed to fetch products");
        }
      } catch (err) {
        setError("Error fetching products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbHeader title="Home" subtitle="Artisan's" titleHref="/" />

      <div className="container mx-auto px-4 flex flex-col md:flex-row">
        {/* Filter Sidebar for MD and larger screens */}
        <div className="w-full hidden md:block md:w-64 md:mr-8 py-[78px]">
          <ProductFilterSidebar
            filters={filters}
            categories={{
              primary: primaryCategories,
              secondary: secondaryCategories,
            }}
            colors={availableColors}
            priceRange={priceRange}
            onFilterChange={(type, value, checked) =>
              updateFilter(type as any, value, checked)
            }
          />
        </div>

        <div className="flex-1">
          {/* Mobile Filter Button */}
          <div className="md:hidden flex justify-between items-center mb-4 py-6">
            <Sheet
              open={isMobileFilterOpen}
              onOpenChange={setIsMobileFilterOpen}
            >
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 max-w-md">
                <SheetHeader>
                  <SheetTitle>Filter Products</SheetTitle>
                </SheetHeader>
                <ProductFilterSidebar
                  filters={filters}
                  categories={{
                    primary: primaryCategories,
                    secondary: secondaryCategories,
                  }}
                  colors={availableColors}
                  priceRange={priceRange}
                  onFilterChange={(type, value, checked) => {
                    updateFilter(type as any, value, checked);
                  }}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low-to-high">
                    Price: Low to High
                  </SelectItem>
                  <SelectItem value="price-high-to-low">
                    Price: High to Low
                  </SelectItem>
                  <SelectItem value="rating-high-to-low">
                    Rating: High to Low
                  </SelectItem>
                  <SelectItem value="rating-low-to-high">
                    Rating: Low to High
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Sorting */}
          <div className="hidden md:flex justify-between items-center mb-4 my-6">
            <span className="text-sm text-gray-500">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "product" : "products"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low-to-high">
                    Price: Low to High
                  </SelectItem>
                  <SelectItem value="price-high-to-low">
                    Price: High to Low
                  </SelectItem>
                  <SelectItem value="rating-high-to-low">
                    Rating: High to Low
                  </SelectItem>
                  <SelectItem value="rating-low-to-high">
                    Rating: Low to High
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          <motion.div
            ref={organicRef}
            variants={containerVariants}
            initial="hidden"
            animate={organicInView ? "visible" : "hidden"}
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-8"
          >
            {sortedProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-gray-500">
                  No products match your filters.
                </p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear all filters
                </Button>
              </div>
            ) : (
              sortedProducts.map((product) => (
                // Product card remains the same as in the previous implementation
                <motion.div
                  variants={containerVariants}
                  className="flex flex-col items-center justify-between rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  key={product._id}
                >
                  {/* Image Container */}
                  <div className="mb-4 h-48 w-full overflow-hidden rounded-lg">
                    <Link href={`/clothing/${product._id}`}>
                      <Image
                        src={getImageUrl(product.productCoverImage)}
                        alt={product.productName}
                        width={250}
                        height={250}
                        className="h-full w-full object-cover object-top transition-transform duration-300 hover:scale-105"
                      />
                    </Link>
                  </div>

                  {/* Product Info */}
                  <Link href={`/clothing/${product._id}`}>
                    <div className="flex w-full flex-1 flex-col items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <h3 className="mb-2 text-center text-sm font-semibold text-brand h-5 overflow-hidden">
                              {product.productName}
                            </h3>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-wrap">
                            {product.productName}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          ₹
                          {Math.floor(product.netPrice).toLocaleString("en-IN")}
                        </span>
                        {product.mrp > product.netPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{Math.floor(product.mrp).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mb-2">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const rating = getProductRating(product);
                          return (
                            <Star
                              key={index}
                              className={cn(
                                "h-4 w-4",
                                rating > index
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              )}
                            />
                          );
                        })}
                        <span className="ml-1 text-xs text-gray-500">
                          {getProductRating(product) > 0
                            ? `${getProductRating(product)}/5`
                            : "No rating"}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Buttons Container */}
                  <div className="flex w-full items-center justify-center gap-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex flex-1"
                    >
                      <Button
                        variant="secondary"
                        className="shadow-md flex items-center gap-2"
                        onClick={() => handleToggleCart(product)}
                      >
                        <div
                          className={cn(
                            product.inCart ? "bg-secondary/90" : "bg-brand",
                            "p-2 rounded -ml-3 transition-all duration-300"
                          )}
                        >
                          {product.inCart ? (
                            <Check className="size-5 text-green-500" />
                          ) : (
                            <ShoppingCart className="size-5 text-white" />
                          )}
                        </div>
                        {product.inCart ? "Remove from Cart" : "Add to Cart"}
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="secondary"
                        className="aspect-square p-2 shadow-sm hover:shadow-md"
                        onClick={() => handleToggleWishlist(product)}
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5",
                            product.wishlist ? "fill-red-500" : "text-red-600"
                          )}
                        />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ArtisanPage;
