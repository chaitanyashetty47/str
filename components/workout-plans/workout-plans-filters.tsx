"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkoutPlanFilters, WorkoutPlanStatus, DateStatus } from "@/types/workout-plan";

interface WorkoutPlansFiltersProps {
  filters: WorkoutPlanFilters;
  onFiltersChange: (filters: Partial<WorkoutPlanFilters>) => void;
}

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
] as const;

const DATE_STATUS_OPTIONS = [
  { label: "All Plans", value: "all" },
  { label: "Current", value: "CURRENT" },
  { label: "Expired", value: "EXPIRED" },
] as const;

export function WorkoutPlansFilters({ filters, onFiltersChange }: WorkoutPlansFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search plans or clients..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status}
        onValueChange={(value) =>
          onFiltersChange({ status: value as WorkoutPlanStatus | "all" })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Status Filter */}
      <Select
        value={filters.dateStatus}
        onValueChange={(value) =>
          onFiltersChange({ dateStatus: value as DateStatus | "all" })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter by date status" />
        </SelectTrigger>
        <SelectContent>
          {DATE_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 