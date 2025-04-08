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

const ViewOrderPage = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  // Use custom hooks
  const { order, loading, updateStatus } = useOrder(orderId);
  const { address, loading: addressLoading } = useShippingAddress(
    order?.addressId
  );
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
      case "confirmed":
        badgeClass = "bg-blue-100 text-blue-800";
        icon = <Package className="h-4 w-4 mr-1" />;
        break;
      case "processing":
        badgeClass = "bg-yellow-100 text-yellow-800";
        icon = <Package className="h-4 w-4 mr-1" />;
        break;
      case "shipped":
        badgeClass = "bg-purple-100 text-purple-800";
        icon = <Truck className="h-4 w-4 mr-1" />;
        break;
      case "delivered":
        badgeClass = "bg-green-100 text-green-800";
        icon = <Check className="h-4 w-4 mr-1" />;
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
                      order.status === "confirmed" ? "default" : "outline"
                    }
                    className={order.status === "confirmed" ? "bg-brand" : ""}
                    onClick={() => updateStatus("confirmed")}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      order.status === "processing" ? "default" : "outline"
                    }
                    className={order.status === "processing" ? "bg-brand" : ""}
                    onClick={() => updateStatus("processing")}
                  >
                    Processing
                  </Button>
                  <Button
                    size="sm"
                    variant={order.status === "shipped" ? "default" : "outline"}
                    className={order.status === "shipped" ? "bg-brand" : ""}
                    onClick={() => updateStatus("shipped")}
                  >
                    Shipped
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      order.status === "delivered" ? "default" : "outline"
                    }
                    className={order.status === "delivered" ? "bg-brand" : ""}
                    onClick={() => updateStatus("delivered")}
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
                    onClick={() => updateStatus("cancelled")}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-2">Payment Information</h3>
                <p className="text-sm mb-1">
                  <span className="font-medium">Method:</span>{" "}
                  {order.paymentOption}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    {order.paymentOption === "cash-on-delivery"
                      ? "Pending"
                      : "Paid"}
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
                {order.items.map((item, index) => (
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
            {addressLoading ? (
              <p>Loading shipping details...</p>
            ) : address ? (
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
      </div>
    </div>
  );
};

export default ViewOrderPage;
