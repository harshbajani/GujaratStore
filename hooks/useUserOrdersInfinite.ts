/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, useEffect } from "react";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { getCurrentUser } from "@/lib/actions/user.actions";

interface OrderItem {
  _id: string;
  productId: string;
  productName: string;
  coverImage: string;
  price: number;
  quantity: number;
  deliveryDate: string;
  selectedSize?: string;
}

interface Order {
  _id: string;
  orderId: string;
  status:
    | "confirmed"
    | "processing"
    | "ready to ship"
    | "delivered"
    | "cancelled"
    | "returned";
  items: OrderItem[];
  subtotal: number;
  deliveryCharges: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  addressId: string;
  paymentOption: string;
  paymentStatus?: string;
  refundInfo?: any;
}

interface UseUserOrdersInfiniteProps {
  initialLimit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const useUserOrdersInfinite = ({
  initialLimit = 10,
  searchTerm = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}: UseUserOrdersInfiniteProps = {}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  // Fetch user data to get userId
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setUserLoading(true);
        setUserError(null);
        const userResponse = await getCurrentUser();

        if (!userResponse.success || !userResponse.data) {
          throw new Error(userResponse.message || "Failed to fetch user data");
        }

        setUserId(userResponse.data._id);
      } catch (error) {
        console.error("Error fetching user:", error);
        setUserError(
          error instanceof Error ? error.message : "Failed to fetch user data"
        );
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch function for infinite scroll
  const fetchOrders = useCallback(
    async (page: number): Promise<PaginatedResponse<Order>> => {
      if (!userId) {
        return {
          success: false,
          error: "User ID not available",
        };
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: initialLimit.toString(),
        search: searchTerm,
        sortBy,
        sortOrder,
      });

      try {
        const response = await fetch(
          `/api/user/order/${userId}?${params.toString()}`
        );
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch orders");
        }

        return data;
      } catch (error) {
        console.error("Error fetching orders:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch orders",
        };
      }
    },
    [userId, initialLimit, searchTerm, sortBy, sortOrder]
  );

  const {
    data: orders,
    isLoading,
    isLoadingMore,
    error: fetchError,
    hasNextPage,
    refresh,
    ref: loadMoreRef,
  } = useInfiniteScroll<Order>({
    fetchFunction: fetchOrders,
    enabled: !!userId && !userLoading,
    threshold: 0.1,
    rootMargin: "100px",
  });

  // Refresh when search term or sort changes
  useEffect(() => {
    if (userId && !userLoading) {
      refresh();
    }
  }, [searchTerm, sortBy, sortOrder, userId, userLoading, refresh]);

  // Update order in the list (useful for status updates like cancellation)
  const updateOrderInList = useCallback(
    (orderId: string, updates: Partial<Order>) => {
      // This would need to be implemented in the useInfiniteScroll hook
      // For now, we'll rely on refresh() after updates
      refresh();
    },
    [refresh]
  );

  // Overall loading state (user loading or orders loading)
  const overallLoading = userLoading || (isLoading && orders.length === 0);

  // Overall error state
  const overallError = userError || fetchError;

  return {
    // Data
    orders,
    isLoading: overallLoading,
    isLoadingMore,
    error: overallError,
    hasNextPage,

    // User info
    userId,
    userLoading,
    userError,

    // Actions
    refresh,
    updateOrderInList,

    // Infinite scroll
    loadMoreRef,
  };
};
