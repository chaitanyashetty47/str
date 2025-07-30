"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { SortingState, PaginationState } from "@tanstack/react-table";
import { SubscriptionStatus } from "@prisma/client";
import { useAction } from "./useAction";
import { fetchTrainerClients } from "@/actions/trainer-clients/trainer-clients.action";
import { 
  TrainerClientsFilters, 
  TrainerClientsResponse, 
  TrainerClientRow 
} from "@/types/trainer-clients.types";

export function useTrainerClients(initialData?: TrainerClientsResponse) {
  // State management
  const [filters, setFilters] = useState<TrainerClientsFilters>({
    search: "",
    status: "all",
  });
  
  const [sorting, setSorting] = useState<SortingState>([
    { id: "joinDate", desc: true }
  ]);
  
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Server action hook
  const {
    execute: fetchClients,
    data: actionData,
    isLoading,
    error,
  } = useAction(fetchTrainerClients, {
    onError: (error) => {
      console.error("Failed to fetch trainer clients:", error);
    },
  });

  // Determine current data (use initial data on first load, then action data)
  const currentData = useMemo(() => {
    if (actionData) return actionData;
    if (initialData) return initialData;
    return { rows: [], total: 0, pageCount: 0 };
  }, [actionData, initialData]);

  // Fetch data when query parameters change
  const refreshData = useCallback(() => {
    const query = {
      page: pagination.pageIndex,
      pageSize: pagination.pageSize,
      search: filters.search || undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      sort: sorting.length > 0 ? sorting : undefined,
    };

    fetchClients(query);
  }, [filters, sorting, pagination, fetchClients]);

  // Auto-refresh when dependencies change (except on initial mount if we have initialData)
  useEffect(() => {
    // Don't fetch on initial mount if we have initial data
    if (initialData && !actionData) {
      return;
    }
    refreshData();
  }, [refreshData, initialData, actionData]);

  // Callback functions for UI components
  const updateFilters = useCallback((newFilters: Partial<TrainerClientsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
  }, []);

  const handlePaginationChange = useCallback((newPagination: PaginationState) => {
    setPagination(newPagination);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      status: "all",
    });
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  return {
    // Data
    data: currentData.rows,
    total: currentData.total,
    pageCount: currentData.pageCount,
    
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
    handleRefresh,
  };
} 