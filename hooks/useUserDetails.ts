// hooks/useUserDetails.ts
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/actions/user.actions"; // Import the server action
import { IAddress } from "@/types";

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
  addresses?: IAddress[];
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
      const response = await getCurrentUser(); // Call server action

      if (!response.success) {
        throw new Error(response.message);
      }

      // Check if response.data is defined and set user accordingly
      if (response.data) {
        setUser({
          ...response.data,
          _id: response.data._id.toString(),
        });
      } else {
        setUser(null); // Set user to null if no data is returned
      }

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
