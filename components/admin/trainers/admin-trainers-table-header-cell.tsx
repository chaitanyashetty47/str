"use client";

import { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AdminTrainer } from "@/types/admin-trainer";

interface AdminTrainersTableHeaderCellProps {
  column: Column<AdminTrainer, unknown>;
  title: string;
}

export function AdminTrainersTableHeaderCell({
  column,
  title,
}: AdminTrainersTableHeaderCellProps) {
  const isSorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      className="h-auto p-0 font-semibold text-left justify-start hover:bg-transparent"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span className="text-gray-700">{title}</span>
      <div className="ml-2 h-4 w-4">
        {isSorted === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : isSorted === "desc" ? (
          <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </Button>
  );
}
