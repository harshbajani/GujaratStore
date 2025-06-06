"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { useToast } from "@/hooks/use-toast";
import OrderDetails from "./OrderDetails";
import Link from "next/link";

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
    | "shipped"
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "shipped":
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const getImageUrl = (imageId: string | File) => `/api/files/${imageId}`;

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
          // Use the new API route specifically for MongoDB ObjectIds
          const response = await fetch(`/api/order/byId/${orderId}`);
          const data = await response.json();

          if (!data.success) {
            throw new Error(
              `Failed to fetch order ${orderId}: ${data.message}`
            );
          }

          return data.order;
        });

        const ordersData = await Promise.all(orderDetailsPromises);
        setOrders(ordersData);
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">My Orders</h2>

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

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleViewDetails(order.orderId)}
                >
                  View Details <ChevronRight className="h-4 w-4" />
                </Button>
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
