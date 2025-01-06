// hooks/useUserDetails.ts
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

// Define types for the hook's return values
interface UseUserDetailsReturn {
  user: UserDetails | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Define the user details type based on your User model
interface UserDetails {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useUserDetails = (): UseUserDetailsReturn => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserDetails = async () => {
    if (!session?.user?.email) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const data = await response.json();
      setUser(data.user);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserDetails();
    } else if (status === "unauthenticated") {
      setUser(null);
      setIsLoading(false);
    }
  }, [status]);

  const refetch = async () => {
    setIsLoading(true);
    await fetchUserDetails();
  };

  return { user, isLoading, error, refetch };
};
