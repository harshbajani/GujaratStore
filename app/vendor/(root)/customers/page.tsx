"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Eye,
  Search,
  Calendar,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { withVendorProtection } from "../../HOC";
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
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false,
  });

  // Server-side pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Server-side filtering and sorting state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
  const [newCustomersForSelectedMonth, setNewCustomersForSelectedMonth] =
    useState<number>(0);

  const router = useRouter();
  const { toast } = useToast();

  // Debounced search function
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Fetch customers with server-side pagination
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        search: searchQuery,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/user/customers?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch customers");
      }

      setCustomers(data.data || []);
      setPaginationInfo(
        data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
          hasNext: false,
          hasPrev: false,
        }
      );
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
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    toast,
  ]);

  // Fetch customer statistics
  const fetchCustomerStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await fetch("/api/user/customers/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customer stats");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch customer stats");
      }

      setCustomerStats(
        data.data || {
          totalCustomers: 0,
          activeCustomers: 0,
          newCustomers: 0,
          averageOrderValue: 0,
          yearlyNewCustomers: {},
        }
      );
    } catch (error) {
      console.error("Failed to fetch customer stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customer statistics",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  // Fetch new customers for selected month
  const fetchNewCustomersForMonth = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/user/customers/new-monthly?month=${selectedMonth}&year=${selectedYear}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch new customers for month");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Failed to fetch new customers for month"
        );
      }

      setNewCustomersForSelectedMonth(data.data || 0);
    } catch (error) {
      console.error("Failed to fetch new customers for month:", error);
      toast({
        title: "Error",
        description: "Failed to fetch new customers for selected month",
        variant: "destructive",
      });
    }
  }, [selectedMonth, selectedYear, toast]);

  // Handle search with debouncing
  const handleSearch = useCallback(
    (value: string) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setSearchQuery(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to first page
      }, 500);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  // Handle sorting
  const handleSort = useCallback(
    (column: string) => {
      if (sortBy === column) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortOrder("asc");
      }
      setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to first page
    },
    [sortBy]
  );

  // Effect to fetch customers when dependencies change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Effect to fetch stats on component mount
  useEffect(() => {
    fetchCustomerStats();
  }, [fetchCustomerStats]);

  // Effect to fetch new customers for selected month
  useEffect(() => {
    fetchNewCustomersForMonth();
  }, [fetchNewCustomersForMonth]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const columns: ColumnDef<IUser>[] = [
    {
      accessorKey: "name",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("name")}
          className="h-auto p-0 font-semibold"
        >
          Customer Name
          {sortBy === "name" && (
            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("email")}
          className="h-auto p-0 font-semibold"
        >
          Email
          {sortBy === "email" && (
            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </Button>
      ),
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
              href={`tel:${phone}`}
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
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("orderCount")}
          className="h-auto p-0 font-semibold"
        >
          Orders
          {sortBy === "orderCount" && (
            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-medium">
          {row.getValue("orderCount")}
        </Badge>
      ),
    },
    {
      accessorKey: "totalSpent",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("totalSpent")}
          className="h-auto p-0 font-semibold"
        >
          Total Spent
          {sortBy === "totalSpent" && (
            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalSpent"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "INR",
        }).format(amount);
        return <div className="font-medium text-green-600">{formatted}</div>;
      },
    },
    {
      accessorKey: "firstOrderDate",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("firstOrderDate")}
          className="h-auto p-0 font-semibold"
        >
          First Order
          {sortBy === "firstOrderDate" && (
            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("firstOrderDate");
        return (
          <div className="text-sm text-gray-600">
            {date ? formatDate(date as string) : "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "lastOrderDate",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("lastOrderDate")}
          className="h-auto p-0 font-semibold"
        >
          Last Order
          {sortBy === "lastOrderDate" && (
            <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("lastOrderDate");
        return (
          <div className="text-sm text-gray-600">
            {date ? formatDate(date as string) : "N/A"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/vendor/customers/${customer._id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: customers,
    columns,
    pageCount: paginationInfo.totalPages,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const monthNames = [
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
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage and view all your customers
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader />
              ) : (
                customerStats.totalCustomers.toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader />
              ) : (
                customerStats.activeCustomers.toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader />
              ) : (
                customerStats.newCustomers.toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader />
              ) : (
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "INR",
                }).format(customerStats.averageOrderValue)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Customer Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-2xl font-bold">
            {newCustomersForSelectedMonth.toLocaleString()} new customers in{" "}
            {monthNames[selectedMonth]} {selectedYear}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="max-w-sm"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => {
              setPagination((prev) => ({
                ...prev,
                pageSize: parseInt(value),
                pageIndex: 0,
              }));
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
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
                      className="h-24 text-center"
                    >
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing{" "}
          <strong>
            {paginationInfo.itemsPerPage * (paginationInfo.currentPage - 1) + 1}
          </strong>{" "}
          to{" "}
          <strong>
            {Math.min(
              paginationInfo.itemsPerPage * paginationInfo.currentPage,
              paginationInfo.totalItems
            )}
          </strong>{" "}
          of <strong>{paginationInfo.totalItems}</strong> customers
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                pageIndex: prev.pageIndex - 1,
              }))
            }
            disabled={!paginationInfo.hasPrev || loading}
          >
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground">
              Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
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
            disabled={!paginationInfo.hasNext || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default withVendorProtection(CustomersPage);
