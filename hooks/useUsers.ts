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
  const endpoint = id ? `/api/admin/user?id=${id}` : `/api/admin/user`;

  const { data, error, mutate } = useSWR<T>(endpoint, fetcher);

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
  };
}
