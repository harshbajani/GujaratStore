// hooks/useUserDetails.ts
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";

// Define types for the hook's return values
interface UseUserDetailsReturn {
  user: VendorDetails | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Define the user details type based on your User model
interface VendorDetails {
  _id: string;
  name: string;
  email: string;
  phone: string;
  addresses?: IAddress[];
  alternativeContact?: string;
  bankDetails?: BankDetails;
}

export const useVendorDetails = (): UseUserDetailsReturn => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<VendorDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVendorDetails = async () => {
    if (!session?.user?.email) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await getCurrentVendor(); // Call server action

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
      fetchVendorDetails();
    } else if (status === "unauthenticated") {
      setUser(null);
      setIsLoading(false);
    }
  }, [status]);

  const refetch = async () => {
    setIsLoading(true);
    await fetchVendorDetails();
  };

  return { user, isLoading, error, refetch };
};
