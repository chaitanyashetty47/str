'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar, Clock, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkoutCategory } from "@prisma/client";
import { WorkoutPlanWithDetails } from "@/actions/client-workout/get-all-workout-plans.action";
import { format } from "date-fns";

// Category colors for badges
export const categoryColors: Record<WorkoutCategory, string> = {
  HYPERTROPHY: "bg-blue-100 text-blue-800",
  STRENGTH: "bg-green-100 text-green-800", 
  DELOAD: "bg-yellow-100 text-yellow-800",
  RELOAD: "bg-red-100 text-red-800",
  ENDURANCE: "bg-purple-100 text-purple-800",
};

// Status colors for badges
export const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  upcoming: "bg-blue-100 text-blue-800",
  previous: "bg-gray-100 text-gray-800",
};

export function PlansTableColumns(): ColumnDef<WorkoutPlanWithDetails>[] {
  return [
    {
      accessorKey: "title",
      header: "Plan Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("title")}</span>
          {row.original.description && (
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as WorkoutCategory;
        return (
          <Badge className={categoryColors[category]}>
            {category.charAt(0) + category.slice(1).toLowerCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "duration_in_weeks",
      header: "Duration",
      cell: ({ row }) => {
        const weeks = row.getValue("duration_in_weeks") as number;
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{weeks} week{weeks !== 1 ? 's' : ''}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => {
        const date = row.getValue("start_date") as Date;
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(date), "MMM dd, yyyy")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "end_date", 
      header: "End Date",
      cell: ({ row }) => {
        const date = row.getValue("end_date") as Date;
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(date), "MMM dd, yyyy")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "trainer",
      header: "Trainer",
      cell: ({ row }) => {
        const trainer = row.original.trainer;
        return (
          <div className="flex items-center gap-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{trainer.name}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const plan = row.original;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Determine plan status
        const startDate = new Date(plan.start_date);
        const endDate = new Date(plan.end_date);
        let planStatus: string;
        
        if (startDate > today) {
          planStatus = "upcoming";
        } else if (endDate < today) {
          planStatus = "previous";
        } else {
          planStatus = "active";
        }

        return (
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <Badge className={statusColors[planStatus]}>
              {planStatus.charAt(0).toUpperCase() + planStatus.slice(1)}
            </Badge>
            
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    // Navigate to workout logger
                    window.location.href = `/workout-plan/${plan.id}`;
                  }}
                >
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // Navigate to plan summary
                    window.location.href = `/workout-plan/${plan.id}/summary`;
                  }}
                >
                  View Progress
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}