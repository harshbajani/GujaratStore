"use client";

import {
  ClipboardList,
  ArrowLeft,
  Package,
  Truck,
  Check,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/Loader";
import Image from "next/image";
import { useOrder, useShippingAddress } from "@/hooks/useOrderHooks";
import { useUsers } from "@/hooks/useUsers"; // Updated hook import
import { PaymentInfoCard } from "@/components/PaymentInfo/PaymentInfoComponents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ShippingInfo } from "@/components/admin/ShippingInfo";
import { PickupLocationDialog, PickupLocationData } from "@/components/dialogs/PickupLocationDialog";

interface CancellationData {
  cancellationReason?: string;
  isAdminCancellation: boolean;
}

const ViewOrderPage = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { toast } = useToast();

  // Use custom hooks
  const { order, loading, fetchOrder } = useOrder(orderId);
  const { address } = useShippingAddress(order?.addressId);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [pickupLocationDialogOpen, setPickupLocationDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  // Replace the old hook with the new useUsers hook
  const {
    data: user,
    error: userError,
    isLoading: userLoading,
  } = useUsers(order?.userId || "");

  const getImageUrl = (imageId: string | File) => `/api/files/${imageId}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    let badgeClass = "";
    let icon = null;
    switch (status.toLowerCase()) {
      case "processing":
        badgeClass = "bg-yellow-100 text-yellow-800";
        icon = <Package className="h-4 w-4 mr-1" />;
        break;
      case "ready to ship":
        badgeClass = "bg-purple-100 text-purple-800";
        icon = <Truck className="h-4 w-4 mr-1" />;
        break;
      case "delivered":
        badgeClass = "bg-green-100 text-green-800";
        icon = <Check className="h-4 w-4 mr-1" />;
        break;
      case "unconfirmed":
        badgeClass = "bg-orange-100 text-orange-800";
        icon = <Package className="h-4 w-4 mr-1" />;
        break;
      case "cancelled":
        badgeClass = "bg-red-100 text-red-800";
        icon = <X className="h-4 w-4 mr-1" />;
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-800";
    }
    return { badgeClass, icon };
  };

  const updateOrderStatus = async (
    id: string,
    status: string,
    cancellationData: CancellationData,
    customPickupLocation?: PickupLocationData
  ) => {
    try {
      const response = await fetch(`/api/order/byId/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status, 
          ...cancellationData,
          ...(customPickupLocation && { customPickupLocation })
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating order status:", error);
      return { success: false, message: "Failed to update order status" };
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!order) return;

    try {
      if (status === "cancelled") {
        setCancellationDialogOpen(true);
        return;
      }

      if (status === "ready to ship") {
        setPendingStatusChange(status);
        setPickupLocationDialogOpen(true);
        return;
      }

      const response = await updateOrderStatus(order._id, status, {
        isAdminCancellation: false,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Order status updated successfully!",
          variant: "default",
        });
        fetchOrder();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update order status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleCancellationConfirm = async () => {
    if (!order || !cancellationReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true); // Set loading state to true when starting the process

    try {
      const response = await updateOrderStatus(order._id, "cancelled", {
        cancellationReason: cancellationReason.trim(),
        isAdminCancellation: true,
      });

      if (response.success) {
        setCancellationDialogOpen(false);
        setCancellationReason("");
        fetchOrder();
        toast({
          title: "Success",
          description: "Order cancelled successfully!",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to cancel order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Ensure loading state is reset after the process
    }
  };

  const handlePickupLocationConfirm = async (pickupLocationData?: PickupLocationData) => {
    if (!order || !pendingStatusChange) return;

    setIsLoading(true);
    try {
      const response = await updateOrderStatus(
        order._id,
        pendingStatusChange,
        { isAdminCancellation: false },
        pickupLocationData
      );

      if (response.success) {
        setPickupLocationDialogOpen(false);
        setPendingStatusChange(null);
        fetchOrder();
        toast({
          title: "Success",
          description: pickupLocationData 
            ? "Order status updated with custom pickup location!"
            : "Order status updated with default pickup location!",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update order status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <Button variant="outline" onClick={() => router.push("/admin/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go back to orders
        </Button>
      </div>
    );
  }

  const { badgeClass, icon } = getStatusBadge(order.status);

  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-brand h-8 w-8" />
          <h1 className="h1">Order Details</h1>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary Card */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">
                  Order #{order.orderId}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center">
                <Badge
                  variant="outline"
                  className={`text-sm px-3 py-1 flex items-center ${badgeClass}`}
                >
                  {icon}
                  {order.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-6">
              <div className="flex-1">
                <h3 className="font-medium mb-2">Status Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={
                      order.status === "processing" ? "default" : "outline"
                    }
                    className={order.status === "processing" ? "bg-brand" : ""}
                    onClick={() => handleStatusChange("processing")}
                  >
                    Processing
                  </Button>
                  <Button
                    size="sm"
                    variant={order.status === "ready to ship" ? "default" : "outline"}
                    className={order.status === "ready to ship" ? "bg-brand" : ""}
                    onClick={() => handleStatusChange("ready to ship")}
                  >
                    Ready to Ship
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      order.status === "delivered" ? "default" : "outline"
                    }
                    className={order.status === "delivered" ? "bg-brand" : ""}
                    onClick={() => handleStatusChange("delivered")}
                  >
                    Delivered
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      order.status === "cancelled" ? "default" : "outline"
                    }
                    className={
                      order.status === "cancelled"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "text-red-600 border-red-200 hover:bg-red-50"
                    }
                    onClick={() => handleStatusChange("cancelled")}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-2">Payment Summary</h3>
                <p className="text-sm mb-1">
                  <span className="font-medium">Method:</span>{" "}
                  {order.paymentOption}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  <Badge
                    variant="outline"
                    className={
                      order.paymentStatus === "paid"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : order.paymentStatus === "failed"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }
                  >
                    {order.paymentOption === "cash-on-delivery"
                      ? "COD"
                      : order.paymentStatus
                      ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
                      : "Pending"}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items Card */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order?.items.map((item: IOrderItem, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded border bg-gray-50">
                          <Image
                            src={getImageUrl(item.coverImage)}
                            alt={item.productName}
                            height={500}
                            width={500}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/api/placeholder/100/100";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.deliveryDate && (
                            <p className="text-sm text-gray-500">
                              Delivery by: {item.deliveryDate}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Order Summary Card */}
        <Card className="col-span-1">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>₹{order.deliveryCharges.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Details Card */}
        <Card className="col-span-1">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Shipping Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {userLoading ? (
              <p>Loading customer details...</p>
            ) : userError ? (
              <p className="text-red-600">Failed to load customer details</p>
            ) : user ? (
              <div className="space-y-2">
                <h4 className="font-bold">Customer Details</h4>
                <p>Name: {user.name}</p>
                <p>Email: {user.email}</p>
                <p>Phone: {user.phone}</p>
              </div>
            ) : (
              <p>No customer details available.</p>
            )}
            <h4 className="font-bold mt-4">Customer Address</h4>
            {address ? (
              <div className="space-y-2">
                <p className="font-medium">{address.address_line_1}</p>
                <p>{address.address_line_2}</p>
                <p>
                  {address.locality}, {address.state} {address.pincode}
                </p>
              </div>
            ) : (
              <p>No shipping details available.</p>
            )}
          </CardContent>
        </Card>

        {/* Shiprocket Shipping Information Card */}
        <div className="col-span-1 lg:col-span-3">
          <ShippingInfo 
            order={order} 
            onRefresh={async (orderId) => {
              // Refresh order data
              await fetchOrder();
            }}
          />
        </div>

        {/* Enhanced Payment Information Card */}
        <Card className="col-span-1 lg:col-span-2">
          <PaymentInfoCard order={order} showAdvancedDetails={true} />
        </Card>
      </div>
      <Dialog
        open={cancellationDialogOpen}
        onOpenChange={setCancellationDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for cancelling this order. This will be
              sent to the customer.
            </p>
            <Textarea
              placeholder="Enter cancellation reason..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancellationDialogOpen(false);
                setCancellationReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancellationConfirm}
              className="primary-btn"
              disabled={isLoading}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <PickupLocationDialog
        open={pickupLocationDialogOpen}
        onOpenChange={(open) => {
          setPickupLocationDialogOpen(open);
          if (!open) {
            // Reset pending status change if dialog is closed without confirming
            setPendingStatusChange(null);
          }
        }}
        onConfirm={(pickupLocationData) => handlePickupLocationConfirm(pickupLocationData)}
        onSkip={() => handlePickupLocationConfirm(undefined)}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ViewOrderPage;
