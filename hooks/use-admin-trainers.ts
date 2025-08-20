"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { SortingState, PaginationState, OnChangeFn } from "@tanstack/react-table";
import { AdminTrainer, AdminTrainerFilters, TrainerCategory } from "@/types/admin-trainer";
import { getAdminTrainers } from "@/actions/admin/admin.trainer.action";
import useSWR from "swr";

export const useAdminTrainers = () => {
  const [filters, setFilters] = useState<AdminTrainerFilters>({
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

  // Transform server data to match our types
  const transformTrainers = (serverData: any): AdminTrainer[] => {
    if (!serverData?.trainers) return [];

    return serverData.trainers.map((trainer: any): AdminTrainer => ({
      id: trainer.id,
      name: trainer.name,
      email: trainer.email,
      role: trainer.role,
      createdAt: new Date(trainer.createdAt),
      category: trainer.category as TrainerCategory | "UNKNOWN",
      clientCount: trainer.clientCount,
      clientAssignments: trainer.clientAssignments || [],
    }));
  };

  // SWR fetcher function
  const fetcher = async (key: string) => {
    const params = JSON.parse(key);
    const result = await getAdminTrainers(params);
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
      dedupingInterval: 5000, // 5 seconds
      errorRetryCount: 3,
      onError: (error) => {
        console.error("Failed to fetch admin trainers:", error);
      },
    }
  );

  const data = swrData ? {
    ...swrData,
    trainers: transformTrainers(swrData),
  } : {
    trainers: [],
    total: 0,
    page: 0,
    pageSize: 10,
    totalPages: 0,
  };

  const isLoading = swrLoading;

  // Filter trainers based on current filters (client-side filtering for additional criteria)
  const filteredTrainers = useMemo(() => {
    return data.trainers.filter((trainer) => {
      // Additional client-side filtering can be added here if needed
      return true;
    });
  }, [data.trainers, filters]);

  // Sort trainers
  const sortedTrainers = useMemo(() => {
    const sorted = [...filteredTrainers];
    
    sorting.forEach((sort) => {
      sorted.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        // Safe property access
        switch (sort.id) {
          case "name":
            aValue = a.name;
            bValue = b.name;
            break;
          case "email":
            aValue = a.email;
            bValue = b.email;
            break;
          case "role":
            aValue = a.role;
            bValue = b.role;
            break;
          case "category":
            aValue = a.category;
            bValue = b.category;
            break;
          case "clientCount":
            aValue = a.clientCount;
            bValue = b.clientCount;
            break;
          case "createdAt":
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          default:
            return 0;
        }
        
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
  }, [filteredTrainers, sorting]);

  // Callbacks
  const updateFilters = useCallback((newFilters: Partial<AdminTrainerFilters>) => {
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
  const fetchTrainers = useCallback(async () => {
    console.log('Manually refetching trainers data...');
    const result = await mutate(undefined, { revalidate: true });
    console.log('Refetch completed:', result);
  }, [mutate]);

  return {
    // Data
    trainers: sortedTrainers,
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
    fetchTrainers,
  };
};
