import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface OrderDetailsProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
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
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

// Function to check if delivery date has passed
const isDeliveryDatePassed = (dateString: string) => {
  // Parse date in format "DD/MM/YYYY"
  const [day, month, year] = dateString.split("/").map(Number);
  const deliveryDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
  const today = new Date();

  // Set time to beginning of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  deliveryDate.setHours(0, 0, 0, 0);

  return today >= deliveryDate;
};

// Function to get display status
const getDisplayStatus = (order: Order) => {
  // If status is already delivered, cancelled or returned, keep as is
  if (["delivered", "cancelled", "returned"].includes(order.status)) {
    return order.status;
  }

  // Check if any item has passed its delivery date
  const anyItemDelivered = order.items.some((item) =>
    isDeliveryDatePassed(item.deliveryDate)
  );

  // If any item has passed its delivery date, show as delivered
  if (anyItemDelivered) {
    return "delivered";
  }

  // Otherwise show actual status
  return order.status;
};

const OrderDetails = ({ orderId, isOpen, onClose }: OrderDetailsProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getImageUrl = (imageId: string | File) => `/api/files/${imageId}`;

  // Fetch order details when the modal opens and orderId changes
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId || !isOpen) return;

      setIsLoading(true);

      try {
        const response = await fetch(`/api/order/${orderId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch order details");
        }

        setOrder(data.order);
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch order details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, isOpen, toast]);

  // Reset order when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setOrder(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : !order ? (
          <div className="text-center py-8">
            <p>Order not found or failed to load.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Order #{order.orderId}
                </p>
                <p className="font-medium">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <Badge
                className={`${getStatusColor(
                  getDisplayStatus(order)
                )} capitalize`}
              >
                {getDisplayStatus(order)}
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items Total</span>
                  <span>₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span>₹{order.deliveryCharges}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total Amount</span>
                  <span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Items in Your Order</h3>
              <div className="space-y-3">
                {order.items.map((item) => {
                  const isPastDeliveryDate = isDeliveryDatePassed(
                    item.deliveryDate
                  );

                  return (
                    <div
                      key={item._id}
                      className="flex gap-3 border p-3 rounded-md"
                    >
                      <div className="relative w-16 h-16 shrink-0 bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={getImageUrl(item.coverImage)}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.selectedSize && (
                            <span>Size: {item.selectedSize} • </span>
                          )}
                          <span>Qty: {item.quantity}</span>
                        </div>
                        <div className="text-sm">
                          <span>
                            {isPastDeliveryDate
                              ? "Delivered on: "
                              : "Delivery by: "}
                            {item.deliveryDate}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ₹{item.price.toLocaleString()} each
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Payment Information</h3>
              <p className="text-sm capitalize">
                {order.paymentOption.replace(/-/g, " ")}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetails;
