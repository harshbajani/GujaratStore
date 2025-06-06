"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Eye, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/Loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useUsers } from "@/hooks/useUsers"; // New hook import
import Link from "next/link";

interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  firstOrderDate: string;
}

interface ICustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  averageOrderValue: number;
  yearlyNewCustomers: { [year: number]: number };
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [customerStats, setCustomerStats] = useState<ICustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomers: 0,
    averageOrderValue: 0,
    yearlyNewCustomers: {},
  });

  // State for month/year selection for historical stats
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  const router = useRouter();
  const { toast } = useToast();

  // Fetch all users via the new hook.
  const { data: allUsers, isLoading: usersLoading } = useUsers();

  // Fetch orders and compute customer stats after users data is available.
  const fetchAllCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/order", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const ordersData = await response.json();
      if (!ordersData.success) {
        throw new Error(ordersData.error || "Failed to fetch orders");
      }

      const orders = Array.isArray(ordersData.data) ? ordersData.data : [];

      // Process orders to extract unique customers using data from allUsers.
      const uniqueCustomers = new Map();
      for (const order of orders) {
        if (!uniqueCustomers.has(order.userId)) {
          // Use the new hook's data to locate the user's info.
          const user = allUsers?.find((u: IUser) => u._id === order.userId);
          if (user) {
            // Filter orders for the customer.
            const customerOrders = orders.filter(
              (o: IOrder) => o.userId === order.userId
            );

            // Calculate total spent.
            const totalSpent = customerOrders.reduce(
              (sum: number, o: IOrder) => sum + (o.total || 0),
              0
            );

            // Determine first and last order dates.
            const sortedOrders = [...customerOrders].sort(
              (a: IOrder, b: IOrder) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );
            const firstOrderDate = sortedOrders[0].createdAt;
            const lastOrderDate =
              sortedOrders[sortedOrders.length - 1].createdAt;

            uniqueCustomers.set(order.userId, {
              _id: order.userId,
              name: user.name,
              email: user.email,
              phone: user.phone,
              orderCount: customerOrders.length,
              totalSpent,
              lastOrderDate,
              firstOrderDate,
            });
          }
        }
      }

      const customersArray = Array.from(uniqueCustomers.values());
      setCustomers(customersArray);

      // Calculate overall customer stats.
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeCustomers = customersArray.filter(
        (customer) => new Date(customer.lastOrderDate) > thirtyDaysAgo
      ).length;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const newCustomers = customersArray.filter((customer) => {
        const firstOrder = new Date(customer.firstOrderDate);
        return firstOrder >= startOfMonth && firstOrder < endOfMonth;
      }).length;

      const yearlyNewCustomers = customersArray.reduce((acc, customer) => {
        const year = new Date(customer.firstOrderDate).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {} as { [year: number]: number });

      const totalOrders = customersArray.reduce(
        (sum, customer) => sum + customer.orderCount,
        0
      );
      const grandTotalSpent = customersArray.reduce(
        (sum, customer) => sum + customer.totalSpent,
        0
      );
      const averageOrderValue =
        totalOrders > 0 ? grandTotalSpent / totalOrders : 0;

      setCustomerStats({
        totalCustomers: customersArray.length,
        activeCustomers,
        newCustomers,
        averageOrderValue,
        yearlyNewCustomers,
      });
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Wait until the new hook returns all users before processing orders.
  useEffect(() => {
    if (!usersLoading && allUsers) {
      fetchAllCustomers();
    }
  }, [usersLoading, allUsers]);

  // Compute new customers count for the selected month/year.
  const newCustomersForSelectedMonth = useMemo(() => {
    if (!customers.length) return 0;
    const startOfSelectedMonth = new Date(selectedYear, selectedMonth, 1);
    const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 1);
    return customers.filter((customer) => {
      const firstOrder = new Date(customer.firstOrderDate);
      return (
        firstOrder >= startOfSelectedMonth && firstOrder < endOfSelectedMonth
      );
    }).length;
  }, [customers, selectedMonth, selectedYear]);

  const columns: ColumnDef<IUser>[] = [
    {
      accessorKey: "name",
      header: "Customer Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email");
        return (
          <div>
            <Link
              prefetch
              href={`mailto:${email}`}
              className="text-blue-600 hover:underline"
            >
              {row.getValue("email")}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone");
        return (
          <div>
            <Link
              prefetch
              href={`callto:${phone}`}
              className="text-blue-600 hover:underline"
            >
              {row.getValue("phone")}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "orderCount",
      header: "Orders",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {row.getValue("orderCount")}
        </Badge>
      ),
    },
    {
      accessorKey: "totalSpent",
      header: "Total Spent",
      cell: ({ row }) => (
        <div className="font-medium">
          ₹{Number(row.getValue("totalSpent")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "lastOrderDate",
      header: "Last Order",
      cell: ({ row }) => <div>{formatDate(row.getValue("lastOrderDate"))}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100"
              onClick={() => router.push(`/admin/customers/${customer._id}`)}
            >
              <Eye className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: customers,
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

  if (loading || usersLoading) {
    return <Loader />;
  }

  return (
    <div className="p-2 space-y-4">
      <div className="flex items-center gap-3">
        <Users className="text-brand h-8 w-8" />
        <h1 className="h1">Customers</h1>
      </div>

      {/* Date Filter Section for Historical Stats */}
      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Month
          </label>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Year
          </label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(
                { length: 10 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerStats.totalCustomers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerStats.activeCustomers}
            </div>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              New Customers (Current Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerStats.newCustomers}
            </div>
            <p className="text-xs text-gray-500">Current Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{customerStats.averageOrderValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card for Historical New Customers */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              New Customers (Selected Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {newCustomersForSelectedMonth}
            </div>
            <p className="text-xs text-gray-500">
              {new Date(selectedYear, selectedMonth).toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              New Customers by Year {new Date().getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(customerStats.yearlyNewCustomers).length ? (
              Object.entries(customerStats.yearlyNewCustomers)
                .sort(([yearA], [yearB]) => Number(yearA) - Number(yearB))
                .map(([year, count]) => (
                  <div key={year} className="flex flex-col">
                    <span className="text-2xl font-bold">{count}</span>
                    <span className="text-xs text-gray-500">{year}</span>
                  </div>
                ))
            ) : (
              <div className="text-gray-500">No yearly data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customers Table with Scrollable Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search customers..."
                value={
                  (table.getColumn("name")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-auto max-h-[500px]">
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
                      No customers found
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
                  setPagination({ pageIndex: 0, pageSize: Number(value) });
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
    </div>
  );
};

export default CustomersPage;
