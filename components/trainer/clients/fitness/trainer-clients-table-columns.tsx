"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrainerClientRow } from "@/types/trainer-clients.types";
import { Eye, ArrowUpDown, ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { format } from "date-fns";

export const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  CREATED: "bg-blue-100 text-blue-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const useTrainerClientsColumns = (): ColumnDef<TrainerClientRow>[] => {
  return useMemo(() => [
    {
      accessorKey: "name",
      enableSorting: true,
      header: ({ column }) => (
        <div
          className="flex items-center gap-1 cursor-pointer select-none hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="font-medium text-red-600">{row.getValue("name")}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      enableSorting: true,
      header: ({ column }) => (
        <div
          className="flex items-center gap-1 cursor-pointer select-none hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "plan",
      enableSorting: false,
      header: "Plan",
      cell: ({ row }) => {
        const plan = row.getValue("plan") as string;
        if (!plan) {
          return <span className="text-muted-foreground text-sm">No plan</span>;
        }
        return (
          <div className="font-medium">{plan}</div>
        );
      },
    },
    {
      accessorKey: "status",
      enableSorting: false,
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        if (!status) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <Badge 
            className={statusColors[status] || "bg-gray-100 text-gray-800"}
            variant="secondary"
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "joinDate",
      enableSorting: true,
      header: ({ column }) => (
        <div
          className="flex items-center gap-1 cursor-pointer select-none hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Join Date
          <ChevronDown className="h-4 w-4" />
        </div>
      ),
      cell: ({ row }) => {
        const joinDate = row.getValue("joinDate") as string;
        if (!joinDate) {
          return <span className="text-muted-foreground">-</span>;
        }
        try {
          const date = new Date(joinDate);
          return (
            <div className="font-medium">
              {format(date, "MMM dd, yyyy")}
            </div>
          );
        } catch {
          return <span className="text-muted-foreground">Invalid date</span>;
        }
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-red-600 hover:text-red-800"
        >
          <Eye className="h-4 w-4" />
          <span className="ml-2">View Details</span>
        </Button>
      ),
    },
  ], []);
};
