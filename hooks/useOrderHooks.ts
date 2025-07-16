// useOrderHooks.ts
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Base fetch function to reduce code duplication
const fetchData = async (url: string, options = {}) => {
  const defaultOptions = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    throw new Error(`API call failed with status: ${response.status}`);
  }

  return await response.json();
};

// Hook for fetching an order by ID
export const useOrder = (orderId: string) => {
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetchData(`/api/order/byId/${orderId}`, {
        method: "GET",
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch order details");
      }

      setOrder(response.order);
      return response.order;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch order details";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!orderId) return null;

    try {
      const response = await fetchData(`/api/order/byId/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to update order status");
      }

      // Refresh order data
      await fetchOrder();

      toast({
        title: "Success",
        description: "Order status updated successfully!",
        variant: "default",
      });

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update order status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  return {
    order,
    loading,
    error,
    fetchOrder,
    updateStatus,
  };
};

// Hook for fetching shipping address
export const useShippingAddress = (addressId?: string) => {
  const [address, setAddress] = useState<IAddress | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddress = async (id?: string) => {
    const addressToFetch = id || addressId;
    if (!addressToFetch) return null;

    try {
      setLoading(true);
      setError(null);
      const response = await fetchData(`/api/address/${addressToFetch}`, {
        method: "GET",
      });

      if (response && response.success) {
        setAddress(response.address);
        return response.address;
      }
      return null;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch shipping address";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (addressId) {
      fetchAddress();
    }
  }, [addressId]);

  return {
    address,
    loading,
    error,
    fetchAddress,
  };
};

// Hook for fetching user details
export const useUserDetails = (
  userId?: string,
  options: { admin?: boolean; vendor?: boolean } = {}
) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async (id?: string) => {
    const userToFetch = id || userId;
    if (!userToFetch) return null;

    try {
      setLoading(true);
      setError(null);
      const url = options.admin
        ? `/api/admin/user/${userToFetch}`
        : `/api/user/${userToFetch}`;
      const response = await fetchData(url, {
        method: "GET",
      });

      if (response && response.success) {
        setUser(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch user details";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  return {
    user,
    loading,
    error,
    fetchUser,
  };
};

// Hook for fetching vendor store details
export const useVendorStoreDetails = (vendorId: string) => {
  const [vendor, setVendor] = useState<{ storeName: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await fetch(`/api/vendor/${vendorId}`);
        const data = await response.json();
        if (data.success) {
          setVendor(data.data);
        }
      } catch (error) {
        console.error("Error fetching vendor:", error);
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchVendor();
    }
  }, [vendorId]);

  return { vendor, loading };
};
