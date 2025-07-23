"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
} from "lucide-react";
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
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
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
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.id as string;
  const {
    user: customer,
    loading,
    error,
  } = useUserDetails(customerId, { admin: true });

  const fetchCustomerOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        search: searchQuery,
        sortBy,
        sortOrder,
      });
      const response = await fetch(
        `/api/user/order/${customerId}?${queryParams}`
      );
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
        setPaginationInfo(data.pagination);
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
  }, [
    customerId,
    pagination.pageIndex,
    pagination.pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    toast,
  ]);

  useEffect(() => {
    if (customerId) fetchCustomerOrders();
  }, [fetchCustomerOrders, customerId]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Debounced search handler
  const handleSearch = useCallback(
    (value: string) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      const timeout = setTimeout(() => {
        setSearchQuery(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }, 500);
      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  // Sorting handler
  const handleSort = useCallback(
    (column: string) => {
      if (sortBy === column) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortOrder("asc");
      }
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [sortBy]
  );

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
    const totalOrders = paginationInfo.totalItems;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    // Count orders by status (for current page)
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

  // Table columns with sortable headers
  const columns: ColumnDef<IOrder>[] = [
    {
      accessorKey: "orderId",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("orderId")}
          className="h-auto p-0 font-semibold"
        >
          Order ID
          {sortBy === "orderId" && (
            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("orderId")}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("createdAt")}
          className="h-auto p-0 font-semibold"
        >
          Date
          {sortBy === "createdAt" && (
            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </Button>
      ),
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      accessorKey: "status",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("status")}
          className="h-auto p-0 font-semibold"
        >
          Status
          {sortBy === "status" && (
            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </Button>
      ),
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
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("total")}
          className="h-auto p-0 font-semibold"
        >
          Total
          {sortBy === "total" && (
            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </Button>
      ),
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
          onClick={() => router.push(`/admin/orders/view/${row.original._id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    pageCount: paginationInfo.totalPages,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
          onClick={() => router.push("/admin/customers")}
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
          onClick={() => router.push("/admin/customers")}
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
            {/* Search and page size controls */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="border rounded px-2 py-1"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={(value) => {
                    setPagination((prev) => ({
                      ...prev,
                      pageSize: Number(value),
                      pageIndex: 0,
                    }));
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
                <span className="text-sm text-gray-500">per page</span>
              </div>
            </div>
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
                  {ordersLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="text-center"
                      >
                        <Loader />
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows?.length ? (
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
            {/* Pagination controls */}
            <div className="flex items-center justify-between p-4">
              <div className="flex-1 text-sm text-gray-500">
                Showing{" "}
                {paginationInfo.itemsPerPage *
                  (paginationInfo.currentPage - 1) +
                  1}{" "}
                to{" "}
                {Math.min(
                  paginationInfo.itemsPerPage * paginationInfo.currentPage,
                  paginationInfo.totalItems
                )}{" "}
                of {paginationInfo.totalItems} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      pageIndex: prev.pageIndex - 1,
                    }))
                  }
                  disabled={!paginationInfo.hasPrev || ordersLoading}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-500">
                    Page {paginationInfo.currentPage} of{" "}
                    {paginationInfo.totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      pageIndex: prev.pageIndex + 1,
                    }))
                  }
                  disabled={!paginationInfo.hasNext || ordersLoading}
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

export default CustomerDetailPage;
