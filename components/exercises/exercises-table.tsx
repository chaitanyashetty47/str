"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ExercisesTableColumns } from "./exercises-table-columns";
import { ExercisesFilters } from "./exercises-filters";
import { ExercisesTablePagination } from "./exercises-table-pagination";
import { getExercisesWithFilters } from "@/actions/exercise_list/get-exercises-with-filters.action";
import { Exercise, ExerciseFilters } from "./exercises-page";
import { BodyPart } from "@prisma/client";

interface ExercisesTableProps {
  filters: ExerciseFilters;
  onFiltersChange: (filters: Partial<ExerciseFilters>) => void;
  onEditExercise: (exercise: Exercise) => void;
}

export function ExercisesTable({ filters, onFiltersChange, onEditExercise }: ExercisesTableProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = ExercisesTableColumns({ onEditExercise });

  // Fetch exercises when filters, sorting, or pagination changes
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const result = await getExercisesWithFilters({
          page: pagination.pageIndex,
          pageSize: pagination.pageSize,
          search: filters.search || undefined,
          bodyPart: filters.bodyPart === "all" ? undefined : filters.bodyPart,
          sortBy: sorting[0]?.id as "name" | "type" | "created_at" || "name",
          sortOrder: sorting[0]?.desc ? "desc" : "asc",
        });

        if (result.data) {
          setExercises(result.data.exercises);
          setTotalCount(result.data.totalCount);
          setTotalPages(result.data.totalPages);
        } else {
          console.error("Failed to fetch exercises:", result.error);
        }
      } catch (error) {
        console.error("Error fetching exercises:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [filters, sorting, pagination]);

  const table = useReactTable({
    data: exercises,
    columns,
    state: {
      sorting,
      pagination,
    },
    pageCount: totalPages,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const handleFiltersChange = (newFilters: Partial<ExerciseFilters>) => {
    onFiltersChange(newFilters);
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <ExercisesFilters filters={filters} onFiltersChange={handleFiltersChange} />
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading exercises...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ExercisesFilters filters={filters} onFiltersChange={handleFiltersChange} />
      
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="whitespace-nowrap">
                  {header.isPlaceholder ? null : (
                    <div
                      className="flex items-center gap-1 cursor-pointer select-none hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <div className="flex h-4 w-4 items-center justify-center">
                        {header.column.getIsSorted() === "asc" ? (
                          <span className="text-xs">↑</span>
                        ) : header.column.getIsSorted() === "desc" ? (
                          <span className="text-xs">↓</span>
                        ) : (
                          <span className="text-xs opacity-50">↕</span>
                        )}
                      </div>
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <td colSpan={columns.length} className="h-24 text-center">
                No exercises found.
              </td>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <Separator />
      <ExercisesTablePagination table={table} />
    </div>
  );
}