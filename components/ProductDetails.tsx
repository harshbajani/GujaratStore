/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import ProductGallery from "@/components/ProductGallery";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Heart, ShoppingCart } from "lucide-react";
import QuantitySelector from "@/components/ui/quantity-selector";
import Loader from "@/components/Loader";
import ReviewSection from "@/components/Review";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import Link from "next/link";
import { toast } from "sonner";
import ProductSizeSelector from "@/components/ProductSizeSelector";
import { useRouter } from "next/navigation";

const ProductsDetailPage = () => {
  const params = useParams();
  const productSlug = params.slug;
  const [product, setProduct] = useState<IProductResponse | null>(null);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
  });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSizeData, setSelectedSizeData] = useState<
    IProductSizePriceWithDetails | any | null
  >(null);
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();
  const router = useRouter();

  // Fetch product data and check cart/wishlist status
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchProductAndUserData = async () => {
      try {
        // Always fetch product data - use admin endpoint for public access
        const productResp = await fetch(
          `/api/admin/products/slug/${productSlug}`,
          {
            signal: controller.signal,
          }
        );
        const productData = await productResp.json();

        if (!isMounted) return;

        if (!productData.success) {
          setError("Failed to fetch product");
          return;
        }

        let productWithStatus = productData.data;

        // Update product status based on cart and wishlist items
        productWithStatus = {
          ...productWithStatus,
          wishlist: wishlistItems.some(
            (item) => item._id === productWithStatus._id
          ),
          inCart: cartItems.some((item) => item._id === productWithStatus._id),
        };

        setProduct(productWithStatus);
        // Auto-select size if there's only one size available
        if (
          productWithStatus.productSize &&
          productWithStatus.productSize.length === 1
        ) {
          setSelectedSizeData(productWithStatus.productSize[0]);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === "AbortError") return;

        console.error(err);
        setError("Error fetching product");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (productSlug) {
      fetchProductAndUserData();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [productSlug, cartItems, wishlistItems]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleToggleCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!product?._id) return;

      try {
        const isInCart = cartItems.some((item) => item._id === product._id);

        if (isInCart) {
          await removeFromCart(product._id);
          setProduct((prev) => (prev ? { ...prev, inCart: false } : null));
          toast.success("Success", {
            description: "Product removed from cart",
            duration: 5000,
          });
        } else {
          // Prepare size data if size is selected
          let sizeForCart = undefined;
          if (selectedSizeData) {
            // For unpopulated sizes, create a fallback label
            const sizeLabel =
              selectedSizeData.sizeId?.label ||
              selectedSizeData.size?.label ||
              `Size ${selectedSizeData.netPrice} INR`;

            sizeForCart = {
              sizeId:
                selectedSizeData.sizeId?._id ||
                selectedSizeData.sizeId ||
                selectedSizeData._id,
              label: sizeLabel,
              mrp: selectedSizeData.mrp,
              netPrice: selectedSizeData.netPrice,
              discountValue: selectedSizeData.discountValue,
              quantity: selectedSizeData.quantity,
            };
          }

          await addToCart(product._id, sizeForCart);
          setProduct((prev) => (prev ? { ...prev, inCart: true } : null));
          toast.success("Success", {
            description: "Product added to cart",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error updating cart:", error);
        toast.error("Oops!", {
          description: "Failed to update cart",
          duration: 5000,
        });
      }
    },
    [product?._id, cartItems, removeFromCart, addToCart, selectedSizeData]
  );

  const handleToggleWishlist = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!product?._id) return;

      try {
        const isInWishlist = wishlistItems.some(
          (item) => item._id === product._id
        );

        if (isInWishlist) {
          await removeFromWishlist(product._id);
          setProduct((prev) => (prev ? { ...prev, wishlist: false } : null));
          toast.success("Success", {
            description: "Product removed from wishlist",
            duration: 5000,
          });
        } else {
          await addToWishlist(product._id);
          setProduct((prev) => (prev ? { ...prev, wishlist: true } : null));
          toast.success("Success", {
            description: "Product added to wishlist",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error updating wishlist:", error);
        toast.error("Oops!", {
          description: "Failed to update wishlist",
          duration: 5000,
        });
      }
    },
    [product?._id, wishlistItems, removeFromWishlist, addToWishlist]
  );

  // Memoize delivery date calculation
  const formattedDeliveryDate = useMemo(() => {
    if (!product) return "Not available";

    const currentDate = new Date();
    const deliveryDate = new Date(
      currentDate.getTime() + product.deliveryDays * 24 * 60 * 60 * 1000
    );
    return deliveryDate
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "/");
  }, [product?.deliveryDays]);

  // Buy Now handler
  const handleBuyNow = useCallback(async () => {
    if (!product?._id) return;

    // Check if size is required but not selected (only for products with valid size objects)
    if (
      product.productSize &&
      product.productSize.length > 0 &&
      !product.productSize.every((size) => typeof size === "string") &&
      !selectedSizeData
    ) {
      toast.error("Please select a size", {
        description: "Size selection is required for this product",
        duration: 5000,
      });
      return;
    }

    try {
      // Create checkout data for Buy Now
      let checkoutItem: CheckoutItem;

      if (selectedSizeData) {
        // Use selected size pricing
        checkoutItem = {
          productId: product._id,
          productName: product.productName,
          selectedSize: {
            sizeId:
              selectedSizeData.sizeId?._id ||
              selectedSizeData.sizeId ||
              selectedSizeData._id,
            label:
              selectedSizeData.sizeId?.label ||
              selectedSizeData.size?.label ||
              `Size ${selectedSizeData.netPrice} INR`,
            mrp: selectedSizeData.mrp,
            netPrice: selectedSizeData.netPrice,
            discountValue: selectedSizeData.discountValue,
          },
          quantity: quantity,
          price: selectedSizeData.netPrice,
          coverImage: product.productCoverImage as string,
          deliveryDate: formattedDeliveryDate,
          vendorId: product.vendorId,
        };
      } else {
        // Use default product pricing
        checkoutItem = {
          productId: product._id,
          productName: product.productName,
          quantity: quantity,
          price: product.netPrice || product.landingPrice || 0,
          coverImage: product.productCoverImage as string,
          deliveryDate: formattedDeliveryDate,
          vendorId: product.vendorId,
        };
      }

      const subtotal = checkoutItem.price * checkoutItem.quantity;
      const deliveryCharges =
        selectedSizeData?.deliveryCharges || product.deliveryCharges || 0;
      const total = subtotal + deliveryCharges;

      const checkoutData: CheckoutData = {
        items: [checkoutItem],
        subtotal,
        deliveryCharges,
        total,
        discountAmount: 0,
        discountCode: "",
      };

      // Store in sessionStorage and redirect to checkout
      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
      router.push("/checkout");
    } catch (error) {
      console.error("Error during Buy Now:", error);
      toast.error("Oops!", {
        description: "Failed to proceed to checkout",
        duration: 5000,
      });
    }
  }, [product, selectedSizeData, quantity, formattedDeliveryDate, router]);

  if (loading) {
    return <Loader />;
  }
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error || "Product not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Hero Section */}
      <motion.div
        className="relative h-[273px] w-full"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-[url('/bg/bg1.png')] bg-cover bg-center sm:bg-contain md:bg-[top_50%_right_200px] h-[273px]" />
        <div className="absolute inset-0 bg-brand-200/30 h-[273px]" />
        <motion.div
          className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <motion.h1
            className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl mt-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            નમસ્તે જી
          </motion.h1>
          <motion.p
            className="text-sm sm:text-base md:text-lg mb-5"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            Let&apos;s Discover The World Of Gujarat Art & Crafts
          </motion.p>
          <div className="flex items-center justify-center">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href={`/category/${
                      product.parentCategory.slug || product.parentCategory.slug
                    }`}
                  >
                    {product.parentCategory.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href={`/product-category/${
                      product.primaryCategory.slug ||
                      product.primaryCategory.slug
                    }`}
                  >
                    {product.primaryCategory.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate max-w-[150px] sm:max-w-xs overflow-hidden whitespace-nowrap">
                    {product.productName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </motion.div>
      </motion.div>

      {/* Product Details Section */}
      <div className="dynamic-container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Gallery */}
          <div className="w-full">
            <ProductGallery images={product.productImages} />
            {/* TODO: add review functionality here */}
            <div className="hidden sm:block">
              <ReviewSection
                productId={product._id}
                initialRating={product.productRating || 0}
                onStatsLoaded={setReviewStats}
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold mb-0">{product.productName}</h1>
            <Link href={`/brand/${product.brands._id}`}>
              <p className="text-gray-500 hover:text-brand transition-colors cursor-pointer hover:underline duration-200">
                By - {product.brands.name}
              </p>
            </Link>
            <h2 className="text-lg text-gray-500">
              {product.parentCategory.name}, {product.primaryCategory.name},{" "}
              {product.secondaryCategory.name}
            </h2>
            <div className="flex items-center gap-2 mt-2 mb-3">
              <span className="bg-green-600 text-white px-2 py-0.5 rounded font-medium">
                {(
                  reviewStats.averageRating ||
                  product.productRating ||
                  0
                ).toFixed(1)}
                ★
              </span>
              <span className="text-gray-700">
                {reviewStats.totalReviews.toLocaleString()} Ratings & Reviews
              </span>
            </div>
            <div className="mb-4 flex items-center gap-4">
              {selectedSizeData ? (
                // Show selected size pricing
                <>
                  <span className="text-xl font-bold text-gray-900">
                    ₹
                    {selectedSizeData.netPrice &&
                    !isNaN(selectedSizeData.netPrice)
                      ? Math.floor(selectedSizeData.netPrice).toLocaleString(
                          "en-IN"
                        )
                      : "0"}
                  </span>
                  {selectedSizeData.mrp &&
                    selectedSizeData.netPrice &&
                    selectedSizeData.mrp > selectedSizeData.netPrice && (
                      <span className="text-md text-gray-500 line-through">
                        ₹
                        {Math.floor(selectedSizeData.mrp).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    )}
                  <p className="text-brand">
                    {selectedSizeData.discountValue || 0}
                    {selectedSizeData.discountType === "percentage" ? (
                      <span>% off</span>
                    ) : (
                      <span>rs off</span>
                    )}
                  </p>
                </>
              ) : (
                // Show default product pricing
                <>
                  <span className="text-xl font-bold text-gray-900">
                    ₹
                    {(() => {
                      // Try different price fields as fallbacks
                      const price =
                        product.netPrice || product.landingPrice || 0;
                      return price && !isNaN(price)
                        ? Math.floor(price).toLocaleString("en-IN")
                        : "0";
                    })()}
                  </span>
                  {(() => {
                    const price = product.netPrice || product.landingPrice || 0;
                    return (
                      product.mrp &&
                      price &&
                      product.mrp > price && (
                        <span className="text-md text-gray-500 line-through">
                          ₹{Math.floor(product.mrp).toLocaleString("en-IN")}
                        </span>
                      )
                    );
                  })()}
                  <p className="text-brand">
                    {product.discountValue || 0}
                    {product.discountType === "percentage" ? (
                      <span>% off</span>
                    ) : (
                      <span>rs off</span>
                    )}
                  </p>
                </>
              )}
              <p className="text-xs text-green-500">inclusive of all taxes*</p>
            </div>
            <div className="mb-6">
              {/* Size Selector - Show ProductSizeSelector if product has valid sizes */}
              {product.productSize &&
                product.productSize.length > 0 &&
                !product.productSize.every(
                  (size) => typeof size === "string"
                ) && (
                  <div className="mb-6">
                    {/* Error boundary for size selector */}
                    {(() => {
                      try {
                        const sizeSelector = (
                          <ProductSizeSelector
                            productSizes={product.productSize}
                            selectedSizeId={
                              selectedSizeData?.sizeId?._id ||
                              selectedSizeData?.sizeId
                            }
                            onSizeSelect={(sizePrice) => {
                              setSelectedSizeData(sizePrice);
                            }}
                            className="mb-4"
                          />
                        );
                        // If component returns null (for string arrays), don't render the wrapper
                        return sizeSelector;
                      } catch (error) {
                        console.error(
                          "Error rendering ProductSizeSelector:",
                          error
                        );
                        return (
                          <div className="mb-4 p-4 border border-red-200 rounded-md bg-red-50">
                            <p className="text-red-600 text-sm">
                              Error loading size options. Product sizes may not
                              be properly configured.
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base md:text-lg">
                  Quantity:
                </h1>
                <QuantitySelector
                  quantity={quantity}
                  setQuantity={setQuantity}
                  max={selectedSizeData?.quantity || product.productQuantity}
                />
              </div>
            </div>
            <div className="flex gap-4 mb-4">
              <Button
                variant="secondary"
                className="shadow-md flex items-center gap-2 flex-1"
                onClick={handleToggleCart}
                disabled={
                  product.productSize &&
                  product.productSize.length > 0 &&
                  !product.productSize.every(
                    (size) => typeof size === "string"
                  ) &&
                  !selectedSizeData
                }
              >
                <div
                  className={cn(
                    "p-2 rounded -ml-3 transition-all duration-300"
                  )}
                >
                  {product?.inCart ? (
                    <Check className="size-5 text-green-500" />
                  ) : (
                    <ShoppingCart className="size-5 " />
                  )}
                </div>
                {product?.inCart ? "Remove from Cart" : "Add to Cart"}
              </Button>

              <Button
                className="primary-btn flex-1"
                onClick={handleBuyNow}
                disabled={
                  product.productSize &&
                  product.productSize.length > 0 &&
                  !product.productSize.every(
                    (size) => typeof size === "string"
                  ) &&
                  !selectedSizeData
                }
              >
                Buy Now
              </Button>

              <Button
                variant="secondary"
                className="aspect-square p-2 shadow-sm hover:shadow-md"
                onClick={handleToggleWishlist}
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    product?.wishlist ? "fill-red-500" : "text-red-600"
                  )}
                />
              </Button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Expected Delivery By: {formattedDeliveryDate}
            </p>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold mb-4">
                Product Details
              </h1>

              <div className="border-b">
                <Accordion type="single" collapsible>
                  <AccordionItem value="productDescription">
                    <AccordionTrigger>
                      <h1 className="text-base sm:text-xl font-bold ">
                        Attributes
                      </h1>
                    </AccordionTrigger>
                    <AccordionContent>
                      {product.attributes.map((attr) => (
                        <p key={attr._id} className="mb-2">
                          <span className="font-semibold">
                            {attr.attributeId?.name}:{" "}
                          </span>
                          {attr.value}
                        </p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              <div>
                <Accordion type="single" collapsible>
                  <AccordionItem value="productDescription">
                    <AccordionTrigger>
                      <h1 className="text-base sm:text-xl font-bold ">
                        Product Description
                      </h1>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: product.productDescription,
                        }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Accordion type="single" collapsible>
                  <AccordionItem value="productWarranty">
                    <AccordionTrigger>
                      <h1 className="text-base sm:text-xl font-bold ">
                        Product Warranty
                      </h1>
                    </AccordionTrigger>
                    <AccordionContent>
                      {product.productWarranty || "No warranty available"}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Accordion type="single" collapsible>
                  <AccordionItem value="productWarranty">
                    <AccordionTrigger>
                      <h1 className="text-base sm:text-xl font-bold ">
                        Product Return Policy
                      </h1>
                    </AccordionTrigger>
                    <AccordionContent>
                      {product.productReturnPolicy || "No warranty available"}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
            <div className="block sm:hidden">
              <ReviewSection
                productId={product._id}
                initialRating={product.productRating || 0}
                onStatsLoaded={setReviewStats}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsDetailPage;
