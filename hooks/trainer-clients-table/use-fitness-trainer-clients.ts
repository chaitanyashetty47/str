"use client";

import { useState, useMemo, useCallback } from "react";
import { SortingState, PaginationState, OnChangeFn } from "@tanstack/react-table";
import { fetchTrainerClients } from "@/actions/trainer-clients/fitness/fitness-trainer-clients.action";
import useSWR from "swr";
import { TrainerClientsFilters, TrainerClientsResponse, TrainerClientRow } from "@/types/trainer-clients.types";

export const useTrainerClients = (initialData?: TrainerClientsResponse): {
  // Data
  data: TrainerClientRow[];
  total: number;
  pageCount: number;
  
  // State
  filters: TrainerClientsFilters;
  sorting: SortingState;
  pagination: PaginationState;
  isLoading: boolean;
  error: any; // SWR can return various error types
  
  // Callbacks
  updateFilters: (newFilters: Partial<TrainerClientsFilters>) => void;
  handleSortingChange: OnChangeFn<SortingState>;
  handlePaginationChange: OnChangeFn<PaginationState>;
  handleClearFilters: () => void;
  fetchClients: () => Promise<void>;
} => {
  const [filters, setFilters] = useState<TrainerClientsFilters>({
    search: "",
    dateRange: {
      from: undefined,
      to: undefined,
    },
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "joinDate", desc: true },
  ]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // SWR fetcher function
  const fetcher = async (key: string) => {
    const rawParams = JSON.parse(key) as {
      page: number;
      pageSize: number;
      search?: string;
      dateRange?: {
        from?: string;
        to?: string;
      };
      sort?: Array<{
        id: string;
        desc: boolean;
      }>;
    };
    
    // console.log('Fetcher received params:', rawParams);
    // console.log('Fetcher dateRange:', rawParams.dateRange);
    // console.log('Fetcher dateRange types:', {
    //   from: rawParams.dateRange?.from,
    //   fromType: typeof rawParams.dateRange?.from,
    //   to: rawParams.dateRange?.to,
    //   toType: typeof rawParams.dateRange?.to,
    // });
    
    // Convert ISO date strings back to Date objects
    const params = {
      ...rawParams,
      dateRange: rawParams.dateRange ? {
        from: rawParams.dateRange.from ? new Date(rawParams.dateRange.from) : undefined,
        to: rawParams.dateRange.to ? new Date(rawParams.dateRange.to) : undefined,
      } : undefined,
    };
    
    // console.log('Fetcher converted dateRange:', params.dateRange);
    // console.log('Fetcher converted dateRange types:', {
    //   from: params.dateRange?.from,
    //   fromType: typeof params.dateRange?.from,
    //   to: params.dateRange?.to,
    //   toType: typeof params.dateRange?.to,
    // });
    
    const result = await fetchTrainerClients(params);
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
    dateRange: filters.dateRange?.from && filters.dateRange?.to ? {
      from: filters.dateRange.from.toISOString(),
      to: filters.dateRange.to.toISOString(),
    } : undefined,
    sort: sorting.length > 0 ? sorting : undefined,
  });

  // Debug logging for date range
  // console.log('Current filters:', filters);
  // console.log('Date range being sent:', filters.dateRange);
  // console.log('Date range types:', {
  //   from: filters.dateRange?.from,
  //   fromType: typeof filters.dateRange?.from,
  //   to: filters.dateRange?.to,
  //   toType: typeof filters.dateRange?.to,
  // });
  // console.log('SWR key:', swrKey);
  // console.log('Parsed SWR key:', JSON.parse(swrKey));

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
        // console.error("Failed to fetch trainer clients:", error);
      },
    }
  );

  const data = swrData || initialData || {
    rows: [],
    total: 0,
    pageCount: 0,
  };

  const isLoading = swrLoading;

  // Filter clients based on current filters (client-side filtering for additional criteria)
  const filteredClients = useMemo(() => {
    return data.rows.filter((client) => {
      // Additional client-side filtering can be added here if needed
      return true;
    });
  }, [data.rows, filters]);

  // Sort clients
  const sortedClients = useMemo(() => {
    const sorted = [...filteredClients];
    
    sorting.forEach((sort) => {
      sorted.sort((a, b) => {
        const aValue = a[sort.id as keyof TrainerClientRow];
        const bValue = b[sort.id as keyof TrainerClientRow];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sort.desc ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
        }
        
        if (aValue && bValue && typeof aValue === "object" && typeof bValue === "object" && 
            'getTime' in aValue && 'getTime' in bValue) {
          return sort.desc ? (bValue as any).getTime() - (aValue as any).getTime() : (aValue as any).getTime() - (bValue as any).getTime();
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
  const updateFilters = useCallback((newFilters: Partial<TrainerClientsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    // Always reset to first page when filters change
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleSortingChange = useCallback<OnChangeFn<SortingState>>((updaterOrValue) => {
    setSorting(updaterOrValue);
    // Reset to first page when sorting changes
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handlePaginationChange = useCallback<OnChangeFn<PaginationState>>((updaterOrValue) => {
    setPagination(updaterOrValue);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      dateRange: {
        from: undefined,
        to: undefined,
      },
    });
    // Reset to first page when clearing filters
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Function to manually refetch data
  const fetchClients = useCallback(async () => {
    // console.log('Manually refetching trainer clients data...');
    // Force revalidation by passing undefined (refetch) and revalidate: true
    const result = await mutate(undefined, { revalidate: true });
    // console.log('Refetch completed:', result);
  }, [mutate]);

  return {
    // Data
    data: sortedClients,
    total: data.total,
    pageCount: data.pageCount,
    
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