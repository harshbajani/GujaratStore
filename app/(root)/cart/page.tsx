"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckoutData } from "@/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QuantitySelector from "@/components/ui/quantity-selector";
import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";
import BreadcrumbHeader from "@/components/BreadcrumbHeader";
import { useCart } from "@/hooks/useCart";

const CartPage = () => {
  const router = useRouter();
  const {
    cartItems,
    loading,
    error,
    subtotal,
    deliveryCharges,
    total,
    formattedDeliveryDate,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(
    {}
  );

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
          selectedSize: selectedSize ? selectedSize.label : undefined,
          quantity: item.cartQuantity,
          price: item.netPrice,
          coverImage: item.productCoverImage as string,
          deliveryDate: formattedDeliveryDate(item.deliveryDays),
        };
      }),
      subtotal,
      deliveryCharges,
      total,
      discountAmount: 0,
      discountCode: "",
    };

    sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    router.push("/checkout");
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
      <BreadcrumbHeader title="Home" subtitle="Cart" titleHref="/" />
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
                          max={item.productQuantity}
                        />
                        <Select
                          value={selectedSizes[item._id!] || ""}
                          onValueChange={(value) =>
                            handleSizeSelect(item._id!, value)
                          }
                        >
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
