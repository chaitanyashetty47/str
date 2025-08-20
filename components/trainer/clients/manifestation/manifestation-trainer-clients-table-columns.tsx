"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { TrainerClientRow } from "@/types/trainer-clients.types";
import { format } from "date-fns";

export const manifestationTrainerClientsTableColumns: ColumnDef<TrainerClientRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-red-600">{client.name}</span>
          <span className="text-sm text-muted-foreground">{client.email}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email,
    enableSorting: true,
  },
  {
    accessorKey: "plan",
    header: "Plan",
    cell: ({ row }) => {
      const plan = row.original.plan;
      return plan ? (
        <span className="font-medium">{plan}</span>
      ) : (
        <span className="text-muted-foreground">No plan</span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      if (!status) return <span className="text-muted-foreground">Unknown</span>;
      
      const getStatusColor = (status: string) => {
        switch (status) {
          case "ACTIVE":
            return "bg-green-100 text-green-800 hover:bg-green-100";
          case "CREATED":
            return "bg-blue-100 text-blue-800 hover:bg-blue-100";
          case "AUTHENTICATED":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
          case "CANCELLED":
            return "bg-red-100 text-red-800 hover:bg-red-100";
          case "EXPIRED":
            return "bg-gray-100 text-gray-800 hover:bg-gray-100";
          default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-100";
        }
      };

      return (
        <Badge variant="secondary" className={getStatusColor(status)}>
          {status}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "joinDate",
    header: "Join Date",
    cell: ({ row }) => {
      const joinDate = row.original.joinDate;
      if (!joinDate) return <span className="text-muted-foreground">Unknown</span>;
      
      try {
        const date = new Date(joinDate);
        return format(date, "MMM dd, yyyy");
      } catch {
        return <span className="text-muted-foreground">Invalid date</span>;
      }
    },
    enableSorting: true,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const client = row.original;
      return (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => {
            // Navigate to client details page
            window.location.href = `/manifestation/clients/${client.id}`;
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Button>
      );
    },
    enableSorting: false,
  },
];

