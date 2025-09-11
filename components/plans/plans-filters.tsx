'use client';

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlansFilters } from "./plans-page";
import { WorkoutCategory } from "@prisma/client";

interface PlansFiltersProps {
  filters: PlansFilters;
  onFiltersChange: (filters: Partial<PlansFilters>) => void;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active Plans" },
  { value: "upcoming", label: "Upcoming Plans" },
  { value: "previous", label: "Previous Plans" },
  { value: "all", label: "All Plans" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "HYPERTROPHY", label: "Hypertrophy" },
  { value: "STRENGTH", label: "Strength" },
  { value: "DELOAD", label: "Deload" },
  { value: "ENDURANCE", label: "Endurance" },
];

export function PlansFilters({ filters, onFiltersChange }: PlansFiltersProps) {
  const hasActiveFilters = 
    filters.search !== "" || 
    filters.category !== "all" || 
    filters.status !== "active";

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      category: "all",
      status: "active",
    });
  };

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search workout plans..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status}
        onValueChange={(value) =>
          onFiltersChange({ status: value as PlansFilters["status"] })
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

      {/* Category Filter */}
      <Select
        value={filters.category}
        onValueChange={(value) =>
          onFiltersChange({ category: value as WorkoutCategory | "all" })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full md:w-auto"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}