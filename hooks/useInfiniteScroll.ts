/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";

interface UseInfiniteScrollOptions {
  fetchFunction: (page: number) => Promise<PaginatedResponse<any>>;
  initialData?: any[];
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadMore: () => void;
  refresh: () => void;
  ref: (node?: Element | null) => void;
  inView: boolean;
}

export function useInfiniteScroll<T>({
  fetchFunction,
  initialData = [],
  enabled = true,
  threshold = 0.1,
  rootMargin = "100px",
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchingRef = useRef(false);
  const initialLoadRef = useRef(false);

  const { ref, inView } = useInView({
    threshold,
    rootMargin,
  });

  const fetchPage = useCallback(
    async (page: number, append: boolean = true) => {
      if (fetchingRef.current || !enabled) return;

      fetchingRef.current = true;
      setError(null);

      try {
        if (page === 1 && !append) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const response = await fetchFunction(page);

        if (response.success && response.data && Array.isArray(response.data)) {
          const responseData = response.data as T[];
          if (append && page > 1) {
            setData((prevData) => [...prevData, ...responseData]);
          } else {
            setData(responseData);
          }

          setHasNextPage(response.pagination?.hasNext ?? false);
          setCurrentPage(page);
        } else {
          setError(response.error || "Failed to fetch data");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [fetchFunction, enabled]
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isLoadingMore && !fetchingRef.current) {
      fetchPage(currentPage + 1);
    }
  }, [hasNextPage, isLoadingMore, currentPage, fetchPage]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    setHasNextPage(true);
    setData([]);
    fetchPage(1, false);
  }, [fetchPage]);

  // Initial load
  useEffect(() => {
    if (!initialLoadRef.current && enabled && initialData.length === 0) {
      initialLoadRef.current = true;
      fetchPage(1, false);
    }
  }, [fetchPage, enabled, initialData.length]);

  // Load more when the sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isLoadingMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasNextPage, isLoadingMore, isLoading, loadMore]);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    loadMore,
    refresh,
    ref,
    inView,
  };
}
