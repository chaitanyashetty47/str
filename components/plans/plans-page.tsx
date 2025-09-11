'use client';

import { useState } from "react";
import { WorkoutCategory } from "@prisma/client";
import { PlansTable } from "./plans-table";

export interface PlansFilters {
  status: "active" | "upcoming" | "previous" | "all";
  search: string;
  category: WorkoutCategory | "all";
}

export function PlansPage() {
  const [filters, setFilters] = useState<PlansFilters>({
    status: "active", // Default to active plans
    search: "",
    category: "all",
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState([
    { id: "start_date", desc: true }, // Default sort by start date, newest first
  ]);

  const handleFiltersChange = (newFilters: Partial<PlansFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const handlePaginationChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleSortChange = (newSorting: any) => {
    setSorting(newSorting);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Workout Plans</h1>
      </div>

      {/* Table Card */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <PlansTable
            filters={filters}
            pagination={pagination}
            sorting={sorting}
            onFiltersChange={handleFiltersChange}
            onPaginationChange={handlePaginationChange}
            onSortChange={handleSortChange}
          />
        </div>
      </div>
    </div>
  );
}