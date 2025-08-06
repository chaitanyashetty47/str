"use client";

import { MoreHorizontal, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkoutPlan } from "@/types/workout-plan";
import Link from "next/link";

interface WorkoutPlanActionsDropdownProps {
  plan: WorkoutPlan;
}

export function WorkoutPlanActionsDropdown({ plan }: WorkoutPlanActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/training/plans/${plan.id}/edit`} className="flex items-center">
            <Edit className="mr-2 h-4 w-4" />
            Edit Plan
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/training/plans/${plan.id}/progress`} className="flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            View Progress
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 