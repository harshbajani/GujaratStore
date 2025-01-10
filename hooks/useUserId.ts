import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/actions/user.actions";

// Define return type for the hook
interface UseUserIdReturn {
  userId: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useUserId = (): UseUserIdReturn => {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserId = async () => {
    if (!session?.user?.email) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await getCurrentUser();

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch user ID");
      }

      setUserId(response.data?._id?.toString() || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserId();
    } else if (status === "unauthenticated") {
      setUserId(null);
      setIsLoading(false);
    }
  }, [status]);

  const refetch = async () => {
    setIsLoading(true);
    await fetchUserId();
  };

  return { userId, isLoading, error, refetch };
};
