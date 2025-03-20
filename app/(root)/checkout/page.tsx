/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Loader from "@/components/Loader";
import { toast } from "@/hooks/use-toast";
import { cn, generateOrderId } from "@/lib/utils";

import { CheckoutData, IUser } from "@/types";
import BreadcrumbHeader from "@/components/BreadcrumbHeader";
import OrderConfirmationDialog from "@/components/OrderConfirmationDialog";
import DiscountSection from "@/components/Discount";

const CheckoutPage = () => {
  const router = useRouter();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [userData, setUserData] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInfo, setDiscountInfo] = useState("");
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  // Order confirmation dialog state
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState("");

  // Section expansion states
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Payment option state
  const [paymentOption, setPaymentOption] = useState("cash-on-delivery");

  const handleApplyDiscount = async () => {
    if (!discountCode) return;

    setLoadingDiscount(true);
    try {
      // Call API to validate discount code
      const response = await fetch(`/api/discounts/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountCode,
          items: checkoutData?.items, // Send items to check category eligibility
        }),
      });

      const result = await response.json();

      if (result.success && checkoutData) {
        // Apply discount to total
        const newTotal = checkoutData.total - result.discountAmount;

        setDiscountAmount(result.discountAmount);
        setDiscountInfo(
          `${result.message} - ₹${result.discountAmount.toLocaleString(
            "en-IN"
          )} off`
        );
        setAppliedDiscount(result.discount);

        // Update checkout data with discount
        const updatedCheckoutData = {
          ...checkoutData,
          discountAmount: result.discountAmount,
          discountCode: discountCode,
          total: newTotal,
        };

        setCheckoutData(updatedCheckoutData);
        sessionStorage.setItem(
          "checkoutData",
          JSON.stringify(updatedCheckoutData)
        );

        toast({
          title: "Success",
          description: result.message,
          className: "bg-green-500 text-white",
        });
      } else {
        setDiscountInfo("");
        setDiscountAmount(0);
        setAppliedDiscount(null);

        toast({
          title: "Invalid Code",
          description:
            result.message || "This discount code is invalid or expired",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error applying discount:", error);
      toast({
        title: "Error",
        description: "Failed to apply discount code",
        variant: "destructive",
      });
    } finally {
      setLoadingDiscount(false);
    }
  };

  const confirmOrder = () => {
    if (!selectedAddress) {
      toast({
        title: "Error",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const orderId = generateOrderId();
    const orderStatus = "confirmed";

    const orderPayload = {
      orderId,
      status: orderStatus,
      userId: userData?._id,
      items: checkoutData?.items,
      subtotal: checkoutData?.subtotal,
      deliveryCharges: checkoutData?.deliveryCharges,
      discountAmount: checkoutData?.discountAmount || 0,
      discountCode: checkoutData?.discountCode || "",
      total: checkoutData?.total,
      addressId: selectedAddress,
      paymentOption,
    };

    fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Clear checkout data from session storage
          sessionStorage.removeItem("checkoutData");

          // Set the confirmed order ID and open the confirmation dialog
          setConfirmedOrderId(orderId);
          setIsConfirmationOpen(true);

          toast({
            title: "Success",
            description: "Order Confirmed",
            className: "bg-green-500 text-white",
          });
        } else {
          console.error("Error creating order", data.error);
          toast({
            title: "Error",
            description: data.error || "Failed to confirm order",
            variant: "destructive",
          });
        }
      })
      .catch((error) => {
        console.error("Error processing order:", error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch("/api/user/current");
        const userData = await userResponse.json();

        if (!userData.success) {
          router.push("/login");
          return;
        }

        setUserData(userData.data);

        // Get checkout data from session storage
        const storedData = sessionStorage.getItem("checkoutData");
        if (!storedData) {
          router.push("/cart");
          return;
        }

        setCheckoutData(JSON.parse(storedData));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load checkout data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Function to update item quantity in checkout
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (!checkoutData) return;

    // Ensure quantity doesn't go below 1
    if (newQuantity < 1) return;

    // Update the quantity in the checkout data
    const updatedItems = checkoutData.items.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );

    // Recalculate totals
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Update checkout data with new values
    const updatedCheckoutData = {
      ...checkoutData,
      items: updatedItems,
      subtotal,
      total: subtotal + checkoutData.deliveryCharges,
    };

    // Update state and session storage
    setCheckoutData(updatedCheckoutData);
    sessionStorage.setItem("checkoutData", JSON.stringify(updatedCheckoutData));
  };

  // Function to remove item from checkout
  const removeItem = (productId: string) => {
    if (!checkoutData) return;

    // Filter out the removed item
    const updatedItems = checkoutData.items.filter(
      (item) => item.productId !== productId
    );

    // If no items left, return to cart
    if (updatedItems.length === 0) {
      router.push("/cart");
      return;
    }

    // Recalculate totals
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate delivery charges (keep existing logic)
    const deliveryCharges = updatedItems.reduce(
      (sum) => sum + 0, // Replace with your delivery charge logic if needed
      checkoutData.deliveryCharges
    );

    // Update checkout data
    const updatedCheckoutData = {
      ...checkoutData,
      items: updatedItems,
      subtotal,
      deliveryCharges,
      total: subtotal + deliveryCharges,
    };

    // Update state and session storage
    setCheckoutData(updatedCheckoutData);
    sessionStorage.setItem("checkoutData", JSON.stringify(updatedCheckoutData));

    // Show success toast
    toast({
      title: "Item removed",
      description: "Item has been removed from your order",
    });

    // Also remove from cart in the backend
    fetch("/api/user/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
  };

  if (loading) return <Loader />;
  if (!checkoutData || !userData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <BreadcrumbHeader title="Home" subtitle="Checkout" titleHref="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Delivery To */}
            <div className="bg-white rounded-md overflow-hidden">
              <div
                className={cn(
                  "flex justify-between items-center p-4 cursor-pointer",
                  expandedSection === "deliveryTo"
                    ? "bg-red-600 text-white"
                    : ""
                )}
                onClick={() => toggleSection("deliveryTo")}
              >
                <div className="flex items-center gap-2">
                  <span className="flex justify-center items-center h-6 w-6 rounded-full border text-sm">
                    1
                  </span>
                  <h2 className="font-semibold">DELIVERY TO</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    expandedSection === "deliveryTo"
                      ? "bg-white text-black"
                      : ""
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection("deliveryTo");
                  }}
                >
                  CHANGE
                </Button>
              </div>

              {expandedSection === "deliveryTo" && (
                <div className="p-4">
                  <p className="font-medium">{userData.name}</p>
                  <p className="text-gray-600">{userData.phone}</p>
                </div>
              )}
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-md overflow-hidden">
              <div
                className={cn(
                  "flex justify-between items-center p-4 cursor-pointer",
                  expandedSection === "deliveryAddress"
                    ? "bg-red-600 text-white"
                    : ""
                )}
                onClick={() => toggleSection("deliveryAddress")}
              >
                <div className="flex items-center gap-2">
                  <span className="flex justify-center items-center h-6 w-6 rounded-full border text-sm">
                    2
                  </span>
                  <h2 className="font-semibold">DELIVERY ADDRESS</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    expandedSection === "deliveryAddress"
                      ? "bg-white text-black"
                      : ""
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection("deliveryAddress");
                  }}
                >
                  CHANGE
                </Button>
              </div>

              {expandedSection === "deliveryAddress" ? (
                <div className="p-4">
                  {userData.addresses.length > 0 ? (
                    <div className="space-y-3">
                      {userData.addresses.map((address) => (
                        <div
                          key={address._id}
                          className={cn(
                            "border rounded-md p-4 flex justify-between",
                            selectedAddress === address._id
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200"
                          )}
                        >
                          <div>
                            <p className="font-semibold">{address.name}</p>
                            <p className="text-sm text-gray-600">
                              {address.contact}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.address_line_1}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.address_line_2}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.locality}, {address.state} -{" "}
                              {address.pincode}
                            </p>
                            <span className="inline-block text-xs px-2 py-1 bg-gray-100 rounded mt-2">
                              {address.type}
                            </span>
                          </div>
                          <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => setSelectedAddress(address._id!)}
                          >
                            DELIVER HERE
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p>No addresses found.</p>
                    </div>
                  )}
                </div>
              ) : selectedAddress ? (
                <div className="p-4">
                  {
                    userData.addresses.find((a) => a._id === selectedAddress)
                      ?.address_line_1
                  }
                  ,
                  {
                    userData.addresses.find((a) => a._id === selectedAddress)
                      ?.address_line_2
                  }
                  ,
                  {
                    userData.addresses.find((a) => a._id === selectedAddress)
                      ?.locality
                  }
                  ,
                  {
                    userData.addresses.find((a) => a._id === selectedAddress)
                      ?.state
                  }{" "}
                  -
                  {
                    userData.addresses.find((a) => a._id === selectedAddress)
                      ?.pincode
                  }
                </div>
              ) : null}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-md overflow-hidden">
              <div
                className={cn(
                  "flex justify-between items-center p-4 cursor-pointer",
                  expandedSection === "orderSummary"
                    ? "bg-red-600 text-white"
                    : ""
                )}
                onClick={() => toggleSection("orderSummary")}
              >
                <div className="flex items-center gap-2">
                  <span className="flex justify-center items-center h-6 w-6 rounded-full border text-sm">
                    3
                  </span>
                  <h2 className="font-semibold">ORDER SUMMARY</h2>
                  <span className="text-sm">
                    ({checkoutData.items.length} items)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    expandedSection === "orderSummary"
                      ? "bg-white text-black"
                      : ""
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection("orderSummary");
                  }}
                >
                  CHANGE
                </Button>
              </div>

              {expandedSection === "orderSummary" && (
                <div className="p-4 space-y-4">
                  {checkoutData.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-4 border-b pb-4"
                    >
                      <Image
                        src={`/api/files/${item.coverImage}`}
                        alt={item.productName}
                        width={80}
                        height={80}
                        className="rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.productName}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <p>Color: Dark Grey</p>
                          {item.selectedSize && (
                            <p>Size: {item.selectedSize}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                className="h-6 w-6 border rounded-full flex items-center justify-center"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity - 1
                                  )
                                }
                              >
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                className="h-6 w-6 border rounded-full flex items-center justify-center"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity + 1
                                  )
                                }
                              >
                                +
                              </button>
                            </div>
                            <button
                              className="text-red-600 text-sm"
                              onClick={() => removeItem(item.productId)}
                            >
                              REMOVE
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹
                          {(item.price * item.quantity).toLocaleString("en-IN")}
                        </p>
                        <p className="text-sm text-gray-600">
                          Delivery: {item.deliveryDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Options */}
            <div className="bg-white rounded-md overflow-hidden">
              <div
                className={cn(
                  "flex justify-between items-center p-4 cursor-pointer",
                  expandedSection === "paymentOptions"
                    ? "bg-red-600 text-white"
                    : ""
                )}
                onClick={() => toggleSection("paymentOptions")}
              >
                <div className="flex items-center gap-2">
                  <span className="flex justify-center items-center h-6 w-6 rounded-full border text-sm">
                    4
                  </span>
                  <h2 className="font-semibold">PAYMENT OPTIONS</h2>
                </div>
              </div>

              {expandedSection === "paymentOptions" && (
                <div className="p-4">
                  <RadioGroup
                    value={paymentOption}
                    onValueChange={setPaymentOption}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 p-2 border rounded-md">
                      <RadioGroupItem
                        value="google-pay"
                        id="google-pay"
                        className="text-red-600 border-red-600"
                        disabled
                      />
                      <Label htmlFor="google-pay">
                        Google Pay (coming soon)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 border rounded-md">
                      <RadioGroupItem
                        value="cash-on-delivery"
                        id="cash-on-delivery"
                        className="text-red-600 border-red-600"
                      />
                      <Label htmlFor="cash-on-delivery">
                        Cash on Delivery (COD)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 border rounded-md">
                      <RadioGroupItem
                        value="net-banking"
                        id="net-banking"
                        className="text-red-600 border-red-600"
                        disabled
                      />
                      <Label htmlFor="net-banking">
                        Net Banking (coming soon)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
            <div className="bg-white rounded-md overflow-hidden">
              <div
                className={cn(
                  "flex justify-between items-center p-4 cursor-pointer",
                  expandedSection === "discount" ? "bg-red-600 text-white" : ""
                )}
                onClick={() => toggleSection("discount")}
              >
                <div className="flex items-center gap-2">
                  <span className="flex justify-center items-center h-6 w-6 rounded-full border text-sm">
                    5
                  </span>
                  <h2 className="font-semibold">DISCOUNT CODE</h2>
                </div>
              </div>

              {expandedSection === "discount" && (
                <div className="p-4">
                  <DiscountSection
                    onApplyDiscount={handleApplyDiscount}
                    discountCode={discountCode}
                    setDiscountCode={setDiscountCode}
                    discountAmount={discountAmount}
                    discountInfo={discountInfo}
                    loadingDiscount={loadingDiscount}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Price Details */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-md shadow-sm sticky top-4">
              <h2 className="text-xl font-bold mb-4">PRICE DETAILS</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Price ({checkoutData.items.length} items)</span>
                  <span>₹{checkoutData.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  {checkoutData.deliveryCharges > 0 ? (
                    <span>
                      ₹{checkoutData.deliveryCharges.toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span className="text-green-500">Free</span>
                  )}
                </div>

                {/* Add discount info to price breakdown */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{checkoutData.total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={confirmOrder}
                disabled={loading || !selectedAddress || submitting}
              >
                {submitting ? "Processing..." : "Confirm order"}
              </Button>

              {/* Rest of your component remains the same */}
            </div>
          </div>
        </div>
      </div>

      {/* Order Confirmation Dialog */}
      <OrderConfirmationDialog
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        orderId={confirmedOrderId}
      />
    </div>
  );
};

export default CheckoutPage;
