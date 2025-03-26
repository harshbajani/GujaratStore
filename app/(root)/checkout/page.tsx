"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Loader from "@/components/Loader";
import { cn } from "@/lib/utils";

import BreadcrumbHeader from "@/components/BreadcrumbHeader";
import OrderConfirmationDialog from "@/components/OrderConfirmationDialog";
import DiscountSection from "@/components/Discount";
import AccordionSection from "@/components/AccordionSection";
import { useCheckout } from "@/hooks/useCheckout"; // Adjust the import path as needed

const CheckoutPage = () => {
  const {
    state: {
      checkoutData,
      userData,
      loading,
      selectedAddress,
      submitting,
      discountCode,
      discountAmount,
      discountInfo,
      loadingDiscount,
      expandedSection,
      paymentOption,
      isConfirmationOpen,
      confirmedOrderId,
    },
    dispatch,
    updateQuantity,
    removeItem,
    handleApplyDiscount,
    confirmOrder,
    toggleSection,
  } = useCheckout();

  if (loading) return <Loader />;
  if (!checkoutData || !userData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbHeader title="Home" subtitle="Checkout" titleHref="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Delivery To */}
            <AccordionSection
              id="deliveryTo"
              title="DELIVERY TO"
              index={1}
              expandedSection={expandedSection}
              onToggle={toggleSection}
            >
              <p className="font-medium">{userData.name}</p>
              <p className="text-gray-600">{userData.phone}</p>
            </AccordionSection>

            {/* Delivery Address */}
            <AccordionSection
              id="deliveryAddress"
              title="DELIVERY ADDRESS"
              index={2}
              expandedSection={expandedSection}
              onToggle={toggleSection}
            >
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
                        onClick={() =>
                          dispatch({
                            type: "SET_SELECTED_ADDRESS",
                            payload: address._id!,
                          })
                        }
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
            </AccordionSection>

            {/* Order Summary */}
            <AccordionSection
              id="orderSummary"
              title="ORDER SUMMARY"
              index={3}
              expandedSection={expandedSection}
              onToggle={toggleSection}
              showItemCount={checkoutData.items.length}
            >
              {checkoutData.items.map((item) => (
                <div key={item.productId} className="flex gap-4 border-b pb-4">
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
                      {item.selectedSize && <p>Size: {item.selectedSize}</p>}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="h-6 w-6 border rounded-full flex items-center justify-center"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            className="h-6 w-6 border rounded-full flex items-center justify-center"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
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
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm text-gray-600">
                      Delivery: {item.deliveryDate}
                    </p>
                  </div>
                </div>
              ))}
            </AccordionSection>

            {/* Payment Options */}
            <AccordionSection
              id="paymentOptions"
              title="PAYMENT OPTIONS"
              index={4}
              expandedSection={expandedSection}
              onToggle={toggleSection}
              changeButtonText={undefined}
            >
              <RadioGroup
                value={paymentOption}
                onValueChange={(value) =>
                  dispatch({ type: "SET_PAYMENT_OPTION", payload: value })
                }
                className="space-y-3"
              >
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
                    value="google-pay"
                    id="google-pay"
                    className="text-red-600 border-red-600"
                    disabled
                  />
                  <Label htmlFor="google-pay">Google Pay (coming soon)</Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-md">
                  <RadioGroupItem
                    value="net-banking"
                    id="net-banking"
                    className="text-red-600 border-red-600"
                    disabled
                  />
                  <Label htmlFor="net-banking">Net Banking (coming soon)</Label>
                </div>
              </RadioGroup>
            </AccordionSection>

            {/* Discount Code */}
            <AccordionSection
              id="discount"
              title="DISCOUNT CODE"
              index={5}
              expandedSection={expandedSection}
              onToggle={toggleSection}
            >
              <DiscountSection
                onApplyDiscount={handleApplyDiscount}
                discountCode={discountCode}
                setDiscountCode={(code) =>
                  dispatch({ type: "SET_DISCOUNT_CODE", payload: code })
                }
                discountAmount={discountAmount}
                discountInfo={discountInfo}
                loadingDiscount={loadingDiscount}
              />
            </AccordionSection>
          </div>

          {/* Right Column - Price Details */}
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
            </div>
          </div>
        </div>
      </div>

      {/* Order Confirmation Dialog */}
      <OrderConfirmationDialog
        isOpen={isConfirmationOpen}
        onClose={() =>
          dispatch({ type: "SET_CONFIRMATION_OPEN", payload: false })
        }
        orderId={confirmedOrderId}
      />
    </div>
  );
};

export default CheckoutPage;
