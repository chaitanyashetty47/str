"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminTrainerFilters, TrainerCategory } from "@/types/admin-trainer";

interface AdminTrainersFiltersProps {
  filters: AdminTrainerFilters;
  onFiltersChange: (filters: Partial<AdminTrainerFilters>) => void;
}

export function AdminTrainersFilters({ filters, onFiltersChange }: AdminTrainersFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ category: value as "ALL" | TrainerCategory });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="trainers-search-filter"
          name="search-filter"
          type="search"
          placeholder="Search trainers by name or email..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          autoComplete="off"
          className="pl-9"
        />
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium whitespace-nowrap">Category:</label>
        <Select value={filters.category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="FITNESS">Fitness</SelectItem>
            <SelectItem value="PSYCHOLOGY">Psychology</SelectItem>
            <SelectItem value="MANIFESTATION">Manifestation</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
