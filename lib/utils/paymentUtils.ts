/**
 * Format payment amount in Indian Rupees with proper formatting
 */
export function formatPaymentAmount(amount: number | undefined): string {
  if (!amount && amount !== 0) return "₹0.00";

  // Format with Indian number system (lakhs, crores) for larger amounts
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Format payment date for Indian timezone and locale
 */
export function formatPaymentDate(dateString: string | undefined): string {
  if (!dateString) return "--";

  try {
    const date = new Date(dateString);

    // Format for Indian locale with IST timezone
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata", // Indian Standard Time
    }).format(date);
  } catch (error) {
    console.error("Error formatting payment date:", error);
    return "--";
  }
}

/**
 * Get payment status badge styling
 */
export function getPaymentStatusBadge(status: string | undefined): {
  className: string;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  const normalizedStatus = (status || "").toLowerCase();

  switch (normalizedStatus) {
    case "paid":
    case "captured":
    case "success":
      return {
        className: "bg-green-100 text-green-800 border-green-200",
        label: "✓ Paid",
        variant: "default",
      };
    case "pending":
    case "created":
    case "authorized":
      return {
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "⏳ Pending",
        variant: "default",
      };
    case "failed":
    case "error":
      return {
        className: "bg-red-100 text-red-800 border-red-200",
        label: "✗ Failed",
        variant: "destructive",
      };
    case "refunded":
    case "refund":
      return {
        className: "bg-blue-100 text-blue-800 border-blue-200",
        label: "↩ Refunded",
        variant: "secondary",
      };
    case "cancelled":
    case "canceled":
      return {
        className: "bg-gray-100 text-gray-800 border-gray-200",
        label: "⊘ Cancelled",
        variant: "outline",
      };
    default:
      return {
        className: "bg-gray-100 text-gray-800 border-gray-200",
        label: status || "❓ Unknown",
        variant: "outline",
      };
  }
}

/**
 * Format payment method with Indian payment system names
 */
export function formatPaymentMethod(method: string | undefined): string {
  if (!method) return "N/A";

  const methodMappings: { [key: string]: string } = {
    card: "Credit/Debit Card",
    netbanking: "Net Banking",
    wallet: "Digital Wallet",
    upi: "UPI Payment",
    emi: "EMI",
    paylater: "Pay Later",
    razorpay: "Online Payment",
    "cash-on-delivery": "Cash on Delivery",
    cod: "Cash on Delivery (COD)",
    // Additional Indian payment methods
    paytm: "Paytm Wallet",
    phonepe: "PhonePe",
    googlepay: "Google Pay",
    amazonpay: "Amazon Pay",
    mobikwik: "MobiKwik",
    freecharge: "FreeCharge",
    airtel: "Airtel Money",
    jio: "JioMoney",
  };

  return methodMappings[method.toLowerCase()] || method;
}

/**
 * Get payment method icon for Indian payment systems
 */
export function getPaymentMethodIcon(method: string | undefined): string {
  if (!method) return "💳";

  const iconMappings: { [key: string]: string } = {
    card: "💳",
    netbanking: "🏦",
    wallet: "👛",
    upi: "📱",
    emi: "📅",
    paylater: "⏰",
    razorpay: "⚡",
    "cash-on-delivery": "💵",
    cod: "💵",
    // Indian payment method icons
    paytm: "🔵", // Paytm blue
    phonepe: "🟣", // PhonePe purple
    googlepay: "🔴", // Google Pay colors
    amazonpay: "🟠", // Amazon orange
    mobikwik: "🟡", // MobiKwik yellow
    freecharge: "🟢", // FreeCharge green
    airtel: "🔴", // Airtel red
    jio: "🔵", // Jio blue
  };

  return iconMappings[method.toLowerCase()] || "💳";
}

/**
 * Generate payment reference/receipt ID for Indian transactions
 */
export function formatPaymentReference(
  razorpayPaymentId?: string,
  razorpayOrderId?: string,
  orderId?: string
): string {
  if (razorpayPaymentId) {
    return `TXN${razorpayPaymentId.slice(-8).toUpperCase()}`;
  }
  if (razorpayOrderId) {
    return `ORDER${razorpayOrderId.slice(-8).toUpperCase()}`;
  }
  if (orderId) {
    return `GS${orderId.slice(-8).toUpperCase()}`; // GS = Gujarat Store
  }
  return "N/A";
}

/**
 * Calculate payment processing time (useful for analytics)
 */
export function calculatePaymentProcessingTime(
  createdAt: string,
  verifiedAt?: string
): string {
  if (!verifiedAt) return "N/A";

  try {
    const created = new Date(createdAt);
    const verified = new Date(verifiedAt);
    const diffInSeconds = Math.abs(
      (verified.getTime() - created.getTime()) / 1000
    );

    if (diffInSeconds < 60) {
      return `${Math.round(diffInSeconds)}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.round(diffInSeconds / 60)}m`;
    } else {
      return `${Math.round(diffInSeconds / 3600)}h`;
    }
  } catch (error) {
    console.error("Error calculating processing time:", error);
    return "N/A";
  }
}

/**
 * Mask sensitive payment information
 */
export function maskPaymentId(paymentId: string | undefined): string {
  if (!paymentId) return "N/A";

  if (paymentId.length <= 8) return paymentId;

  const visibleStart = paymentId.slice(0, 4);
  const visibleEnd = paymentId.slice(-4);
  const maskedMiddle = "*".repeat(Math.min(paymentId.length - 8, 8));

  return `${visibleStart}${maskedMiddle}${visibleEnd}`;
}

/**
 * Get payment timeline status for order tracking
 */
export function getPaymentTimeline(order: IOrder): Array<{
  status: string;
  timestamp: string;
  description: string;
  isCompleted: boolean;
}> {
  const timeline = [];

  // Order created
  timeline.push({
    status: "Order Created",
    timestamp: order.createdAt,
    description: "Order has been placed successfully",
    isCompleted: true,
  });

  // Payment initiated
  if (order.paymentInfo?.razorpay_order_id) {
    timeline.push({
      status: "Payment Initiated",
      timestamp: order.createdAt,
      description: "Payment process started",
      isCompleted: true,
    });
  }

  // Payment completed
  if (order.paymentStatus === "paid" && order.paymentInfo?.verified_at) {
    timeline.push({
      status: "Payment Completed",
      timestamp: order.paymentInfo.verified_at,
      description: "Payment has been verified and captured",
      isCompleted: true,
    });
  }

  // Payment failed
  if (order.paymentStatus === "failed") {
    timeline.push({
      status: "Payment Failed",
      timestamp: order.updatedAt,
      description: "Payment could not be processed",
      isCompleted: false,
    });
  }

  return timeline;
}
