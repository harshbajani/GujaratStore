"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { withVendorProtection } from "@/app/vendor/HOC";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
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
import Loader from "@/components/Loader";
import { IUser } from "@/types";

interface OrderItem {
  productId: string;
  productName: string;
  coverImage: string;
  quantity: number;
  price: number;
}

interface IOrder {
  _id: string;
  orderId: string;
  status: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharges: number;
  total: number;
  addressId: string;
  paymentOption: string;
  createdAt: string;
  updatedAt: string;
}

// Function to get customer details
const getCustomerById = async (id: string) => {
  try {
    const response = await fetch(`/api/user/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch customer details");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching customer details:", error);
    throw error;
  }
};

// Function to get customer orders
const getCustomerOrders = async (userId: string) => {
  try {
    // In a real implementation, you would have a dedicated endpoint for this
    const response = await fetch("/api/order", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch orders");
    }

    // Filter orders by userId
    const allOrders = Array.isArray(data.data) ? data.data : [];
    const customerOrders = allOrders.filter(
      (order: IOrder) => order.userId === userId
    );

    return { success: true, data: customerOrders };
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    throw error;
  }
};

const CustomerDetailPage = () => {
  const [customer, setCustomer] = useState<IUser | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.id as string;

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await getCustomerById(customerId);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch customer details");
      }
      setCustomer(response.data);

      // Fetch customer orders
      const ordersResponse = await getCustomerOrders(customerId);
      if (ordersResponse.success) {
        setOrders(ordersResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch customer details:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch customer details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    let badgeClass = "";
    switch (status.toLowerCase()) {
      case "confirmed":
        badgeClass = "bg-blue-100 text-blue-800";
        break;
      case "processing":
        badgeClass = "bg-yellow-100 text-yellow-800";
        break;
      case "shipped":
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

  // Calculate customer stats
  const calculateCustomerStats = () => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Count orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      const status = order.status.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      ordersByStatus,
    };
  };

  const stats = calculateCustomerStats();

  if (loading) {
    return <Loader />;
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Customer not found</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/vendor/customers")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Go back to customers
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="text-brand h-8 w-8" />
          <h1 className="h1">Customer Details</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/vendor/customers")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Customers
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <Card className="col-span-1">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Saved Addresses</p>
                  {customer.addresses && customer.addresses.length > 0 ? (
                    <div className="mt-2 space-y-3">
                      {customer.addresses.map((address, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-md text-sm"
                        >
                          <p className="font-medium">
                            {address.address_line_1}
                          </p>
                          <p>{address.address_line_2}</p>
                          <p>
                            {address.locality}, {address.state}{" "}
                            {address.pincode}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No saved addresses</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Stats Card */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Customer Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-md">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="p-4 border rounded-md">
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold">
                  ₹{stats.totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <p className="text-sm text-gray-500">Average Order</p>
                <p className="text-2xl font-bold">
                  ₹{stats.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>

            <h3 className="font-medium mb-3">Order Status Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="text-center">
                  <Badge variant="outline" className={getStatusBadge(status)}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                  <p className="mt-1 font-medium">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order History Card */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">
                        {order.orderId}
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadge(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.items.length}</TableCell>
                      <TableCell>{order.paymentOption}</TableCell>
                      <TableCell className="text-right">
                        ₹{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-gray-100"
                          onClick={() =>
                            router.push(`/vendor/orders/view/${order._id}`)
                          }
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-gray-500"
                    >
                      No orders found for this customer
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withVendorProtection(CustomerDetailPage);
