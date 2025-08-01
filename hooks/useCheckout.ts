import { useReducer, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { generateOrderId } from "@/lib/utils";
import { useSession } from "next-auth/react";

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
  expandedSection: null,
  paymentOption: "cash-on-delivery",
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
        toast({
          title: "Error",
          description: "Failed to load checkout data",
          variant: "destructive",
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
      if (session) {
        // Remove item from authenticated user's cart
        const response = await fetch("/api/user/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to remove item from cart");
        }
      }

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

      toast({
        title: "Item removed",
        description: "Item has been removed from your order",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  // Apply a discount code
  const handleApplyDiscount = async () => {
    if (!state.discountCode || !state.checkoutData) return;

    // Prevent reapplying the same discount
    if (state.discountCode === state.appliedDiscountCode) {
      toast({
        title: "Warning",
        description: "This discount code is already applied",
        variant: "destructive",
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
        toast({
          title: "Success",
          description: result.message,
          className: "bg-green-500 text-white",
        });
      } else {
        dispatch({ type: "SET_DISCOUNT_INFO", payload: "" });
        dispatch({ type: "SET_DISCOUNT_AMOUNT", payload: 0 });
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
      dispatch({ type: "SET_LOADING_DISCOUNT", payload: false });
    }
  };

  // Redeem reward points
  const handleRedeemRewardPoints = async () => {
    if (!state.userData || !state.checkoutData || state.pointsToRedeem <= 0)
      return;

    // Validate points to redeem
    if (state.pointsToRedeem > (state.userData.rewardPoints || 0)) {
      toast({
        title: "Warning",
        description: "You don't have enough reward points",
        variant: "destructive",
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

        toast({
          title: "Success",
          description: `Redeemed ${state.pointsToRedeem} points for ₹${result.data.discountAmount} discount`,
          className: "bg-green-500 text-white",
        });
      } else {
        toast({
          title: "Redemption Failed",
          description: result.error || "Failed to redeem reward points",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error redeeming reward points:", error);
      toast({
        title: "Error",
        description: "Failed to redeem reward points",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_LOADING_REWARD_REDEMPTION", payload: false });
    }
  };

  // Confirm the order
  const confirmOrder = () => {
    if (!state.selectedAddress || !state.checkoutData || !state.userData) {
      toast({
        title: "Error",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    dispatch({ type: "SET_SUBMITTING", payload: true });
    const orderId = generateOrderId();

    const orderPayload = {
      orderId,
      status: "confirmed",
      userId: state.userData._id,
      items: state.checkoutData.items,
      subtotal: state.checkoutData.subtotal,
      deliveryCharges: state.checkoutData.deliveryCharges,
      discountAmount: state.checkoutData.discountAmount || 0,
      discountCode: state.checkoutData.discountCode || "",
      rewardDiscountAmount: state.rewardDiscountAmount || 0,
      pointsRedeemed: state.pointsToRedeem || 0,
      total: state.checkoutData.total,
      addressId: state.selectedAddress,
      paymentOption: state.paymentOption,
    };

    fetch("/api/order", {
      method: "POST",
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

          // Continue with order confirmation process
          sessionStorage.removeItem("checkoutData");
          dispatch({ type: "SET_CONFIRMED_ORDER_ID", payload: orderId });
          dispatch({ type: "SET_CONFIRMATION_OPEN", payload: true });
          toast({
            title: "Success",
            description: "Order Confirmed",
            className: "bg-green-500 text-white",
          });
        } else {
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
        dispatch({ type: "SET_SUBMITTING", payload: false });
      });
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
