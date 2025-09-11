"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExerciseFilters } from "./exercises-page";
import { BodyPart } from "@prisma/client";

interface ExercisesFiltersProps {
  filters: ExerciseFilters;
  onFiltersChange: (filters: Partial<ExerciseFilters>) => void;
}

const BODY_PART_OPTIONS = [
  { value: "all", label: "All Body Parts" },
  { value: "CHEST", label: "Chest" },
  { value: "BACK", label: "Back" },
  { value: "SHOULDERS", label: "Shoulders" },
  { value: "BICEPS", label: "Biceps" },
  { value: "TRICEPS", label: "Triceps" },
  { value: "LEGS", label: "Legs" },
  { value: "CORE", label: "Core" },
  { value: "CARDIO", label: "Cardio" },
  { value: "FULL_BODY", label: "Full Body" },
];

export function ExercisesFilters({ filters, onFiltersChange }: ExercisesFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      bodyPart: "all",
    });
  };

  const hasActiveFilters = filters.search || filters.bodyPart !== "all";

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search exercises..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Body Part Filter */}
      <Select
        value={filters.bodyPart}
        onValueChange={(value) =>
          onFiltersChange({ bodyPart: value as BodyPart | "all" })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter by body part" />
        </SelectTrigger>
        <SelectContent>
          {BODY_PART_OPTIONS.map((option) => (
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
          onClick={handleClearFilters}
          className="w-full md:w-auto"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}