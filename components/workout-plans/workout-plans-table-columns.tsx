"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { WorkoutPlan } from "@/types/workout-plan";
import { WorkoutPlanActionsDropdown } from "./workout-plan-actions-dropdown";
import { format } from "date-fns";
import { useMemo } from "react";

export const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  CURRENT: "bg-blue-100 text-blue-800",
  EXPIRED: "bg-red-100 text-red-800",
};

export const useWorkoutPlanColumns = (): ColumnDef<WorkoutPlan>[] => {
  return useMemo(() => [
    {
      accessorKey: "title",
      header: "Plan Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="font-medium">{row.getValue("title")}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground truncate">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "client.name",
      header: "Client Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.client.name}</span>
          <span className="text-sm text-muted-foreground">
            {row.original.client.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.getValue("start_date")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.getValue("end_date")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dateStatus",
      header: "Date Status",
      cell: ({ row }) => {
        const dateStatus = row.getValue("dateStatus") as string;
        return (
          <Badge className={statusColors[dateStatus] || "bg-gray-100 text-gray-800"}>
            {dateStatus.charAt(0).toUpperCase() + dateStatus.slice(1).toLowerCase()}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <WorkoutPlanActionsDropdown plan={row.original} />,
    },
  ], []);
}; 