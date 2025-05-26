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
import { useUserDetails } from "@/hooks/useOrderHooks"; // Import the hook
import { getCustomerOrders } from "@/lib/utils";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  PaginationState,
  flexRender,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomerDetailPage = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.id as string;

  // Use the hook instead of the direct fetch function
  const { user: customer, loading, error } = useUserDetails(customerId);

  const fetchCustomerOrders = async () => {
    try {
      setOrdersLoading(true);
      const ordersResponse = await getCustomerOrders(customerId);
      if (ordersResponse.success) {
        setOrders(ordersResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch customer orders:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch customer orders",
        variant: "destructive",
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerOrders();
    }
  }, [customerId]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

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

  // Add the columns definition
  const columns: ColumnDef<IOrder>[] = [
    {
      accessorKey: "orderId",
      header: "Order ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("orderId")}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={getStatusBadge(row.getValue("status"))}
        >
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => row.original.items.length,
    },
    {
      accessorKey: "paymentOption",
      header: "Payment",
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <div className="text-right">
          ₹{row.getValue<number>("total").toFixed(2)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-gray-100"
          onClick={() => router.push(`/vendor/orders/view/${row.original._id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  // Initialize the table
  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  if (loading || ordersLoading) {
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
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-gray-500"
                      >
                        No orders found for this customer
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rows per page:</span>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={(value) => {
                    setPagination({
                      pageIndex: 0,
                      pageSize: Number(value),
                    });
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder={pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from(
                    { length: table.getPageCount() },
                    (_, index) => index + 1
                  ).map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={
                        table.getState().pagination.pageIndex + 1 === pageNumber
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => table.setPageIndex(pageNumber - 1)}
                      className={
                        table.getState().pagination.pageIndex + 1 === pageNumber
                          ? "bg-brand hover:bg-brand/90 text-white"
                          : ""
                      }
                    >
                      {pageNumber}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withVendorProtection(CustomerDetailPage);
