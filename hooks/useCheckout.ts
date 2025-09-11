/* eslint-disable @typescript-eslint/no-explicit-any */
import { useReducer, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateOrderId } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";

// Define the shape of our checkout state
interface CheckoutState {
  checkoutData: CheckoutData | null;
  userData: IUser | null;
  loading: boolean;
  selectedAddress: string;
  submitting: boolean;
  discountCode: string;
  discountAmount: number;
  discountInfo: string;
  loadingDiscount: boolean;
  expandedSection: string | null;
  paymentOption: string;
  isConfirmationOpen: boolean;
  confirmedOrderId: string;
  appliedDiscountCode: string;
  originalTotal: number;
  // New reward points fields
  pointsToRedeem: number;
  rewardDiscountAmount: number;
  loadingRewardRedemption: boolean;
}

// Define our action types
type Action =
  | { type: "SET_CHECKOUT_DATA"; payload: CheckoutData | null }
  | { type: "SET_USER_DATA"; payload: IUser | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SELECTED_ADDRESS"; payload: string }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_DISCOUNT_CODE"; payload: string }
  | { type: "SET_DISCOUNT_AMOUNT"; payload: number }
  | { type: "SET_DISCOUNT_INFO"; payload: string }
  | { type: "SET_LOADING_DISCOUNT"; payload: boolean }
  | { type: "SET_EXPANDED_SECTION"; payload: string | null }
  | { type: "SET_PAYMENT_OPTION"; payload: string }
  | { type: "SET_CONFIRMATION_OPEN"; payload: boolean }
  | { type: "SET_CONFIRMED_ORDER_ID"; payload: string }
  | { type: "SET_APPLIED_DISCOUNT_CODE"; payload: string }
  | { type: "SET_ORIGINAL_TOTAL"; payload: number }
  | { type: "UPDATE_CHECKOUT_DATA"; payload: CheckoutData }
  // New reward points actions
  | { type: "SET_POINTS_TO_REDEEM"; payload: number }
  | { type: "SET_REWARD_DISCOUNT_AMOUNT"; payload: number }
  | { type: "SET_LOADING_REWARD_REDEMPTION"; payload: boolean };

const initialState: CheckoutState = {
  checkoutData: null,
  userData: null,
  loading: true,
  selectedAddress: "",
  submitting: false,
  discountCode: "",
  discountAmount: 0,
  discountInfo: "",
  loadingDiscount: false,
  expandedSection: "deliveryTo",
  paymentOption: "razorpay",
  isConfirmationOpen: false,
  confirmedOrderId: "",
  appliedDiscountCode: "",
  originalTotal: 0,
  // Initialize new reward points fields
  pointsToRedeem: 0,
  rewardDiscountAmount: 0,
  loadingRewardRedemption: false,
};

function checkoutReducer(state: CheckoutState, action: Action): CheckoutState {
  switch (action.type) {
    case "SET_CHECKOUT_DATA":
      return { ...state, checkoutData: action.payload };
    case "SET_USER_DATA":
      return { ...state, userData: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SELECTED_ADDRESS":
      return { ...state, selectedAddress: action.payload };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.payload };
    case "SET_DISCOUNT_CODE":
      return { ...state, discountCode: action.payload };
    case "SET_DISCOUNT_AMOUNT":
      return { ...state, discountAmount: action.payload };
    case "SET_DISCOUNT_INFO":
      return { ...state, discountInfo: action.payload };
    case "SET_LOADING_DISCOUNT":
      return { ...state, loadingDiscount: action.payload };
    case "SET_EXPANDED_SECTION":
      return { ...state, expandedSection: action.payload };
    case "SET_PAYMENT_OPTION":
      return { ...state, paymentOption: action.payload };
    case "SET_CONFIRMATION_OPEN":
      return { ...state, isConfirmationOpen: action.payload };
    case "SET_CONFIRMED_ORDER_ID":
      return { ...state, confirmedOrderId: action.payload };
    case "SET_APPLIED_DISCOUNT_CODE":
      return { ...state, appliedDiscountCode: action.payload };
    case "SET_ORIGINAL_TOTAL":
      return { ...state, originalTotal: action.payload };
    case "UPDATE_CHECKOUT_DATA":
      return { ...state, checkoutData: action.payload };
    // Handle new reward points actions
    case "SET_POINTS_TO_REDEEM":
      return { ...state, pointsToRedeem: action.payload };
    case "SET_REWARD_DISCOUNT_AMOUNT":
      return { ...state, rewardDiscountAmount: action.payload };
    case "SET_LOADING_REWARD_REDEMPTION":
      return { ...state, loadingRewardRedemption: action.payload };
    default:
      return state;
  }
}

