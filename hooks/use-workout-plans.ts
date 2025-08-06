"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { SortingState, PaginationState, OnChangeFn } from "@tanstack/react-table";
import { WorkoutPlan, WorkoutPlanFilters, WorkoutPlanStatus, DateStatus } from "@/types/workout-plan";
import { getAllPlansTrainer } from "@/actions/trainer-clients/get-all-plans-trainer";
import useSWR from "swr";

export const useWorkoutPlans = () => {
  const [filters, setFilters] = useState<WorkoutPlanFilters>({
    status: "PUBLISHED",
    dateStatus: "CURRENT",
    search: "",
    dateRange: { from: undefined, to: undefined },
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // SWR fetcher function
  const fetcher = async (key: string) => {
    const params = JSON.parse(key);
    const result = await getAllPlansTrainer(params);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data;
  };

  // SWR key for caching
  const swrKey = JSON.stringify({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
  });

  // Use SWR for data fetching with caching
  const { data: swrData, error, isLoading: swrLoading, mutate } = useSWR(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 3,
      onError: (error) => {
        console.error("Failed to fetch plans:", error);
      },
    }
  );

  // Transform server data to match our types
  const transformPlans = (serverData: any): WorkoutPlan[] => {
    if (!serverData?.plans) return [];
    
    return serverData.plans.map((plan: any): WorkoutPlan => ({
      ...plan,
      // Ensure dateStatus is properly typed
      dateStatus: (plan.dateStatus === "CURRENT" || plan.dateStatus === "EXPIRED") 
        ? plan.dateStatus as DateStatus 
        : "CURRENT" as DateStatus,
      // Ensure status is properly typed
      status: (plan.status === "DRAFT" || plan.status === "PUBLISHED" || plan.status === "ARCHIVED")
        ? plan.status as WorkoutPlanStatus
        : "DRAFT" as WorkoutPlanStatus,
      // Ensure description can be null
      description: plan.description || null,
      // Convert dates
      start_date: new Date(plan.start_date),
      end_date: new Date(plan.end_date),
      created_at: new Date(plan.created_at),
    }));
  };

  const data = swrData ? {
    ...swrData,
    plans: transformPlans(swrData),
  } : {
    plans: [],
    total: 0,
    page: 0,
    pageSize: 10,
    totalPages: 0,
  };

  const isLoading = swrLoading;

  // Filter plans based on current filters
  const filteredPlans = useMemo(() => {
    return data.plans.filter((plan) => {
      // Status filter
      if (filters.status !== "all" && plan.status !== filters.status) {
        return false;
      }

      // Date status filter
      if (filters.dateStatus !== "all" && plan.dateStatus !== filters.dateStatus) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableFields = [
          plan.title,
          plan.client.name,
          plan.client.email,
        ].map((field) => field.toLowerCase());

        if (!searchableFields.some((field) => field.includes(searchLower))) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const planStartDate = new Date(plan.start_date);
        if (filters.dateRange.from && planStartDate < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to && planStartDate > filters.dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }, [data.plans, filters]);

  // Sort plans
  const sortedPlans = useMemo(() => {
    const sorted = [...filteredPlans];
    
    sorting.forEach((sort) => {
      sorted.sort((a, b) => {
        const aValue = a[sort.id as keyof WorkoutPlan];
        const bValue = b[sort.id as keyof WorkoutPlan];
        
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
  }, [filteredPlans, sorting]);

  // Callbacks
  const updateFilters = useCallback((newFilters: Partial<WorkoutPlanFilters>) => {
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
      status: "PUBLISHED",
      dateStatus: "CURRENT",
      search: "",
      dateRange: { from: undefined, to: undefined },
    });
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Function to manually refetch data
  const fetchPlans = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    // Data
    plans: sortedPlans as WorkoutPlan[],
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
    fetchPlans,
  };
}; 