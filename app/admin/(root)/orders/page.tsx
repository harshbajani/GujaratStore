"use client";

import { ClipboardList } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/Loader";
import { useUsers } from "@/hooks/useUsers"; // Updated hook import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface CancellationData {
  cancellationReason?: string;
  isAdminCancellation: boolean;
}

// Function to fetch paginated orders
const getOrdersPaginated = async (params: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<PaginatedResponse<IOrder>> => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      paginate: "true", // Enable pagination
      ...(params.search && { search: params.search }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
      ...(params.status && { status: params.status }),
      ...(params.dateFrom && { dateFrom: params.dateFrom }),
      ...(params.dateTo && { dateTo: params.dateTo }),
    });

    const response = await fetch(`/api/admin/order?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Function to delete an order
const deleteOrder = async (id: string) => {
  try {
    const response = await fetch(`/api/order/byId/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete order");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

// Function to update order status
const updateOrderStatus = async (
  id: string,
  status: string,
  cancellationData: CancellationData
) => {
  try {
    const response = await fetch(`/api/order/byId/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, ...cancellationData }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, message: "Failed to update order status" };
  }
};

const UserCell = ({ userId }: { userId: string }) => {
  const { data: user, error, isLoading } = useUsers(userId);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-24 rounded" />;
  }

  if (error) {
    return <div className="text-red-600">Error</div>;
  }

  return <div className="font-medium">{user?.name || "Unknown User"}</div>;
};

const OrdersPage = () => {
  // Basic state
  const [data, setData] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false,
  });

  // Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("");

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Dialog state
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search, filter, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, sortBy, sortOrder, statusFilter]);

  // Fetch data function
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm,
        sortBy,
        sortOrder,
        ...(statusFilter && { status: statusFilter }),
      };

      const response = await getOrdersPaginated(params);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch orders");
      }

      setData(response.data || []);
      setPagination(
        response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: pageSize,
          hasNext: false,
          hasPrev: false,
        }
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch orders";
      setError(errorMessage);
      setData([]);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearchTerm,
    sortBy,
    sortOrder,
    statusFilter,
    toast,
  ]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteOrder(id);

      if (!response.success) {
        throw new Error(response.error);
      }

      // Refresh current page
      await fetchOrders();
      toast({
        title: "Success",
        description: "Order deleted successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  // Handle status change
  const handleStatusChange = async (id: string, status: string) => {
    try {
      if (status === "cancelled") {
        // Find the order in the data array
        const order = data.find((o) => o._id === id);
        if (!order) {
          throw new Error("Order not found");
        }
        setSelectedOrder(order);
        setCancellationDialogOpen(true);
        return;
      }

      const response = await updateOrderStatus(id, status, {
        cancellationReason: "",
        isAdminCancellation: false,
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      await fetchOrders();
      toast({
        title: "Success",
        description: "Order status updated successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleCancellationConfirm = async () => {
    if (!selectedOrder || !cancellationReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await updateOrderStatus(selectedOrder._id, "cancelled", {
        cancellationReason: cancellationReason.trim(),
        isAdminCancellation: true,
      });

      if (response.success) {
        setCancellationDialogOpen(false);
        setCancellationReason("");
        setSelectedOrder(null);
        fetchOrders();
        toast({
          title: "Success",
          description: "Order cancelled successfully!",
          variant: "default",
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
      setIsLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const totalPages = pagination.totalPages;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const columns: ColumnDef<IOrder>[] = [
    {
      accessorKey: "orderId",
      header: "Order ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("orderId")}</div>
      ),
    },
    {
      accessorKey: "userId",
      header: "Customer",
      cell: ({ row }) => <UserCell userId={row.getValue("userId")} />,
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <div className="font-medium">
          {formatDate(row.getValue("createdAt"))}
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <div className="font-medium">
          ₹{Number(row.getValue("total")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const badgeVariant:
          | "default"
          | "secondary"
          | "destructive"
          | "outline" = "default";
        let badgeClass = "";

        switch (status.toLowerCase()) {
          case "processing":
            badgeClass = "bg-yellow-100 text-yellow-800";
            break;
          case "ready to ship":
            badgeClass = "bg-purple-100 text-purple-800";
            break;
          case "delivered":
            badgeClass = "bg-green-100 text-green-800";
            break;
          case "unconfirmed":
            badgeClass = "bg-orange-100 text-orange-800";
            break;
          case "cancelled":
            badgeClass = "bg-red-100 text-red-800";
            break;
          default:
            badgeClass = "bg-gray-100 text-gray-800";
        }

        return (
          <Badge variant={badgeVariant} className={badgeClass}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paymentOption",
      header: "Payment Method",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("paymentOption")}</div>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment Status",
      cell: ({ row }) => {
        const paymentStatus = (row.getValue("paymentStatus") as string) || "pending";
        const className =
          paymentStatus === "paid"
            ? "bg-green-100 text-green-800"
            : paymentStatus === "failed"
            ? "bg-red-100 text-red-800"
            : paymentStatus === "refunded"
            ? "bg-blue-100 text-blue-800"
            : "bg-yellow-100 text-yellow-800"; // pending
        return <Badge className={className}>{paymentStatus}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100"
              onClick={() => router.push(`/admin/orders/view/${order._id}`)}
            >
              <Eye className="h-4 w-4 text-gray-600" />
            </Button>

            <Select
              defaultValue={order.status}
              onValueChange={(value) => handleStatusChange(order._id, value)}
            >
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready to ship">Ready to Ship</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-red-100"
              onClick={() => handleDelete(order._id)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  if (loading && data.length === 0) {
    return <Loader />;
  }

  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="text-brand h-8 w-8" />
        <h1 className="h1">Orders</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
              )}
            </div>

            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready to ship">Ready to Ship</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="bg-gray-50">
                        {header.isPlaceholder ? null : (
                          <div>
                            {header.column.id === "orderId" && (
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("orderId")}
                                className="hover:bg-gray-100 px-0"
                              >
                                Order ID
                                {sortBy === "orderId" && (
                                  <span className="ml-1">
                                    {sortOrder === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                              </Button>
                            )}
                            {header.column.id === "createdAt" && (
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("createdAt")}
                                className="hover:bg-gray-100 px-0"
                              >
                                Date
                                {sortBy === "createdAt" && (
                                  <span className="ml-1">
                                    {sortOrder === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                              </Button>
                            )}
                            {header.column.id === "total" && (
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("total")}
                                className="hover:bg-gray-100 px-0"
                              >
                                Total
                                {sortBy === "total" && (
                                  <span className="ml-1">
                                    {sortOrder === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                              </Button>
                            )}
                            {header.column.id === "status" && (
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("status")}
                                className="hover:bg-gray-100 px-0"
                              >
                                Status
                                {sortBy === "status" && (
                                  <span className="ml-1">
                                    {sortOrder === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                              </Button>
                            )}
                            {![
                              "orderId",
                              "createdAt",
                              "total",
                              "status",
                            ].includes(header.column.id) &&
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
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
                      {loading ? "Loading..." : "No orders found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500 ml-4">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, pagination.totalItems)} of{" "}
                {pagination.totalItems} results
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>

              <div className="flex gap-1">
                {getPageNumbers().map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className={
                      currentPage === pageNumber
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={cancellationDialogOpen}
        onOpenChange={setCancellationDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for Cancellation
              </label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for cancelling this order..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancellationDialogOpen(false);
                setCancellationReason("");
                setSelectedOrder(null);
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
    </div>
  );
};

export default OrdersPage;
