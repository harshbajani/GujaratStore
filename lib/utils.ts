import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const parseStringify = (value: unknown) =>
  JSON.parse(JSON.stringify(value));

export const generateOrderId = () => {
  // Generates a random 6-digit number
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `TGS${randomDigits}`;
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
    address_line_1: data.address.address_line_1,
    address_line_2: data.address.address_line_2,
    locality: data.address.locality,
    pincode: data.address.pincode,
    state: data.address.state,
    landmark: data.address.landmark,
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
      address_line_2: store.addresses.address_line_2,
      locality: store.addresses.locality,
      pincode: store.addresses.pincode,
      state: store.addresses.state,
      landmark: store.addresses.landmark,
    },
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

export const updateOrderStatus = async (id: string, status: string) => {
  try {
    const response = await fetch(`/api/order/byId/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
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
