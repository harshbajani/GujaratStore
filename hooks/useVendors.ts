// /hooks/useUsers.ts
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseVendorsResult<T> {
  data: T | undefined;
  error: any;
  isLoading: boolean;
  mutate: () => void;
}

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
