import useSWR from "swr";
import { useState, useCallback } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseVendorsResult<T> {
  data: T | undefined;
  error: any;
  isLoading: boolean;
  mutate: () => void;
}

// Legacy hook - unchanged for backward compatibility
export function useVendors<T = any>(id?: string): UseVendorsResult<T> {
  // Determine the API endpoint based on the id presence.
  const endpoint = id ? `/api/admin/vendor?id=${id}` : `/api/admin/vendor`;

  const { data, error, mutate } = useSWR<T>(endpoint, fetcher);

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
  };
}

// New paginated hook using SWR
export function useVendorsPaginated(
  params?: PaginationParams
): UseVendorsResult<PaginatedResponse<VendorResponse>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

  // Create endpoint with query params
  const endpoint = `/api/admin/vendor?${queryParams.toString()}`;

  const { data, error, mutate } = useSWR<PaginatedResponse<VendorResponse>>(
    endpoint,
    fetcher
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
  };
}

// Hook for vendor search with state management
export function useVendorSearch(initialParams?: PaginationParams) {
  const [searchParams, setSearchParams] = useState<PaginationParams>(
    initialParams || {
      page: 1,
      limit: 10,
      search: "",
      sortBy: "name",
      sortOrder: "asc",
    }
  );

  const result = useVendorsPaginated(searchParams);

  const updateSearch = useCallback((newParams: Partial<PaginationParams>) => {
    setSearchParams((prev) => ({
      ...prev,
      ...newParams,
      // Reset to page 1 when search/filter changes
      page:
        newParams.search !== undefined || newParams.sortBy !== undefined
          ? 1
          : newParams.page || prev.page,
    }));
  }, []);

  const resetSearch = useCallback(() => {
    setSearchParams(
      initialParams || {
        page: 1,
        limit: 10,
        search: "",
        sortBy: "name",
        sortOrder: "asc",
      }
    );
  }, [initialParams]);

  return {
    vendors: result.data?.data || [],
    pagination: result.data?.pagination || null,
    loading: result.isLoading,
    error: result.error,
    searchParams,
    updateSearch,
    resetSearch,
    mutate: result.mutate,
  };
}
