'use client';

import { useState, useEffect } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";
import { SortingState, PaginationState } from "@tanstack/react-table";
import { WorkoutCategory } from "@prisma/client";
import { getAllWorkoutPlans, GetAllWorkoutPlansInput } from "@/actions/client-workout/get-all-workout-plans.action";
import { PlansFilters } from "./plans-page";
import { PlansTableColumns } from "./plans-table-columns";
import { PlansFilters as PlansFiltersComponent } from "./plans-filters";
import { PlansTablePagination } from "./plans-table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface PlansTableProps {
  filters: PlansFilters;
  pagination: PaginationState;
  sorting: SortingState;
  onFiltersChange: (filters: Partial<PlansFilters>) => void;
  onPaginationChange: (pagination: PaginationState) => void;
  onSortChange: (sorting: SortingState) => void;
}

export function PlansTable({
  filters,
  pagination,
  sorting,
  onFiltersChange,
  onPaginationChange,
  onSortChange,
}: PlansTableProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns = PlansTableColumns();

  const table = useReactTable({
    data: plans,
    columns,
    state: {
      sorting,
      pagination,
    },
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    onSortingChange: (updaterOrValue) => {
      const newSorting = typeof updaterOrValue === 'function' 
        ? updaterOrValue(sorting) 
        : updaterOrValue;
      onSortChange(newSorting);
    },
    onPaginationChange: (updaterOrValue) => {
      const newPagination = typeof updaterOrValue === 'function' 
        ? updaterOrValue(pagination) 
        : updaterOrValue;
      onPaginationChange(newPagination);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  // Fetch data when filters, pagination, or sorting changes
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);

      try {
        const input: GetAllWorkoutPlansInput = {
          page: pagination.pageIndex,
          pageSize: pagination.pageSize,
          search: filters.search || undefined,
          category: filters.category === "all" ? undefined : filters.category,
          status: filters.status,
          sortBy: sorting[0]?.id as any || "start_date",
          sortOrder: sorting[0]?.desc ? "desc" : "asc",
        };

        const result = await getAllWorkoutPlans(input);

        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setPlans(result.data.plans);
          setTotalCount(result.data.totalCount);
        }
      } catch (err) {
        setError("Failed to fetch workout plans");
        console.error("Fetch plans error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [filters, pagination, sorting]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <PlansFiltersComponent
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      {/* Table */}
      <div className="space-y-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <div className="flex h-4 w-4 items-center justify-center">
                            {header.column.getIsSorted() === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: pagination.pageSize }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                </TableRow>
              ))
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No workout plans found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Separator />

        {/* Pagination */}
        <PlansTablePagination table={table} />
      </div>
    </div>
  );
}

// Import statements for icons and utilities
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";