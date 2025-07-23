"use client";
import { Star } from "lucide-react";
import { withVendorProtection } from "../../HOC";
import { deleteBrand } from "@/lib/actions/brand.actions";
import React, { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import Link from "next/link";
import Loader from "@/components/Loader";

type Brand = {
  _id: string;
  name: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  isActive?: boolean;
};

const BrandPage = () => {
  // Basic state
  const [data, setData] = useState<Brand[]>([]);
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
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const router = useRouter();
  const { toast } = useToast();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, sortBy, sortOrder]);

  // Fetch data function
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: debouncedSearchTerm,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/brands?${queryParams}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch brands");
      }

      setData(result.data || []);
      setPagination(
        result.pagination || {
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
        err instanceof Error ? err.message : "Failed to fetch brands";
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
  }, [currentPage, pageSize, debouncedSearchTerm, sortBy, sortOrder, toast]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteBrand(id);

      if (!response.success) {
        throw new Error(response.error);
      }

      // Refresh current page
      await fetchBrands();

      toast({
        title: "Success",
        description: "Brand deleted successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete brand:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete brand",
        variant: "destructive",
      });
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

  if (loading && data.length === 0) {
    return <Loader />;
  }

  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-3">
        <Star className="text-brand h-8 w-8" />
        <h1 className="h1">Brands</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
              )}
            </div>
            <Link prefetch href="/vendor/brand/add">
              <Button className="bg-brand hover:bg-brand/90 text-white">
                Add Brand
              </Button>
            </Link>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-gray-50">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="hover:bg-gray-100"
                    >
                      Name
                      {sortBy === "name" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="bg-gray-50">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("metaTitle")}
                      className="hover:bg-gray-100"
                    >
                      Meta Title
                      {sortBy === "metaTitle" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="bg-gray-50">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("metaKeywords")}
                      className="hover:bg-gray-100"
                    >
                      Meta Keywords
                      {sortBy === "metaKeywords" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="bg-gray-50">Meta Description</TableHead>
                  <TableHead className="bg-gray-50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data.map((brand) => (
                    <TableRow key={brand._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{brand.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{brand.metaTitle}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{brand.metaKeywords}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate">
                          {brand.metaDescription}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-gray-100"
                            onClick={() =>
                              router.push(`/vendor/brand/edit/${brand._id}`)
                            }
                          >
                            <Pencil className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-red-100"
                            onClick={() => handleDelete(brand._id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-gray-500"
                    >
                      {loading ? "Loading..." : "No brands found"}
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
    </div>
  );
};

export default withVendorProtection(BrandPage);
