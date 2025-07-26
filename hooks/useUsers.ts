/* eslint-disable @typescript-eslint/no-explicit-any */
// /hooks/useUsers.ts
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseUsersResult<T> {
  data: T | undefined;
  error: any;
  isLoading: boolean;
  mutate: () => void;
}

export function useUsers<T = any>(id?: string): UseUsersResult<T> {
  // Determine the API endpoint based on the id presence.
  const endpoint = id ? `/api/admin/user/${id}` : `/api/admin/user`;

  const { data, error, mutate } = useSWR<any>(endpoint, fetcher);

  // For single user requests, extract the user data from the API response
  const transformedData = id && data?.success ? data.data : data;

  return {
    data: transformedData,
    error,
    isLoading: !data && !error,
    mutate,
  };
}
