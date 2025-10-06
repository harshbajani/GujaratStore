/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const parseStringify = (value: unknown) =>
  JSON.parse(JSON.stringify(value));

export const generateOrderId = () => {
  // Generate a more unique ID using timestamp + random
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  return `TGS${timestamp}${randomDigits}`;
};

// Alternative function for even more uniqueness (UUID-like)
export const generateUniqueOrderId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TGS";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format date helper
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Add or update this function in your utils.ts file
export function getAverageRating(distribution: Record<number, number>): number {
  const totalReviews = Object.values(distribution).reduce(
    (acc, val) => acc + val,
    0
  );
  if (totalReviews === 0) return 0;

  const weightedSum = Object.entries(distribution).reduce(
    (acc, [rating, count]) => acc + parseInt(rating) * count,
    0
  );
  return weightedSum / totalReviews;
}

export const toSchemaFormat = (data: StoreData) => ({
  storeName: data.storeName,
  contact: data.contact,
  addresses: {
    address_line_1: data.address.address_line_1?.trim(),
    address_line_2: data.address.address_line_2?.trim(), // area/locality
    city:
      (data as any).address.city?.trim() || data.address.address_line_2?.trim(),
    locality:
      data.address.locality?.trim() || data.address.address_line_2?.trim(),
    pincode: data.address.pincode?.trim(),
    state: data.address.state?.trim(),
    landmark: data.address.landmark?.trim(),
  },
  alternativeContact: data.alternativeContact,
});

// Helper function to convert from MongoDB schema to IStore interface
export const toInterfaceFormat = (store: {
  _id?: string;
  storeName: string;
  contact: string;
  addresses: {
    address_line_1: string;
    address_line_2: string;
    locality: string;
    pincode: string;
    city?: string;
    state: string;
    landmark?: string;
  };
  alternativeContact?: string;
}): IStore | null => {
  if (!store) return null;

  return {
    _id: store._id,
    storeName: store.storeName,
    contact: store.contact,
    address: {
      address_line_1: store.addresses.address_line_1,
      address_line_2: store.addresses.address_line_2 || store.addresses.city, // keep UI compatibility
      locality:
        store.addresses.locality ||
        store.addresses.address_line_2 ||
        store.addresses.city,
      pincode: store.addresses.pincode,
      state: store.addresses.state,
      landmark: store.addresses.landmark,
      // expose city if present for potential future UI updates
      ...((store.addresses as any).city
        ? { city: (store.addresses as any).city }
        : {}),
    } as any,
    alternativeContact: store.alternativeContact || "",
  };
};

export const getProductRating = (product: IProductResponse): number => {
  // Check if productReviews exists and is an array with at least one item
  if (
    Array.isArray(product.productReviews) &&
    product.productReviews.length > 0
  ) {
    // Return the rating from the first review
    return product.productReviews[0].rating;
  }
  // If there's no rating or the structure doesn't match, return 0
  return 0;
};

export const getOrderById = async (id: string) => {
  try {
    const response = await fetch(`/api/order/byId/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch order details");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw error;
  }
};

export const updateOrderStatus = async (
  id: string,
  status: string,
  additionalData?: {
    cancellationReason?: string;
    isAdminCancellation?: boolean;
    isVendorCancellation?: boolean;
  }
) => {
  try {
    const requestBody = {
      status,
      ...additionalData, // Spread additional data like cancellationReason, isAdminCancellation, etc.
    };

    const response = await fetch(`/api/order/byId/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error("Failed to update order status");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

export const getShippingAddress = async (addressId: string) => {
  try {
    const response = await fetch(`/api/address/${addressId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch shipping address");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching shipping address:", error);
    return null;
  }
};

export const getUserDetails = async (userId: string) => {
  try {
    const response = await fetch(`/api/user/${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user details");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
};

// Format price in Indian Rupees
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Other utility functions can be added here as needed
export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "ready to ship":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "returned":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusBadge = (status: string) => {
  let badgeClass = "";
  switch (status.toLowerCase()) {
    case "confirmed":
      badgeClass = "bg-blue-100 text-blue-800";
      break;
    case "processing":
      badgeClass = "bg-yellow-100 text-yellow-800";
      break;
    case "ready to ship":
      badgeClass = "bg-purple-100 text-purple-800";
      break;
    case "delivered":
      badgeClass = "bg-green-100 text-green-800";
      break;
    case "cancelled":
      badgeClass = "bg-red-100 text-red-800";
      break;
    default:
      badgeClass = "bg-gray-100 text-gray-800";
  }
  return badgeClass;
};

export const getShippingStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "shipped":
    case "pickup scheduled":
      return "bg-blue-100 text-blue-800";
    case "in transit":
    case "in_transit":
      return "bg-purple-100 text-purple-800";
    case "out for delivery":
    case "out_for_delivery":
      return "bg-orange-100 text-orange-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
    case "rto":
    case "returned":
      return "bg-red-100 text-red-800";
    case "not shipped":
    default:
      return "bg-gray-100 text-gray-800";
  }
};
