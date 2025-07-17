"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { TrainerClientsFilters } from "@/types/trainer-clients.types";
import { SubscriptionStatus } from "@prisma/client";

interface TrainerClientsFiltersProps {
  filters: TrainerClientsFilters;
  onFiltersChange: (filters: Partial<TrainerClientsFilters>) => void;
  onClearFilters: () => void;
}

export function TrainerClientsFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: TrainerClientsFiltersProps) {
  const hasActiveFilters = filters.search || filters.status !== "all";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name or email..."
          className="pl-9"
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({
              status: value as SubscriptionStatus | "all",
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value={SubscriptionStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={SubscriptionStatus.CREATED}>Created</SelectItem>
            <SelectItem value={SubscriptionStatus.EXPIRED}>Expired</SelectItem>
            <SelectItem value={SubscriptionStatus.CANCELED}>Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={onClearFilters}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
} 