"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminClientFilters, SubscriptionCategory } from "@/types/admin-client";

interface AdminClientsFiltersProps {
  filters: AdminClientFilters;
  onFiltersChange: (filters: Partial<AdminClientFilters>) => void;
}

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "ALL" },
  { label: "Fitness", value: "FITNESS" },
  { label: "Psychology", value: "PSYCHOLOGY" },
  { label: "Manifestation", value: "MANIFESTATION" },
  { label: "All-in-One", value: "ALL_IN_ONE" },
] as const;

export function AdminClientsFilters({ filters, onFiltersChange }: AdminClientsFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search clients by name or email..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Category Filter */}
      <Select
        value={filters.category}
        onValueChange={(value) =>
          onFiltersChange({ category: value as "ALL" | SubscriptionCategory })
        }
      >
        <SelectTrigger className="w-full md:w-[200px]">
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
    </div>
  );
}
