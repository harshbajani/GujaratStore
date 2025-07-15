"use client";
import { PencilLine } from "lucide-react";
import { deleteBlog, getAllBlogs } from "@/lib/actions/admin/blog.actions";
import React, { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
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

const BlogsPage = () => {
  // * useStates and hooks
  const [data, setData] = useState<TransformedBlog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false,
  });

  // Server-side state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const { toast } = useToast();

  // * fetching data with server-side pagination
  const fetchBlogPosts = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }
      try {
        const params: PaginationParams = {
          page: currentPage,
          limit: pageSize,
          search: searchTerm,
          sortBy,
          sortOrder,
        };

        const response = await getAllBlogs(params);

        if (response.success && response.data && response.pagination) {
          setData(response.data);
          setPagination(response.pagination);
        } else {
          throw new Error(response.error || "Failed to fetch blogs");
        }
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        toast({
          title: "Error",
          description: "Failed to fetch blog posts",
          variant: "destructive",
        });
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [currentPage, pageSize, searchTerm, sortBy, sortOrder, toast]
  );

  // * deleting data
  const handleDelete = async (id: string) => {
    try {
      await deleteBlog(id);
      // Refresh current page or go to previous page if current page becomes empty
      const newTotalItems = pagination.totalItems - 1;
      const newTotalPages = Math.ceil(newTotalItems / pageSize);

      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else {
        await fetchBlogPosts();
      }

      toast({
        title: "Success",
        description: "Blog post deleted successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete blog post:", error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    }
  };

  // * Handle search with debounce
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setIsSearching(true);
        setSearchTerm(searchInput);
        setCurrentPage(1); // Reset to first page when searching
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchTerm]);

  // Reset searching state when search completes
  useEffect(() => {
    if (isSearching && !loading) {
      setIsSearching(false);
    }
  }, [isSearching, loading]);

  // * Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // * Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // * Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // * Fetch data when dependencies change
  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]); // Removed fetchBlogPosts from dependencies to prevent infinite loop

  // Separate effect for search
  useEffect(() => {
    if (searchTerm !== searchInput) return; // Only fetch if search term has actually changed
    fetchBlogPosts(false); // Don't show loader for search
  }, [searchTerm, fetchBlogPosts, searchInput]);

  // * Generate page numbers for pagination
  const getPageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center gap-3">
        <PencilLine className="text-brand h-8 w-8" />
        <h1 className="h1">Blogs</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search blogs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pr-10"
              />
              {isSearching ||
                (loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                ))}
            </div>
            <Link prefetch href="/admin/blogs/add">
              <Button className="bg-brand hover:bg-brand/90 text-white">
                Add Blog
              </Button>
            </Link>
          </div>

          <div className="border rounded-lg relative">
            {isSearching && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                  <span className="text-sm text-gray-600">Searching...</span>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-gray-50">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("heading")}
                      className="font-medium"
                    >
                      Title
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="bg-gray-50">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("user")}
                      className="font-medium"
                    >
                      Author
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="bg-gray-50">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("date")}
                      className="font-medium"
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="bg-gray-50">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("category")}
                      className="font-medium"
                    >
                      Category
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="bg-gray-50">Description</TableHead>
                  <TableHead className="bg-gray-50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length ? (
                  data.map((blog) => (
                    <TableRow key={blog.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {blog.heading}
                      </TableCell>
                      <TableCell>{blog.user}</TableCell>
                      <TableCell>{blog.date}</TableCell>
                      <TableCell>{blog.category}</TableCell>
                      <TableCell className="max-w-md">
                        {blog.description.length > 100
                          ? blog.description.slice(0, 100) + "..."
                          : blog.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-gray-100"
                            onClick={() =>
                              router.push(`/admin/blogs/edit/${blog.id}`)
                            }
                          >
                            <Pencil className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-red-100"
                            onClick={() => handleDelete(blog.id)}
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
                      colSpan={6}
                      className="h-24 text-center text-gray-500"
                    >
                      {isSearching ? "Searching..." : "No blogs found"}
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
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Showing{" "}
                {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{" "}
                {Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  pagination.totalItems
                )}{" "}
                of {pagination.totalItems} results
              </span>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogsPage;
