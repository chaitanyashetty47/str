"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { TrainerClientsFilters } from "@/types/trainer-clients.types";
import { DateRange } from "react-day-picker";

interface PsychologyTrainerClientsFiltersProps {
  filters: TrainerClientsFilters;
  onFiltersChange: (filters: Partial<TrainerClientsFilters>) => void;
}

export function PsychologyTrainerClientsFilters({ filters, onFiltersChange }: PsychologyTrainerClientsFiltersProps) {
  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    onFiltersChange({
      dateRange: {
        from: dateRange?.from,
        to: dateRange?.to,
      },
    });
  };

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search psychology clients by name or email..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Date Range Filter */}
      <DateRangePicker
        dateRange={{
          from: filters.dateRange.from,
          to: filters.dateRange.to,
        }}
        onDateRangeChange={handleDateRangeChange}
        placeholder="Filter by join date range"
        className="w-full md:w-[280px]"
      />
    </div>
  );
}