async function checkReferralDiscount(
  userData: IUser | null,
  checkoutData: CheckoutData
): Promise<{
  referralDiscount: number;
  referralDiscountType?: "percentage" | "amount";
  referralCode?: string;
}> {
  // If no user, no referral, or referral already used, return no discount
  if (!userData?.referral || userData.referralUsed) {
    return { referralDiscount: 0 };
  }

  try {
    // First, fetch the referral details
    const referralResponse = await fetch(
      `/api/referrals?code=${userData.referral}`
    );
    const referralData = await referralResponse.json();

    if (!referralData.success) {
      return { referralDiscount: 0 };
    }

    const referral = referralData.data;

    // Check referral validity
    const now = new Date();
    if (
      !referral.isActive ||
      new Date(referral.expiryDate) < now ||
      referral.usedCount >= referral.maxUses
    ) {
      return { referralDiscount: 0 };
    }

    // Check and calculate product-specific referral discount
    let totalReferralDiscount = 0;

    // Fetch and check each product's parent category
    const discountPromises = checkoutData.items.map(async (item) => {
      const productResponse = await fetch(
        `/api/vendor/products/${item.productId}`
      );
      const productData = await productResponse.json();

      // Check if product's parent category matches referral's parent category
      if (
        productData.success &&
        productData.data.parentCategory?._id ===
          referral.parentCategory._id.toString()
      ) {
        // Calculate discount for this specific product
        let itemDiscount = 0;
        if (referral.discountType === "percentage") {
          // Calculate percentage discount on item's total price
          itemDiscount =
            (item.price * item.quantity * referral.discountValue) / 100;
        } else {
          // Fixed amount discount (applied per item)
          itemDiscount = referral.discountValue * item.quantity;
        }

        return itemDiscount;
      }

      return 0;
    });

    // Wait for all discount calculations
    const itemDiscounts = await Promise.all(discountPromises);

    // Sum up total referral discount
    totalReferralDiscount = itemDiscounts.reduce(
      (sum, discount) => sum + discount,
      0
    );

    // If no discount found, return 0
    if (totalReferralDiscount <= 0) {
      return { referralDiscount: 0 };
    }

    // Record referral usage
    const usageResponse = await fetch("/api/referrals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: referral.code }),
    });
    const usageData = await usageResponse.json();

    if (!usageData.success) {
      console.error("Failed to record referral usage");
      return { referralDiscount: 0 };
    }

    // Update user to mark referral as used
    await fetch("/api/user/current", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralUsed: true }),
    });

    return {
      referralDiscount: totalReferralDiscount,
      referralDiscountType: referral.discountType,
      referralCode: referral.code,
    };
  } catch (error) {
    console.error("Error checking referral discount:", error);
    return { referralDiscount: 0 };
  }
}

