"use client";

import { TableHead } from "@/components/ui/table";
import { flexRender, Header } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkoutPlansTableHeaderCellProps {
  header: Header<any, unknown>;
}

export function WorkoutPlansTableHeaderCell({ header }: WorkoutPlansTableHeaderCellProps) {
  const isSortable = header.column.getCanSort();
  const sorted = header.column.getIsSorted();

  return (
    <TableHead className="whitespace-nowrap">
      {header.isPlaceholder ? null : (
        <div
          className={cn(
            "flex items-center gap-1",
            isSortable && "cursor-pointer select-none hover:text-foreground"
          )}
          onClick={
            isSortable ? header.column.getToggleSortingHandler() : undefined
          }
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {isSortable && (
            <div className="flex h-4 w-4 items-center justify-center">
              {sorted === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : sorted === "desc" ? (
                <ArrowDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
              )}
            </div>
          )}
        </div>
      )}
    </TableHead>
  );
} 