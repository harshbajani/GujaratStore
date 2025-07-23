"use client";
import { Pencil, Trash2 } from "lucide-react";
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
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteVendor } from "@/lib/actions/admin/vendor.actions";
import { useVendorSearch } from "@/hooks/useVendors";

const VendorPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  // Use the new search hook with server-side functionality
  const {
    vendors,
    pagination,
    loading,
    error,
    searchParams,
    updateSearch,
    mutate,
  } = useVendorSearch({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "name",
    sortOrder: "asc",
  });

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteVendor(id);
      if (!response.success) {
        throw new Error(response.message);
      }
      // Revalidate vendor data after deletion
      mutate();
      toast({
        title: "Success",
        description: "Vendor deleted successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete vendor:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete vendor",
        variant: "destructive",
      });
    }
  };

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    updateSearch({ search: value });
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    updateSearch({ limit: size, page: 1 });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    updateSearch({ page });
  };

  // Handle sort
  const handleSort = (column: string) => {
    const newOrder =
      searchParams.sortBy === column && searchParams.sortOrder === "asc"
        ? "desc"
        : "asc";
    updateSearch({ sortBy: column, sortOrder: newOrder });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];

    const pages = [];
    const maxVisible = 5;
    const totalPages = pagination.totalPages;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const currentPage = pagination.currentPage;
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

  const columns: ColumnDef<VendorResponse>[] = [
    {
      accessorKey: "name",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("name")}
          className="hover:bg-gray-100 h-auto p-0"
        >
          Name
          {searchParams.sortBy === "name" && (
            <span className="ml-1">
              {searchParams.sortOrder === "asc" ? "↑" : "↓"}
            </span>
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
          className="hover:bg-gray-100 h-auto p-0"
        >
          Email
          {searchParams.sortBy === "email" && (
            <span className="ml-1">
              {searchParams.sortOrder === "asc" ? "↑" : "↓"}
            </span>
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("phone")}
          className="hover:bg-gray-100 h-auto p-0"
        >
          Phone
          {searchParams.sortBy === "phone" && (
            <span className="ml-1">
              {searchParams.sortOrder === "asc" ? "↑" : "↓"}
            </span>
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("phone")}</div>
      ),
    },
    {
      accessorKey: "isVerified",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("isVerified")}
          className="hover:bg-gray-100 h-auto p-0"
        >
          Verified
          {searchParams.sortBy === "isVerified" && (
            <span className="ml-1">
              {searchParams.sortOrder === "asc" ? "↑" : "↓"}
            </span>
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue("isVerified") ? "Yes" : "No"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100"
              onClick={() => router.push(`/admin/vendors/edit/${vendor._id}`)}
            >
              <Pencil className="h-4 w-4 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-red-100"
              onClick={() => handleDelete(vendor._id)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: vendors || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: pagination?.totalPages || 0,
  });

  if (loading && vendors.length === 0) {
    return <Loader />;
  }

  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Vendors</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search vendors..."
                value={searchParams.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-sm"
              />
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
              )}
            </div>
            <Link prefetch href="/admin/vendors/add">
              <Button className="bg-brand hover:bg-brand/90 text-white">
                Add Vendor
              </Button>
            </Link>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">
                Error loading vendors: {error.message}
              </p>
            </div>
          )}

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
                {vendors.length > 0 ? (
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
                      {loading ? "Loading..." : "No vendors found"}
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
                value={searchParams.limit?.toString() || "10"}
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
              {pagination && (
                <span className="text-sm text-gray-500 ml-4">
                  Showing{" "}
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
                  to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.itemsPerPage,
                    pagination.totalItems
                  )}{" "}
                  of {pagination.totalItems} results
                </span>
              )}
            </div>

            {pagination && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>

                <div className="flex gap-1">
                  {getPageNumbers().map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={
                        pagination.currentPage === pageNumber
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      className={
                        pagination.currentPage === pageNumber
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
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPage;
