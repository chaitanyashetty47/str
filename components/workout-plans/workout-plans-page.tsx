"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { WorkoutPlansFilters } from "./workout-plans-filters";
import { WorkoutPlansTable } from "./workout-plans-table";
import { useWorkoutPlans } from "@/hooks/use-workout-plans";

export function WorkoutPlansPage() {
  const {
    plans,
    total,
    pageCount,
    filters,
    sorting,
    pagination,
    isLoading,
    error,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    fetchPlans,
  } = useWorkoutPlans();

  // Initial data fetch
  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Workout Plans</h1>
        <div className="flex items-center gap-4">
          {/* Add new plan button can be added here */}
        </div>
      </div>

      {/* Table Card */}
      <Card className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <WorkoutPlansFilters
            filters={filters}
            onFiltersChange={updateFilters}
          />
        </div>
        <div className="p-3">
          <WorkoutPlansTable
            plans={plans}
            sorting={sorting}
            pagination={pagination}
            pageCount={pageCount}
            onSort={handleSortingChange}
            onPaginationChange={handlePaginationChange}
            isLoading={isLoading}
          />
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-600">Failed to load workout plans.</p>
          <button
            onClick={fetchPlans}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No workout plans found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first workout plan to get started.
          </p>
        </div>
      )}
    </div>
  );
} 