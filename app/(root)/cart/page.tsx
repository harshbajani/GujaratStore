"use client";

import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { CheckoutData, IProductResponse } from "@/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QuantitySelector from "@/components/ui/quantity-selector";
import Loader from "@/components/Loader";
import { removeFromCart } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";

interface CartItem extends IProductResponse {
  cartQuantity: number; // Renamed from quantity to cartQuantity to avoid confusion
}

const CartPage = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate cart totals including delivery charges
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.netPrice * item.cartQuantity,
    0
  );

  const deliveryCharges = cartItems.reduce(
    (sum, item) => sum + (item.deliveryCharges || 0),
    0
  );

  const total = subtotal + deliveryCharges;

  const updateQuantity = async (productId: string, newQuantity: number) => {
    try {
      if (newQuantity < 1) return;

      // Find the current item
      const currentItem = cartItems.find((item) => item._id === productId);
      if (!currentItem) return;

      // Check if requested quantity is available in inventory
      if (newQuantity > currentItem.productQuantity) {
        toast({
          title: "Error",
          description: `Only ${currentItem.productQuantity} items available in stock`,
          variant: "destructive",
        });
        return;
      }

      // Update quantity in backend
      const response = await fetch("/api/user/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setCartItems((prev) =>
          prev.map((item) =>
            item._id === productId
              ? { ...item, cartQuantity: newQuantity }
              : item
          )
        );
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const handleSizeSelect = (productId: string, sizeId: string) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: sizeId,
    }));
  };

  const handleCheckout = () => {
    const missingSize = cartItems.some(
      (item) => (item.productSize?.length ?? 0) > 0 && !selectedSizes[item._id!]
    );

    if (missingSize) {
      toast({
        title: "Please select size",
        description: "Size selection is required for some items",
        variant: "destructive",
      });
      return;
    }

    // Prepare checkout data with size labels
    const checkoutData: CheckoutData = {
      items: cartItems.map((item) => {
        // Find the selected size object to get its label
        const selectedSizeId = selectedSizes[item._id!];
        const selectedSize = item.productSize?.find(
          (size) => size._id === selectedSizeId
        );

        return {
          productId: item._id!,
          productName: item.productName,
          selectedSize: selectedSize ? selectedSize.label : undefined, // Using label instead of ID
          quantity: item.cartQuantity,
          price: item.netPrice,
          coverImage: item.productCoverImage as string,
          deliveryDate: formattedDeliveryDate(item.deliveryDays),
        };
      }),
      subtotal,
      deliveryCharges,
      total,
    };

    sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    router.push("/checkout");
  };

  // Fetch cart items
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const userResponse = await fetch("/api/user/current");
        const userData = await userResponse.json();

        if (!userData.success || !userData.data) {
          setError("Please login to view cart");
          return;
        }

        const cartProductIds = userData.data.cart || [];
        const productPromises = cartProductIds.map((id: string) =>
          fetch(`/api/products/${id}`).then((res) => res.json())
        );

        const productResponses = await Promise.all(productPromises);
        const cartProducts = productResponses
          .filter((response) => response.success)
          .map((response) => ({
            ...response.data,
            cartQuantity: 1, // Initial cart quantity is 1
            deliveryCharges: calculateDeliveryCharges(response.data),
          }));

        setCartItems(cartProducts);
      } catch (err) {
        console.error("Error fetching cart:", err);
        setError("Failed to load cart items");
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, []);

  // Helper function to calculate delivery charges
  const calculateDeliveryCharges = (product: IProductResponse): number => {
    // Add your delivery charges calculation logic here
    return product.deliveryCharges;
  };

  const formattedDeliveryDate = (deliveryDays: number) => {
    const currentDate = new Date();
    const deliveryDate = new Date(
      currentDate.getTime() + deliveryDays * 24 * 60 * 60 * 1000
    );
    return deliveryDate
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "/");
  };

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Cart</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </motion.div>
      </motion.div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Your cart is empty</p>
                <Button variant="link" className="mt-4" asChild>
                  <a href="/shop">Continue Shopping</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-4 bg-white p-4 rounded-lg shadow"
                  >
                    <Image
                      src={`/api/files/${item.productCoverImage}`}
                      alt={item.productName}
                      width={100}
                      height={100}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.productName}</h3>
                      <p className="text-gray-600 text-sm">
                        {item.primaryCategory?.name}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <QuantitySelector
                          quantity={item.cartQuantity}
                          setQuantity={(newQty: number) =>
                            updateQuantity(item._id!, newQty)
                          }
                          max={item.productQuantity} // Set max to available inventory
                        />
                        <Select
                          value={selectedSizes[item._id!] || ""}
                          onValueChange={(value) =>
                            handleSizeSelect(item._id!, value)
                          }
                        >
                          {/* Remove the extra bottom margin from the trigger */}
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select Size" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.productSize?.map((size) => (
                              <SelectItem key={size._id} value={size._id!}>
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item._id!)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <p className="text-gray-600 text-sm mt-2">
                        Expected Delivery By:{" "}
                        {formattedDeliveryDate(item.deliveryDays)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₹
                        {(item.netPrice * item.cartQuantity).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                      {item.mrp > item.netPrice && (
                        <div>
                          <p className="text-sm text-gray-500 line-through">
                            ₹
                            {(item.mrp * item.cartQuantity).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                          <p className="text-green-500 text-xs">
                            {item.discountValue}
                            {item.discountType === "percentage" ? (
                              <span>% off</span>
                            ) : (
                              <span>rs off</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>₹{deliveryCharges.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
              <Button
                className="w-full primary-btn"
                disabled={cartItems.length === 0}
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
            </div>
            <div className="flex-center gap-2 mt-4">
              <ShieldCheck
                className="size-10 text-gray-500"
                fill="gray"
                color="white"
              />
              <p className="text-sm max-w-xs text-gray-500">
                Safe and Secure Payments. Easy returns. 100% Authentic products.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
