"use client";

import { ClipboardList } from "lucide-react";
import React, { useState, useEffect } from "react";
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
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  PaginationState,
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

interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  vendorId: string;
  price: number;
  size: string;
  color: string;
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

// Function to fetch all orders
const getAllOrders = async () => {
  try {
    const response = await fetch("/api/admin/order", {
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
    const response = await fetch(`/api/admin/order/byId/${id}`, {
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
    const response = await fetch(`/api/admin/order/byId/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, ...cancellationData }),
    });

    if (!response.ok) {
      throw new Error("Failed to update order status");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

// Updated component using the new hook to fetch user details
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
  // * useStates and hooks
  const [data, setData] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // * orders fetching function
  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      if (!response.success) {
        throw new Error(response.error);
      }
      setData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // * order deleting function
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteOrder(id);

      if (!response.success) {
        throw new Error(response.error);
      }

      await fetchAllOrders();
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

  // * handle status change
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

      await fetchAllOrders();
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
        fetchAllOrders();
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

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
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
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
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);

  if (loading) {
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
            <Input
              placeholder="Filter by order ID..."
              value={
                (table.getColumn("orderId")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("orderId")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />

            <div className="flex gap-2">
              <Select
                value={
                  (table.getColumn("status")?.getFilterValue() as string) ?? ""
                }
                onValueChange={(value) =>
                  value === ""
                    ? table.getColumn("status")?.setFilterValue(undefined)
                    : table.getColumn("status")?.setFilterValue(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="bg-gray-50">
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
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
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
                {pageNumbers.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => table.setPageIndex(pageNumber - 1)}
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
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
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
