/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useCallback, useEffect } from "react";
import { useInfiniteScroll } from "./useInfiniteScroll";

interface UseBlogsInfiniteProps {
  initialLimit?: number;
  searchTerm?: string;
}

export const useBlogsInfinite = ({
  initialLimit = 12,
  searchTerm = "",
}: UseBlogsInfiniteProps) => {
  const [allBlogs, setAllBlogs] = useState<TransformedBlog[]>([]);

  // Fetch function for infinite scroll
  const fetchBlogs = useCallback(
    async (page: number): Promise<PaginatedResponse<TransformedBlog>> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: initialLimit.toString(),
        search: searchTerm,
      });

      const response = await fetch(`/api/blogs?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.data) {
        // Update allBlogs for search filtering if needed
        if (page === 1) {
          setAllBlogs(data.data);
        } else {
          setAllBlogs((prev) => [...prev, ...data.data]);
        }
      }

      return data;
    },
    [initialLimit, searchTerm]
  );

  const {
    data: blogs,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    refresh,
    ref: loadMoreRef,
  } = useInfiniteScroll<TransformedBlog>({
    fetchFunction: fetchBlogs,
    enabled: true,
    threshold: 0.1,
    rootMargin: "200px",
  });

  // Refresh when search term changes
  useEffect(() => {
    refresh();
  }, [searchTerm, refresh]);

  // Filter blogs based on search term (client-side filtering for better UX)
  const filteredBlogs = blogs.filter((blog) => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      blog.heading.toLowerCase().includes(lowerSearchTerm) ||
      blog.description.toLowerCase().includes(lowerSearchTerm)
    );
  });

  return {
    blogs: filteredBlogs,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    refresh,
    loadMoreRef,
  };
};
