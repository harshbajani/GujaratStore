/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";
import { IReferral } from "@/types";
import { toast } from "@/hooks/use-toast";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UseReferralsOptions {
  initialPage?: number;
  initialLimit?: number;
  apiBasePath?: string;
}

export function useReferrals({
  initialPage = 1,
  initialLimit = 10,
  apiBasePath = "/api/referrals",
}: UseReferralsOptions = {}) {
  // 1. useState calls (always same order)
  const [referrals, setReferrals] = useState<IReferral[]>([]);
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
  const [sortBy, setSortBy] = useState<keyof IReferral>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 2. useRef calls
  const searchDebounce = useRef<NodeJS.Timeout | null>(null);

  // 3. useCallback hooks (always same order)
  const fetchReferrals = useCallback(
    async (page = pagination.currentPage, limit = pagination.itemsPerPage) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          paginated: "true",
          page: String(page),
          limit: String(limit),
          search: searchTerm,
          sortBy,
          sortOrder,
        });
        const res = await fetch(`${apiBasePath}?${params}`);
        const json = await res.json();
        if (json.success) {
          setReferrals(json.data);
          setPagination(json.pagination);
        } else {
          throw new Error(json.error || "Failed to fetch referrals");
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
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
    fetchReferrals(pagination.currentPage, pagination.itemsPerPage);
  }, [fetchReferrals, pagination.currentPage, pagination.itemsPerPage]);

  const createReferral = useCallback(
    async (data: Partial<IReferral>) => {
      try {
        const res = await fetch(apiBasePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);

        setReferrals((prev) => [json.data, ...prev]);
        toast({ title: "Created!", variant: "default" });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
        fetchReferrals();
      }
    },
    [apiBasePath, fetchReferrals]
  );

  const deleteReferral = useCallback(
    async (id: string) => {
      try {
        // Optimistic UI update
        setReferrals((prev) => prev.filter((r) => r._id !== id));

        const res = await fetch(`${apiBasePath}?id=${id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);

        toast({ title: "Deleted!", variant: "default" });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
        fetchReferrals();
      }
    },
    [apiBasePath, fetchReferrals]
  );

  // 4. useEffect (initial load)
  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // 5. Handler functions (no hooks)
  const onSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchReferrals(1), 500);
  };

  const onPageChange = (page: number) => fetchReferrals(page);
  const onLimitChange = (limit: number) => fetchReferrals(1, limit);

  const onSortChange = (field: keyof IReferral) => {
    const nextOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(nextOrder);
    fetchReferrals(1, pagination.itemsPerPage);
  };

  // 6. Return API
  return {
    referrals,
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
    createReferral,
    deleteReferral,
  };
}
