"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { TrainerClientRow } from "@/types/trainer-clients.types";
import { SubscriptionStatus } from "@prisma/client";

const getStatusColor = (status: SubscriptionStatus | null) => {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case SubscriptionStatus.EXPIRED:
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case SubscriptionStatus.CANCELED:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    case SubscriptionStatus.CREATED:
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

export const useTrainerClientsColumns = (): ColumnDef<TrainerClientRow>[] => {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(isSorted === "asc")}
            className="h-auto p-0 font-semibold text-left justify-start hover:bg-transparent"
          >
            Name
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <Link
          href={`/training/clients/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(isSorted === "asc")}
            className="h-auto p-0 font-semibold text-left justify-start hover:bg-transparent"
          >
            Email
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.getValue("email")}
        </div>
      ),
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => {
        const plan = row.getValue("plan") as string | null;
        return (
          <div className="font-medium">
            {plan || "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as SubscriptionStatus | null;
        return (
          <Badge 
            variant="secondary" 
            className={getStatusColor(status)}
          >
            {status || "Unknown"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "joinDate",
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(isSorted === "asc")}
            className="h-auto p-0 font-semibold text-left justify-start hover:bg-transparent"
          >
            Join Date
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const joinDate = row.getValue("joinDate") as string | null;
        return (
          <div className="text-sm">
            {joinDate
              ? new Date(joinDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Link href={`/training/clients/${row.original.id}`}>
          <Button variant="link" size="sm" className="h-auto p-0">
            View Details
          </Button>
        </Link>
      ),
    },
  ];
}; 