export function useCheckout() {
  const router = useRouter();
  const { data: session } = useSession();
  const { clearCart, removeFromCart } = useCart();
  const [state, dispatch] = useReducer(checkoutReducer, initialState);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [referralDiscountType, setReferralDiscountType] = useState<
    "percentage" | "amount" | undefined
  >(undefined);
  const [referralCode, setReferralCode] = useState<string | undefined>(
    undefined
  );

  // Fetch user data and checkout data from session storage
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check for checkout data first
        const storedData = sessionStorage.getItem("checkoutData");
        if (!storedData) {
          router.push("/cart");
          return;
        }
        const parsedData: CheckoutData = JSON.parse(storedData);
        dispatch({ type: "SET_CHECKOUT_DATA", payload: parsedData });
        dispatch({ type: "SET_ORIGINAL_TOTAL", payload: parsedData.total });

        // Handle authenticated user data
        if (session) {
          const userResponse = await fetch("/api/user/current");
          const userData = await userResponse.json();

          if (userData.success) {
            dispatch({ type: "SET_USER_DATA", payload: userData.data });

            // Fetch user's reward points
            if (userData.data?._id) {
              try {
                const rewardPointsResponse = await fetch(
                  `/api/rewards/redeem?userId=${userData.data._id}`
                );
                const rewardPointsData = await rewardPointsResponse.json();

                if (rewardPointsData.success) {
                  dispatch({
                    type: "SET_USER_DATA",
                    payload: {
                      ...userData.data,
                      rewardPoints: rewardPointsData.data.rewardPoints,
                    },
                  });
                }
              } catch (rewardError) {
                console.error("Error fetching reward points:", rewardError);
              }
            }

            // Check for referral discount for authenticated users
            const referralDiscountResult = await checkReferralDiscount(
              userData.data,
              parsedData
            );

            if (referralDiscountResult.referralDiscount > 0) {
              setReferralDiscount(referralDiscountResult.referralDiscount);
              setReferralDiscountType(
                referralDiscountResult.referralDiscountType
              );
              setReferralCode(referralDiscountResult.referralCode);

              const newTotal =
                parsedData.total - referralDiscountResult.referralDiscount;
              const updatedCheckoutData: CheckoutData = {
                ...parsedData,
                discountAmount:
                  (parsedData.discountAmount || 0) +
                  referralDiscountResult.referralDiscount,
                total: newTotal,
              };

              dispatch({
                type: "UPDATE_CHECKOUT_DATA",
                payload: updatedCheckoutData,
              });
              sessionStorage.setItem(
                "checkoutData",
                JSON.stringify(updatedCheckoutData)
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load checkout data", {
          description: "Please try again later.",
          duration: 5000,
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    fetchData();
  }, [router, session]);

  // Helper: update checkout data in state and session storage
  const updateCheckoutData = (newData: CheckoutData) => {
    dispatch({ type: "UPDATE_CHECKOUT_DATA", payload: newData });
    sessionStorage.setItem("checkoutData", JSON.stringify(newData));
  };

  // Update quantity for a given product in checkout
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!state.checkoutData || newQuantity < 1) return;

    const updatedItems = state.checkoutData.items.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );

    const subtotal = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const newCheckoutData: CheckoutData = {
      ...state.checkoutData,
      items: updatedItems,
      subtotal,
      total:
        subtotal +
        state.checkoutData.deliveryCharges -
        (state.checkoutData.discountAmount || 0) -
        state.rewardDiscountAmount,
    };

    updateCheckoutData(newCheckoutData);
  };

  // Remove an item from checkout
  const removeItem = async (productId: string) => {
    if (!state.checkoutData) return;

    try {
      // Use the cart context to remove the item (this handles both server and client state)
      await removeFromCart(productId);

      // Update local checkout data
      const updatedItems = state.checkoutData.items.filter(
        (item) => item.productId !== productId
      );

      if (updatedItems.length === 0) {
        // If no items left, clear checkout data and redirect
        sessionStorage.removeItem("checkoutData");
        router.push("/cart");
        return;
      }

      const subtotal = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const newCheckoutData: CheckoutData = {
        ...state.checkoutData,
        items: updatedItems,
        subtotal,
        total:
          subtotal +
          state.checkoutData.deliveryCharges -
          (state.checkoutData.discountAmount || 0) -
          state.rewardDiscountAmount,
      };

      updateCheckoutData(newCheckoutData);

      toast.success("Item removed", {
        description: "Item has been removed from your order",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Oops!", {
        description: "Failed to remove item",
        duration: 5000,
      });
    }
  };

  // Apply a discount code
  const handleApplyDiscount = async () => {
    if (!state.discountCode || !state.checkoutData) return;

    // Prevent reapplying the same discount
    if (state.discountCode === state.appliedDiscountCode) {
      toast.warning("Warning", {
        description: "This discount code is already applied",
        duration: 5000,
      });
      return;
    }

    dispatch({ type: "SET_LOADING_DISCOUNT", payload: true });
    try {
      const response = await fetch(`/api/vendor/discounts/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: state.discountCode,
          items: state.checkoutData.items,
          userId: state.userData?._id,
          deliveryCharges: state.checkoutData.deliveryCharges,
          rewardDiscountAmount: state.rewardDiscountAmount,
        }),
      });
      const result = await response.json();

      if (result.success) {
        dispatch({
          type: "SET_DISCOUNT_AMOUNT",
          payload: result.data.discountAmount,
        });
        dispatch({ type: "SET_DISCOUNT_INFO", payload: result.message });
        dispatch({
          type: "SET_APPLIED_DISCOUNT_CODE",
          payload: state.discountCode,
        });

        // Use the calculated total from the service instead of calculating here
        const updatedCheckoutData: CheckoutData = {
          ...state.checkoutData,
          discountAmount: result.data.discountAmount,
          discountCode: state.discountCode,
          total: result.data.newTotal, // Use the properly calculated total from the service
        };

        updateCheckoutData(updatedCheckoutData);
        toast.success("Success", {
          description: result.message,
          duration: 5000,
        });
      } else {
        dispatch({ type: "SET_DISCOUNT_INFO", payload: "" });
        dispatch({ type: "SET_DISCOUNT_AMOUNT", payload: 0 });
        toast.error("Invalid Code", {
          description:
            result.message || "This discount code is invalid or expired",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error applying discount:", error);
      toast.error("Oops!", {
        description: "Failed to apply discount code",
        duration: 5000,
      });
    } finally {
      dispatch({ type: "SET_LOADING_DISCOUNT", payload: false });
    }
  };

  // Redeem reward points
  const handleRedeemRewardPoints = async () => {
    if (!state.userData || !state.checkoutData || state.pointsToRedeem <= 0)
      return;

    // Validate points to redeem
    if (state.pointsToRedeem > (state.userData.rewardPoints || 0)) {
      toast.warning("Warning", {
        description: "You don't have enough reward points",
        duration: 5000,
      });
      return;
    }

    dispatch({ type: "SET_LOADING_REWARD_REDEMPTION", payload: true });
    try {
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: state.userData._id,
          pointsToRedeem: state.pointsToRedeem,
        }),
      });
      const result = await response.json();

      if (result.success) {
        // Update local state with the redemption results
        dispatch({
          type: "SET_REWARD_DISCOUNT_AMOUNT",
          payload: result.data.discountAmount,
        });

        // Update user's reward points in state
        dispatch({
          type: "SET_USER_DATA",
          payload: {
            ...state.userData,
            rewardPoints: result.data.remainingPoints,
          },
        });

        // Update checkout data with reward discount
        const newTotal =
          state.checkoutData.subtotal +
          state.checkoutData.deliveryCharges -
          (state.checkoutData.discountAmount || 0) -
          result.data.discountAmount;

        const updatedCheckoutData: CheckoutData = {
          ...state.checkoutData,
          total: newTotal,
        };

        updateCheckoutData(updatedCheckoutData);

        toast.success("Success", {
          description: `Redeemed ${state.pointsToRedeem} points for ₹${result.data.discountAmount} discount`,
          duration: 5000,
        });
      } else {
        toast.error("Redemption Failed", {
          description: result.error || "Failed to redeem reward points",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error redeeming reward points:", error);
      toast.error("Oops!", {
        description: "Failed to redeem reward points",
        duration: 5000,
      });
    } finally {
      dispatch({ type: "SET_LOADING_REWARD_REDEMPTION", payload: false });
    }
  };

  // Initialize Razorpay payment
  const initializeRazorpayPayment = async (orderId: string, amount: number) => {
    try {
      // First create order in database with unconfirmed status
      await createOrderWithPayment(orderId, null, "unconfirmed", "pending");

      // Create Razorpay order
      const razorpayResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          orderId: orderId,
          currency: "INR",
          notes: {
            orderId: orderId,
            userId: state.userData?._id,
            platform: "gujarat-store",
          },
        }),
      });

      const razorpayData = await razorpayResponse.json();

      if (!razorpayData.success) {
        throw new Error(
          razorpayData.error || "Failed to create Razorpay order"
        );
      }

      // Initialize Razorpay checkout
      const options = {
        key: razorpayData.data.keyId,
        amount: razorpayData.data.amount,
        currency: razorpayData.data.currency,
        name: "Gujarat Store",
        description: `Order ${orderId}`,
        order_id: razorpayData.data.razorpayOrderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await handleRazorpaySuccess(response, orderId);
        },
        // Handle explicit payment failure callback
        "failure": async (response: any) => {
          console.error('Razorpay payment failed:', response);
          const failureReason = getRazorpayErrorMessage(response.error);
          await handlePaymentFailure(orderId, failureReason);
          dispatch({ type: "SET_SUBMITTING", payload: false });
          toast.error("Payment Failed", {
            description: "Payment failed. Please try again.",
            duration: 5000,
          });
        },
        prefill: {
          name: state.userData?.name,
          email: state.userData?.email,
          contact: state.userData?.phone || "",
        },
        theme: {
          color: "#DC2626", // Red theme color
        },
        modal: {
          // Handle payment failure scenarios
          ondismiss: async () => {
            // Payment was cancelled/dismissed by user
            await handlePaymentFailure(orderId, "Payment was cancelled by user. You can retry the payment anytime by returning to your cart.");
            dispatch({ type: "SET_SUBMITTING", payload: false });
            toast.error("Payment Cancelled", {
              description: "Payment was cancelled. Your cart items are preserved.",
              duration: 5000,
            });
          },
          // Handle payment error (network issues, gateway errors, etc.)
          onerror: async (error: any) => {
            console.error('Razorpay payment error:', error);
            const errorMessage = getRazorpayErrorMessage(error);
            await handlePaymentFailure(orderId, errorMessage);
            dispatch({ type: "SET_SUBMITTING", payload: false });
            toast.error("Payment Error", {
              description: "Payment failed due to technical issues. Please try again.",
              duration: 5000,
            });
          },
          // Handle payment timeout
          timeout: 300, // 5 minutes timeout
          ontimeout: async () => {
            await handlePaymentFailure(orderId, "Payment timed out due to network issues. Please check your internet connection and try again.");
            dispatch({ type: "SET_SUBMITTING", payload: false });
            toast.error("Payment Timeout", {
              description: "Payment timed out. Please try again.",
              duration: 5000,
            });
          },
        },
      };

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        };
        script.onerror = async () => {
          await handlePaymentFailure(orderId, "Failed to load payment gateway");
          throw new Error("Failed to load Razorpay checkout script");
        };
        document.body.appendChild(script);
      } else {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error("Razorpay initialization error:", error);
      await handlePaymentFailure(orderId, error instanceof Error ? error.message : "Payment initialization failed");
      dispatch({ type: "SET_SUBMITTING", payload: false });
      toast.error("Payment Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to initialize payment",
        duration: 5000,
      });
    }
  };

  // Get user-friendly error message for Razorpay errors
  const getRazorpayErrorMessage = (error: any): string => {
    const errorCode = error?.code || error?.error_code;
    const errorDescription = error?.description || error?.error_description || error?.message;
    
    // Map common error codes to user-friendly messages
    const errorMappings: { [key: string]: string } = {
      'PAYMENT_FAILED': 'Payment was declined by your bank. Please check your card details and try again.',
      'GATEWAY_ERROR': 'There was a technical issue with the payment gateway. Please try again.',
      'CARD_EXPIRED': 'Your card has expired. Please use a different card.',
      'INSUFFICIENT_FUNDS': 'Insufficient funds in your account. Please check your balance and try again.',
      'INVALID_CARD': 'Invalid card details. Please check your card number, expiry date, and CVV.',
      'AUTHENTICATION_FAILED': 'Card authentication failed. Please verify your card details.',
      'TRANSACTION_TIMEOUT': 'Transaction timed out. Please try again.',
      'INVALID_CVV': 'Invalid CVV number. Please check and try again.',
      'CARD_BLOCKED': 'Your card is blocked. Please contact your bank.',
      'NETWORK_ERROR': 'Network error occurred. Please check your internet connection and try again.',
    };
    
    return errorMappings[errorCode] || errorDescription || 'Payment failed due to technical issues. Please try again or contact support.';
  };

  // Handle payment failure
  const handlePaymentFailure = async (orderId: string, failureReason: string) => {
    try {
      // Get the selected address details
      const selectedAddressDetails = state.userData?.addresses.find(
        (address) => address._id === state.selectedAddress
      );

      if (!selectedAddressDetails) {
        console.error("Selected address not found for payment failure email");
        return;
      }

      // Prepare email data for payment failure
      const emailData = {
        orderId,
        items: state.checkoutData?.items || [],
        subtotal: state.checkoutData?.subtotal || 0,
        deliveryCharges: state.checkoutData?.deliveryCharges || 0,
        discountAmount: state.checkoutData?.discountAmount || 0,
        rewardDiscountAmount: state.rewardDiscountAmount || 0,
        pointsRedeemed: state.pointsToRedeem || 0,
        total: state.checkoutData?.total || 0,
        paymentOption: state.paymentOption,
        createdAt: new Date().toISOString(),
        address: selectedAddressDetails,
        userName: state.userData?.name || "",
        userEmail: state.userData?.email || "",
        paymentFailureReason: failureReason,
      };

      try {
        // Send payment failure email
        await fetch("/api/payment-failure-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailData),
        });
        console.log("Payment failure email sent successfully");
      } catch (emailError) {
        console.error(
          "Failed to send payment failure email:",
          emailError
        );
        // Don't block the process if email fails
      }
    } catch (error) {
      console.error("Error handling payment failure:", error);
    }
  };

  // Handle successful Razorpay payment
  const handleRazorpaySuccess = async (
    response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
    orderId: string
  ) => {
    try {
      console.log("Processing Razorpay payment success for order:", orderId);
      console.log("Payment response:", {
        payment_id: response.razorpay_payment_id,
        order_id: response.razorpay_order_id,
      });

      // Verify payment
      const verifyResponse = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          orderId: orderId,
        }),
      });

      const verifyData = await verifyResponse.json();
      console.log("Payment verification result:", verifyData);

      if (!verifyData.success) {
        // Payment verification failed, send failure email
        await handlePaymentFailure(orderId, verifyData.error || "Payment verification failed");
        throw new Error(verifyData.error || "Payment verification failed");
      }

      // Payment verified successfully, update the order to confirmed
      console.log(
        "Payment verified successfully, updating order in database..."
      );
      await createOrderWithPayment(orderId, {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        payment_status: "paid",
        payment_method: verifyData.data?.method || "card",
        payment_amount: verifyData.data?.amount || 0,
        verified_at: verifyData.data?.verifiedAt,
      }, "confirmed", "paid");
    } catch (error) {
      console.error("Payment verification error:", error);
      dispatch({ type: "SET_SUBMITTING", payload: false });
      toast.error("Payment Verification Failed", {
        description:
          error instanceof Error
            ? error.message
            : "Payment could not be verified",
        duration: 5000,
      });
    }
  };

  // Track created orders to avoid duplicate creation
  const [createdOrders, setCreatedOrders] = useState<Set<string>>(new Set());

  // Create order with payment information
  const createOrderWithPayment = async (
    orderId: string, 
    paymentInfo?: any, 
    orderStatus: string = "confirmed",
    paymentStatus: "pending" | "paid" | "failed" | "refunded" = "pending"
  ) => {
    const isUpdate = createdOrders.has(orderId);
    let endpoint = "/api/order";
    let method = "POST";
    
    const orderPayload = {
      orderId,
      status: orderStatus,
      userId: state.userData!._id,
      items: state.checkoutData!.items,
      subtotal: state.checkoutData!.subtotal,
      deliveryCharges: state.checkoutData!.deliveryCharges,
      discountAmount: state.checkoutData!.discountAmount || 0,
      discountCode: state.checkoutData!.discountCode || "",
      rewardDiscountAmount: state.rewardDiscountAmount || 0,
      pointsRedeemed: state.pointsToRedeem || 0,
      total: state.checkoutData!.total,
      addressId: state.selectedAddress,
      paymentOption: state.paymentOption,
      paymentStatus: paymentStatus,
      paymentInfo: paymentInfo || null,
    };

    if (isUpdate) {
      // If order already exists, use update endpoint
      endpoint = `/api/order/update/${orderId}`;
      method = "PATCH";
    } else {
      // Mark this order as created
      setCreatedOrders(prev => new Set(prev).add(orderId));
    }

    fetch(endpoint, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    })
      .then((response) => response.json())
      .then(async (data) => {
        if (data.success) {
          // Get the selected address details
          const selectedAddressDetails = state.userData?.addresses.find(
            (address) => address._id === state.selectedAddress
          );

          if (!selectedAddressDetails) {
            throw new Error("Selected address not found");
          }

          // Prepare email data
          const emailData = {
            orderId,
            items: state.checkoutData?.items,
            subtotal: state.checkoutData?.subtotal,
            deliveryCharges: state.checkoutData?.deliveryCharges,
            discountAmount: state.checkoutData?.discountAmount || 0,
            rewardDiscountAmount: state.rewardDiscountAmount || 0,
            pointsRedeemed: state.pointsToRedeem || 0,
            total: state.checkoutData?.total,
            paymentOption: state.paymentOption,
            createdAt: new Date().toISOString(),
            address: selectedAddressDetails,
            userName: state.userData?.name,
            userEmail: state.userData?.email,
          };

          // Send confirmation email only for confirmed orders
          if (orderStatus === "confirmed") {
            try {
              // Send order confirmation email
              await fetch("/api/order-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(emailData),
              });
              console.log("Order confirmation email sent successfully");
            } catch (emailError) {
              console.error(
                "Failed to send order confirmation email:",
                emailError
              );
              // Don't block the order confirmation process if email fails
            }
          }

          // Only clear cart and proceed if payment is successful or COD
          const shouldClearCart = 
            orderStatus === "confirmed" || 
            (state.paymentOption === "cash-on-delivery" && orderStatus === "confirmed");

          if (shouldClearCart) {
            // Continue with order confirmation process
            sessionStorage.removeItem("checkoutData");
            try {
              // Clear cart using the centralized context (this will clear both server and client state)
              await clearCart();
            } catch (e) {
              console.error("Failed to clear cart after order", e);
            }
            dispatch({ type: "SET_CONFIRMED_ORDER_ID", payload: orderId });
            dispatch({ type: "SET_CONFIRMATION_OPEN", payload: true });
            toast.success("Success", {
              description: "Order Confirmed",
              duration: 5000,
            });
          } else {
            // Order created but payment pending - don't clear cart
            dispatch({ type: "SET_SUBMITTING", payload: false });
            console.log("Order created with unconfirmed status - cart preserved");
          }
        } else {
          // Handle specific error cases
          const errorMessage = data.error || "Failed to process order";
          const isRetryableError = errorMessage.includes("technical issue") || 
                                 errorMessage.includes("try again");
          
          if (isRetryableError) {
            toast.error("Order Processing Issue", {
              description: "There was a technical issue. Please try placing your order again.",
              duration: 7000,
            });
          } else {
            toast.error("Order processing failed", {
              description: errorMessage,
              duration: 5000,
            });
          }
        }
      })
      .catch((error) => {
        console.error("Error processing order:", error);
        toast.error("Oops!", {
          description: "Something went wrong. Please try again.",
          duration: 5000,
        });
      })
      .finally(() => {
        dispatch({ type: "SET_SUBMITTING", payload: false });
      });
  };

  // Confirm the order
  const confirmOrder = () => {
    if (!state.selectedAddress || !state.checkoutData || !state.userData) {
      toast.error("Oops!", {
        description: "Please select a delivery address",
        duration: 5000,
      });
      return;
    }

    dispatch({ type: "SET_SUBMITTING", payload: true });

    // Handle payment based on selected option
    if (state.paymentOption === "razorpay") {
      // For Razorpay, generate order ID and initialize payment
      // Order will be created only after successful payment
      const orderId = generateOrderId();
      initializeRazorpayPayment(orderId, state.checkoutData.total);
    } else {
      // For COD, create order immediately
      const orderId = generateOrderId();
      createOrderWithPayment(orderId);
    }
  };

  // Toggle accordion sections (e.g., delivery address, order summary)
  const toggleSection = (section: string) => {
    dispatch({
      type: "SET_EXPANDED_SECTION",
      payload: state.expandedSection === section ? null : section,
    });
  };

  const getReferralDiscountDetails = () => {
    return {
      referralDiscount,
      referralDiscountType,
      referralCode,
    };
  };

  return {
    state,
    dispatch,
    updateCheckoutData,
    updateQuantity,
    removeItem,
    handleApplyDiscount,
    handleRedeemRewardPoints,
    confirmOrder,
    toggleSection,
    getReferralDiscountDetails,
  };
}
