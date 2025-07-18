/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface UseDiscountsOptions {
  initialPage?: number;
  initialLimit?: number;
  apiBasePath?: string;
}

export function useDiscounts({
  initialPage = 1,
  initialLimit = 10,
  apiBasePath = "/api/discounts",
}: UseDiscountsOptions = {}) {
  // 1. useState calls (always same order)
  const [discounts, setDiscounts] = useState<IDiscount[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: initialPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: initialLimit,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof IDiscount>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 2. useRef calls
  const searchDebounce = useRef<NodeJS.Timeout | null>(null);

  // 3. useCallback hooks (always same order)
  const fetchDiscounts = useCallback(
    async (page = pagination.currentPage, limit = pagination.itemsPerPage) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          search: searchTerm,
          sortBy,
          sortOrder,
        });
        const res = await fetch(`${apiBasePath}?${params}`);
        const json = await res.json();
        if (json.success) {
          // Remove the filter that was causing issues
          // All discounts should be displayed, not just category discounts
          setDiscounts(json.data);
          setPagination(json.pagination);
        } else {
          throw new Error(json.error || "Failed to fetch discounts");
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
        console.error("Fetch discounts error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [
      apiBasePath,
      pagination.currentPage,
      pagination.itemsPerPage,
      searchTerm,
      sortBy,
      sortOrder,
    ]
  );

  const refetch = useCallback(() => {
    fetchDiscounts(pagination.currentPage, pagination.itemsPerPage);
  }, [fetchDiscounts, pagination.currentPage, pagination.itemsPerPage]);

  const createDiscount = useCallback(
    async (data: Partial<IDiscount>) => {
      try {
        const res = await fetch(apiBasePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success)
          throw new Error(json.error || "Failed to create discount");

        // Refetch to get the latest data with correct pagination
        await fetchDiscounts(1, pagination.itemsPerPage);

        toast({
          title: "Success",
          description: "Discount created successfully",
          variant: "default",
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
        console.error("Create discount error:", err);
      }
    },
    [apiBasePath, fetchDiscounts, pagination.itemsPerPage]
  );

  const updateDiscount = useCallback(
    async (id: string, data: Partial<IDiscount>) => {
      try {
        const res = await fetch(apiBasePath, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: id, ...data }),
        });
        const json = await res.json();
        if (!json.success)
          throw new Error(json.error || "Failed to update discount");

        // Optimistically update the discount in state
        if (json.data) {
          setDiscounts((prev) =>
            prev.map((discount) =>
              discount._id === id ? { ...discount, ...json.data } : discount
            )
          );
        } else {
          // If no data returned, refetch to be safe
          await fetchDiscounts(pagination.currentPage, pagination.itemsPerPage);
        }

        toast({
          title: "Success",
          description: "Discount updated successfully",
          variant: "default",
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
        console.error("Update discount error:", err);
        // Refetch on error to restore correct state
        fetchDiscounts(pagination.currentPage, pagination.itemsPerPage);
      }
    },
    [
      apiBasePath,
      fetchDiscounts,
      pagination.currentPage,
      pagination.itemsPerPage,
    ]
  );

  const deleteDiscount = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${apiBasePath}?id=${id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!json.success)
          throw new Error(json.error || "Failed to delete discount");

        // Optimistically remove the discount from state
        setDiscounts((prev) => {
          const newDiscounts = prev.filter((discount) => discount._id !== id);

          // Update pagination info
          setPagination((prevPagination) => {
            const newTotalItems = prevPagination.totalItems - 1;
            const newTotalPages = Math.ceil(
              newTotalItems / prevPagination.itemsPerPage
            );

            return {
              ...prevPagination,
              totalItems: newTotalItems,
              totalPages: newTotalPages,
              hasNext: prevPagination.currentPage < newTotalPages,
              hasPrev: prevPagination.currentPage > 1,
            };
          });

          return newDiscounts;
        });

        // Check if we need to navigate to a different page
        const remainingItems = pagination.totalItems - 1;
        const newTotalPages = Math.ceil(
          remainingItems / pagination.itemsPerPage
        );

        // If current page becomes empty and we're not on page 1, go to previous page
        if (pagination.currentPage > newTotalPages && newTotalPages > 0) {
          fetchDiscounts(newTotalPages, pagination.itemsPerPage);
        }

        toast({
          title: "Success",
          description: "Discount deleted successfully",
          variant: "default",
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
        console.error("Delete discount error:", err);
        // Refetch on error to restore correct state
        fetchDiscounts(pagination.currentPage, pagination.itemsPerPage);
      }
    },
    [
      apiBasePath,
      fetchDiscounts,
      pagination.currentPage,
      pagination.itemsPerPage,
      pagination.totalItems,
    ]
  );

  // 4. useEffect (initial load)
  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // 5. Handler functions (no hooks)
  const onSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchDiscounts(1), 500);
  };

  const onPageChange = (page: number) => fetchDiscounts(page);
  const onLimitChange = (limit: number) => fetchDiscounts(1, limit);

  const onSortChange = (field: keyof IDiscount) => {
    const nextOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(nextOrder);
    fetchDiscounts(1, pagination.itemsPerPage);
  };

  // 6. Return API
  return {
    discounts,
    pagination,
    isLoading,
    searchTerm,
    sortBy,
    sortOrder,
    onSearchChange,
    onPageChange,
    onLimitChange,
    onSortChange,
    refetch,
    createDiscount,
    updateDiscount,
    deleteDiscount,
  };
}
