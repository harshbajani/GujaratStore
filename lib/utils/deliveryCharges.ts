/**
 * Delivery charge calculation utilities
 */

// Free delivery threshold amount in INR
export const FREE_DELIVERY_THRESHOLD = 1500;

/**
 * Calculate delivery charges based on subtotal and individual item delivery charges
 * @param subtotal - Total amount before delivery charges
 * @param originalDeliveryCharges - Sum of individual item delivery charges
 * @returns Final delivery charges (0 if subtotal >= threshold, original charges otherwise)
 */
export const calculateDeliveryCharges = (
  subtotal: number,
  originalDeliveryCharges: number
): number => {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    return 0; // Free delivery
  }
  return originalDeliveryCharges;
};

/**
 * Check if order qualifies for free delivery
 * @param subtotal - Total amount before delivery charges
 * @returns boolean indicating if free delivery applies
 */
export const qualifiesForFreeDelivery = (subtotal: number): boolean => {
  return subtotal >= FREE_DELIVERY_THRESHOLD;
};

/**
 * Calculate how much more is needed for free delivery
 * @param subtotal - Current subtotal amount
 * @returns Amount needed to qualify for free delivery (0 if already qualified)
 */
export const amountNeededForFreeDelivery = (subtotal: number): number => {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    return 0;
  }
  return FREE_DELIVERY_THRESHOLD - subtotal;
};

/**
 * Format currency for display
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get delivery status info for UI display
 * @param subtotal - Current subtotal
 * @param originalDeliveryCharges - Original delivery charges
 * @returns Object with delivery status information
 */
export const getDeliveryStatusInfo = (
  subtotal: number,
  originalDeliveryCharges: number
) => {
  const isFree = qualifiesForFreeDelivery(subtotal);
  const amountNeeded = amountNeededForFreeDelivery(subtotal);
  const finalDeliveryCharges = calculateDeliveryCharges(subtotal, originalDeliveryCharges);

  return {
    isFree,
    amountNeeded,
    finalDeliveryCharges,
    originalDeliveryCharges,
    threshold: FREE_DELIVERY_THRESHOLD,
    message: isFree 
      ? `🎉 You qualify for FREE delivery!` 
      : `Add ${formatCurrency(amountNeeded)} more for FREE delivery!`,
  };
};
