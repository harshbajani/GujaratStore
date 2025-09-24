"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { cleanupUserOrders } from "@/lib/actions/cleanup.actions";
import { useToast } from "@/hooks/use-toast";
import OrderDetails from "./OrderDetails";
import Link from "next/link";
import { getStatusColor } from "@/lib/utils";

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
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showCleanupButton, setShowCleanupButton] = useState(false);
  const { toast } = useToast();

  const getImageUrl = (imageId: string | File) => `/api/files/${imageId}`;

  // Reusable function to sort orders by creation date (latest first)
  const sortOrdersByDate = (orders: Order[]) => {
    return orders.sort((a, b) => {
      try {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);

        // Handle invalid dates by putting them at the end
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;

        return dateB.getTime() - dateA.getTime(); // Latest first (descending order)
      } catch (error) {
        console.warn("Error sorting orders by date:", error);
        return 0; // Keep original order if sorting fails
      }
    });
  };

  const handleCleanupOrders = async () => {
    try {
      setIsCleaningUp(true);
      const result = await cleanupUserOrders();

      if (result.success) {
        // Show detailed result information
        const removedCount = result.data?.removedCount || 0;
        const remainingCount = result.data?.remainingCount || 0;

        toast({
          title: "Cleanup Complete",
          description:
            removedCount > 0
              ? `Removed ${removedCount} invalid order reference${
                  removedCount > 1 ? "s" : ""
                }. ${remainingCount} valid orders remain.`
              : "No invalid order references found. All orders are valid.",
          duration: 6000,
        });

        // Refresh orders list after cleanup
        const fetchOrders = async () => {
          try {
            setIsLoading(true);
            const userResponse = await getCurrentUser();
            if (!userResponse.success || !userResponse.data) {
              throw new Error(
                userResponse.message || "Failed to fetch user data"
              );
            }
            const orderIds = userResponse.data.order || [];
            if (orderIds.length === 0) {
              setOrders([]);
              setIsLoading(false);
              setShowCleanupButton(false);
              return;
            }
            // Fetch orders again after cleanup
            const orderDetailsPromises = orderIds.map(async (orderId) => {
              try {
                const response = await fetch(`/api/order/byId/${orderId}`);
                const data = await response.json();
                if (!data.success) {
                  return null;
                }
                return data.order;
              } catch {
                return null;
              }
            });
            const orderResponses = await Promise.all(orderDetailsPromises);
            const ordersData = orderResponses.filter((order) => order !== null);

            // Sort orders by creation date (latest first)
            const sortedOrdersData = sortOrdersByDate(ordersData);

            setOrders(sortedOrdersData);

            // Only hide cleanup button if we actually removed invalid references
            // If no cleanup was needed, keep showing the button in case user wants to try again later
            if (removedCount > 0) {
              setShowCleanupButton(false);
            }
          } catch (error) {
            console.error("Error refreshing orders after cleanup:", error);
          } finally {
            setIsLoading(false);
          }
        };

        await fetchOrders();
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to cleanup orders:", error);
      toast({
        title: "Error",
        description: "Failed to cleanup order references",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancellingOrderId(orderId);
      const order = orders.find((o) => o._id === orderId);

      if (!order) {
        toast({
          title: "Error",
          description: "Order not found",
          variant: "destructive",
        });
        return;
      }

      // Check if order can be cancelled based on status
      // Users cannot cancel orders once they are "ready to ship" or in later stages
      const nonCancellableStatuses = [
        "ready to ship",
        "delivered",
        "cancelled",
        "returned",
      ];
      if (nonCancellableStatuses.includes(order.status)) {
        const statusMessages = {
          "ready to ship":
            "Orders that are ready to ship cannot be cancelled. The vendor has already prepared your order for shipping. Please contact support if you need assistance.",
          delivered:
            "Orders that have been delivered cannot be cancelled. You can return the order instead.",
          cancelled: "This order is already cancelled.",
          returned: "This order has already been returned.",
        };

        toast({
          title: "Cannot Cancel Order",
          description:
            statusMessages[order.status as keyof typeof statusMessages] ||
            "This order cannot be cancelled.",
          variant: "destructive",
        });
        return;
      }

      // Use the new user-specific cancellation API route that handles both status update and refund processing
      const response = await fetch(`/api/user/order/cancel/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "Order cancelled by customer from profile",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to cancel order");
      }

      // Update local state and maintain sort order
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map((o) =>
          o._id === orderId ? { ...o, status: "cancelled" as const } : o
        );

        // Re-sort to maintain latest first order
        return sortOrdersByDate(updatedOrders);
      });

      toast({
        title: "Order Cancelled Successfully",
        description: data.message || "Order has been cancelled successfully.",
        duration: 8000, // Show longer to read refund message
      });
    } catch (error) {
      console.error("Failed to cancel order", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);

        // First get the current user to get their order IDs
        const userResponse = await getCurrentUser();

        if (!userResponse.success || !userResponse.data) {
          throw new Error(userResponse.message || "Failed to fetch user data");
        }

        const orderIds = userResponse.data.order || [];

        if (orderIds.length === 0) {
          setOrders([]);
          setIsLoading(false);
          return;
        }

        // Fetch details for each order using the new route
        const orderDetailsPromises = orderIds.map(async (orderId) => {
          try {
            // Use the new API route specifically for MongoDB ObjectIds
            const response = await fetch(`/api/order/byId/${orderId}`);
            const data = await response.json();

            if (!data.success) {
              console.warn(
                `Order ${orderId} not found in database, skipping...`
              );
              return null; // Return null for missing orders instead of throwing
            }

            return data.order;
          } catch (error) {
            console.warn(`Failed to fetch order ${orderId}:`, error);
            return null; // Return null for failed requests instead of throwing
          }
        });

        const orderResponses = await Promise.all(orderDetailsPromises);
        // Filter out null values (missing/deleted orders) and keep only valid orders
        const ordersData = orderResponses.filter((order) => order !== null);

        // Sort orders by creation date (latest first)
        const sortedOrdersData = sortOrdersByDate(ordersData);

        // Count missing orders for user notification
        const missingOrdersCount = orderResponses.length - ordersData.length;

        if (missingOrdersCount > 0) {
          setShowCleanupButton(true);
          toast({
            title: "Some Order References Invalid",
            description: `${missingOrdersCount} order reference${
              missingOrdersCount > 1 ? "s" : ""
            } point to orders that no longer exist. Use 'Clean Up Order Refs' to remove invalid references from your profile. Note: This only cleans up references, it doesn't change actual order statuses.`,
            variant: "default",
            duration: 8000, // Show longer since it's informational
          });
        }

        setOrders(sortedOrdersData);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to fetch orders",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedOrderId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
        <p className="text-muted-foreground mb-6">
          You haven&apos;t placed any orders yet.
        </p>
        <Button
          variant="default"
          asChild
          className="bg-brand hover:bg-brand/90"
        >
          <Link prefetch href="/shop">
            Start Shopping
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[440px] sm:max-h-[430px] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">My Orders</h2>
        {showCleanupButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanupOrders}
            disabled={isCleaningUp}
            className="text-xs"
            title="Remove references to orders that no longer exist in the database"
          >
            {isCleaningUp ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Cleaning...
              </>
            ) : (
              "Clean Up Order Refs"
            )}
          </Button>
        )}
      </div>

      {orders.map((order) => {
        const displayStatus = order.status;

        return (
          <Card key={order._id} className="overflow-hidden">
            <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
              <div>
                <p className="text-sm text-muted-foreground">
                  Order placed: {formatDate(order.createdAt)}
                </p>
                <p className="font-medium">Order #{order.orderId}</p>
              </div>
              <Badge className={`${getStatusColor(displayStatus)} capitalize`}>
                {order.status}
              </Badge>
            </div>

            <CardContent className="p-0">
              {order.items.map((item) => {
                const isPastDeliveryDate = item.deliveryDate;

                return (
                  <div key={item._id} className="p-4 border-b flex gap-4">
                    <div className="relative w-24 h-24 shrink-0 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={getImageUrl(item.coverImage)}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium">{item.productName}</h3>
                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                        <p>
                          ₹{item.price.toLocaleString()} × {item.quantity}
                        </p>
                        {item.selectedSize && <p>Size: {item.selectedSize}</p>}
                        <p>
                          {isPastDeliveryDate
                            ? "Delivered on: "
                            : "Delivery by: "}
                          {item.deliveryDate}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    Order Total: ₹{order.total.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Items: ₹{order.subtotal.toLocaleString()} | Delivery: ₹
                    {order.deliveryCharges}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Only show cancel button for cancellable orders */}
                  {/* Users cannot cancel orders once they are "ready to ship" or in later stages */}
                  {![
                    "ready to ship",
                    "delivered",
                    "cancelled",
                    "returned",
                  ].includes(order.status) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleCancelOrder(order._id)}
                      disabled={cancellingOrderId === order._id}
                    >
                      {cancellingOrderId === order._id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Cancel Order"
                      )}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleViewDetails(order.orderId)}
                  >
                    View Details <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <OrderDetails
        orderId={selectedOrderId}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </div>
  );
};

export default Orders;
