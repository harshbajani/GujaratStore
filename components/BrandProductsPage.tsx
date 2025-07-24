"use client";

import { Button } from "@/components/ui/button";
import { cn, getProductRating } from "@/lib/utils";
import { Check, Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import Link from "next/link";
import { useBrandProducts } from "@/hooks/useBrandProducts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DualThumbSlider } from "@/components/ui/dual-slider";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/Loader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BreadcrumbHeader from "@/components/BreadcrumbHeader";

interface BrandProductsPageProps {
  brandId: string;
}

const BrandProductsPage = ({ brandId }: BrandProductsPageProps) => {
  const {
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
  } = useBrandProducts(brandId);

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
  const getImageUrl = (imageId: string) => `/api/files/${imageId}`;

  if (loading) {
    return <Loader />;
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
      <BreadcrumbHeader 
        title="Home" 
        subtitle={brandName ? `${brandName} Products` : "Brand Products"} 
        titleHref="/" 
      />

      <div className="container mx-auto px-4 flex flex-col md:flex-row">
        {/* Filter Sidebar */}
        <div className="w-full hidden md:block md:w-64 md:mr-8 py-[78px]">
          <div className="sticky top-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>

              {/* Secondary Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Categories</h3>
                <div className="space-y-3">
                  {secondaryCategories.map((category) => (
                    <div
                      key={category._id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={category._id}
                        checked={tempFilters.secondaryCategories.includes(
                          category._id
                        )}
                        onCheckedChange={(checked) =>
                          handleSecondaryCategoryChange(
                            category._id,
                            checked as boolean
                          )
                        }
                      />
                      <label
                        htmlFor={category._id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category.name} ({category.count})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Colors */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Colors</h3>
                <div className="space-y-3">
                  {availableColors.map(({ color, count }) => (
                    <div key={color} className="flex items-center space-x-2">
                      <Checkbox
                        id={color}
                        checked={tempFilters.colors.includes(color)}
                        onCheckedChange={(checked) =>
                          handleColorChange(color, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={color}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {color} ({count})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Price Range</h3>
                <div className="space-y-4">
                  <DualThumbSlider
                    min={priceRange[0]}
                    max={priceRange[1]}
                    step={1}
                    value={[currentPriceRange[0], currentPriceRange[1]]}
                    onValueChange={handlePriceRangeChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm">
                    <span>₹{currentPriceRange[0]}</span>
                    <span>₹{currentPriceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          {/* Sort */}
          <div className="mb-8 flex justify-end mt-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
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
                  No products found for this brand.
                </p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear all filters
                </Button>
              </div>
            ) : (
              sortedProducts.map((product) => (
                <motion.div
                  variants={containerVariants}
                  className="flex flex-col items-center justify-between rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  key={product.slug}
                >
                  {/* Image Container */}
                  <div className="mb-4 h-48 w-full overflow-hidden rounded-lg">
                    <Link
                      prefetch
                      href={`/${product.parentCategory?.name}/${product.slug}`}
                    >
                      <Image
                        src={getImageUrl(product.productCoverImage.toString())}
                        alt={product.productName}
                        width={250}
                        height={250}
                        className="h-full w-full object-cover object-top transition-transform duration-300 hover:scale-105"
                      />
                    </Link>
                  </div>

                  {/* Product Info */}
                  <Link
                    prefetch
                    href={`/${product.parentCategory?.name}/${product.slug}`}
                  >
                    <div className="flex w-full flex-1 flex-col items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex flex-col gap-1">
                            <h2 className=" text-center text-sm font-semibold text-brand h-5 overflow-hidden">
                              {product.productName}
                            </h2>
                            <p className="mb-2 text-sm text-muted-foreground">
                              {product.brands.name}
                            </p>
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

                  {/* Buttons Container - moved outside Link and added proper event handling */}
                  <div className="flex w-full items-center justify-center gap-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex flex-1"
                    >
                      <Button
                        variant="secondary"
                        className="shadow-md flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleCart(e, product);
                        }}
                        type="button" // Explicitly set button type
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleWishlist(e, product);
                        }}
                        type="button" // Explicitly set button type
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

export default BrandProductsPage;
