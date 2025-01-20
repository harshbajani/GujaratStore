"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getStore } from "@/lib/actions/storeProfile.actions";

export const useStoreId = () => {
  const { data: session, status } = useSession();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreId = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          setLoading(true);

          // Call the server action to get the store data
          const response = await getStore();
          if (response.success && response.data) {
            // Assuming the store ID is part of the response data
            setStoreId(response.data._id || null);
          } else {
            throw new Error(response.error || "Failed to fetch store ID");
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Unknown error occurred"
          );
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        setLoading(false);
        setError("User is not authenticated");
      }
    };

    fetchStoreId();
  }, [status, session]);

  return { storeId, loading, error };
};
