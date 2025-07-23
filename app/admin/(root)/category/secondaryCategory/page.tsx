"use client";
import { LayoutPanelLeft } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/Loader";
import {
  deleteSecondaryCategoryById,
  getSecondaryCategoriesPaginated,
} from "@/lib/actions/secondaryCategory.actions";

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
};

const SecondaryCategoryPage = () => {
  // Basic state
  const [data, setData] = useState<SecondaryCategoryWithPopulatedFields[]>([]);
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

  // Filter and search state
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

  // Reset to page 1 when search, sort, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, sortBy, sortOrder]);

  // Fetch data function
  const fetchSecondaryCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm,
        sortBy,
        sortOrder,
      };

      const result = await getSecondaryCategoriesPaginated(params);

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch secondary categories");
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
        err instanceof Error
          ? err.message
          : "Failed to fetch secondary categories";
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
    fetchSecondaryCategories();
  }, [fetchSecondaryCategories]);

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteSecondaryCategoryById(id);

      // Refresh current page
      await fetchSecondaryCategories();

      toast({
        title: "Success",
        description: "Secondary Category deleted successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete secondary category:", error);
      toast({
        title: "Error",
        description: "Failed to delete secondary category",
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
        <LayoutPanelLeft className="text-brand" size={30} />
        <h1 className="h1">Secondary Categories</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search secondary categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                )}
              </div>
              <Link prefetch href="/admin/category/secondaryCategory/add">
                <Button className="bg-brand hover:bg-brand/90 text-white">
                  Add Secondary Category
                </Button>
              </Link>
            </div>

            {/* Additional Filters */}
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
                  <TableHead className="bg-gray-50">Parent Category</TableHead>
                  <TableHead className="bg-gray-50">Primary Category</TableHead>
                  <TableHead className="bg-gray-50">Attributes</TableHead>
                  <TableHead className="bg-gray-50">Description</TableHead>
                  <TableHead className="bg-gray-50">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("isActive")}
                      className="hover:bg-gray-100"
                    >
                      Status
                      {sortBy === "isActive" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="bg-gray-50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data.map((secondaryCategory) => (
                    <TableRow
                      key={secondaryCategory.id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="font-medium">
                          {secondaryCategory.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {secondaryCategory.parentCategory?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {secondaryCategory.primaryCategory?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {secondaryCategory.attributes?.length ? (
                          <div className="flex flex-wrap gap-1 max-w-lg">
                            {secondaryCategory.attributes.map((attr) => (
                              <Badge
                                key={attr._id}
                                variant="outline"
                                className="text-xs whitespace-nowrap"
                              >
                                {attr.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div>N/A</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[200px]">
                          {secondaryCategory.description || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            secondaryCategory.isActive ? "default" : "secondary"
                          }
                          className={
                            secondaryCategory.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {secondaryCategory.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-gray-100"
                            onClick={() =>
                              router.push(
                                `/admin/category/secondaryCategory/edit/${secondaryCategory.id}`
                              )
                            }
                          >
                            <Pencil className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-red-100"
                            onClick={() => handleDelete(secondaryCategory.id!)}
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
                      colSpan={7}
                      className="h-24 text-center text-gray-500"
                    >
                      {loading ? "Loading..." : "No secondary categories found"}
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

export default SecondaryCategoryPage;
