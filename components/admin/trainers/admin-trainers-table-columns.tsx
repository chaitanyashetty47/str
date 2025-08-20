"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AdminTrainer } from "@/types/admin-trainer";
import { AdminTrainersTableHeaderCell } from "./admin-trainers-table-header-cell";
import { format } from "date-fns";

// Helper function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to get category badge color
function getCategoryBadgeColor(category: string) {
  switch (category) {
    case "FITNESS":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "PSYCHOLOGY":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "MANIFESTATION":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
}

export function useAdminTrainersTableColumns() {
  const columns = useMemo<ColumnDef<AdminTrainer>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <AdminTrainersTableHeaderCell column={column} title="Trainer Name" />
      ),
      cell: ({ row }) => {
        const trainer = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                {getInitials(trainer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">
                {trainer.name}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {trainer.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <AdminTrainersTableHeaderCell column={column} title="Trainer Category" />
      ),
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return (
          <Badge 
            variant="secondary" 
            className={getCategoryBadgeColor(category)}
          >
            {category}
          </Badge>
        );
      },
    },
    {
      accessorKey: "clientCount",
      header: ({ column }) => (
        <AdminTrainersTableHeaderCell column={column} title="Active Clients" />
      ),
      cell: ({ row }) => {
        const clientCount = row.getValue("clientCount") as number;
        const trainer = row.original;
        
        return (
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {clientCount}
            </div>
            {clientCount > 0 && (
              <div className="text-xs text-gray-500">
                {clientCount === 1 ? 'client' : 'clients'}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <AdminTrainersTableHeaderCell column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        const isAdmin = role.includes("ADMIN");
        
        return (
          <div className="text-sm">
            <div className={`font-medium ${isAdmin ? 'text-orange-600' : 'text-gray-900'}`}>
              {role.replace(/_/g, ' ')}
            </div>
            {isAdmin && (
              <div className="text-xs text-orange-500">
                Admin Access
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <AdminTrainersTableHeaderCell column={column} title="Joined Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return (
          <div className="text-sm text-gray-900">
            {format(date, "MMM dd, yyyy")}
          </div>
        );
      },
    },
  ], []);

  return columns;
}
