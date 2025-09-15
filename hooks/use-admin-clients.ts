"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { SortingState, PaginationState, OnChangeFn } from "@tanstack/react-table";
import { AdminClient, AdminClientFilters, SubscriptionCategory } from "@/types/admin-client";
import { getAdminClients } from "@/actions/admin/admin.client.action";
import useSWR from "swr";

export const useAdminClients = () => {
  const [filters, setFilters] = useState<AdminClientFilters>({
    search: "",
    category: "ALL",
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // SWR fetcher function
  const fetcher = async (key: string) => {
    const params = JSON.parse(key);
    const result = await getAdminClients(params);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data;
  };

  // SWR key for caching
  const swrKey = JSON.stringify({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search: filters.search,
    category: filters.category,
  });

  // Use SWR for data fetching with caching
  const { data: swrData, error, isLoading: swrLoading, mutate } = useSWR(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds - reduced for faster updates
      errorRetryCount: 3,
      onError: (error) => {
        console.error("Failed to fetch admin clients:", error);
      },
    }
  );

  const data = swrData ? {
    ...swrData,
    clients: swrData.clients || [], // Add safety check
  } : {
    clients: [],
    total: 0,
    page: 0,
    pageSize: 10,
    totalPages: 0,
  };

  const isLoading = swrLoading;

  // Filter clients based on current filters (client-side filtering for additional criteria)
  const filteredClients = useMemo(() => {
    return (data.clients || []).filter((client) => {
      // Additional client-side filtering can be added here if needed
      return true;
    });
  }, [data.clients, filters]);

  // Sort clients
  const sortedClients = useMemo(() => {
    const sorted = [...filteredClients];
    
    sorting.forEach((sort) => {
      sorted.sort((a, b) => {
        const aValue = a[sort.id as keyof AdminClient];
        const bValue = b[sort.id as keyof AdminClient];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sort.desc ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
        }
        
        if (aValue instanceof Date && bValue instanceof Date) {
          return sort.desc ? bValue.getTime() - aValue.getTime() : aValue.getTime() - bValue.getTime();
        }
        
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sort.desc ? bValue - aValue : aValue - bValue;
        }
        
        return 0;
      });
    });
    
    return sorted;
  }, [filteredClients, sorting]);

  // Callbacks
  const updateFilters = useCallback((newFilters: Partial<AdminClientFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to first page
  }, []);

  const handleSortingChange = useCallback<OnChangeFn<SortingState>>((updaterOrValue) => {
    setSorting(updaterOrValue);
  }, []);

  const handlePaginationChange = useCallback<OnChangeFn<PaginationState>>((updaterOrValue) => {
    setPagination(updaterOrValue);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      category: "ALL",
    });
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Function to manually refetch data
  const fetchClients = useCallback(async () => {
    console.log('Manually refetching clients data...');
    // Force revalidation by passing undefined (refetch) and revalidate: true
    const result = await mutate(undefined, { revalidate: true });
    console.log('Refetch completed:', result);
  }, [mutate]);

  return {
    // Data
    clients: sortedClients,
    total: data.total,
    pageCount: data.totalPages,
    
    // State
    filters,
    sorting,
    pagination,
    isLoading,
    error,
    
    // Callbacks
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    fetchClients,
  };
};
