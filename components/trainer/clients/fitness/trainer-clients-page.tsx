"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { TrainerClientsFilters } from "./trainer-clients-filters";
import { TrainerClientsTable } from "./trainer-clients-table";
import { useTrainerClients } from "@/hooks/trainer-clients-table/use-fitness-trainer-clients";
import { TrainerClientsResponse } from "@/types/trainer-clients.types";

interface TrainerClientsPageProps {
  initialData?: TrainerClientsResponse;
}

export function TrainerClientsPage({ initialData }: TrainerClientsPageProps) {
  const {
    data: clients,
    total,
    pageCount,
    filters,
    sorting,
    pagination,
    isLoading,
    error,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    fetchClients,
  } = useTrainerClients(initialData);

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Clients</h1>
          <p className="text-muted-foreground">
            Manage your fitness and all-in-one plan clients
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {total} total clients
          </span>
        </div>
      </div>

      {/* Table Card */}
      <Card className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <TrainerClientsFilters
            filters={filters}
            onFiltersChange={updateFilters}
          />
        </div>
        <div className="p-3">
          <TrainerClientsTable
            clients={clients}
            sorting={sorting}
            pagination={pagination}
            pageCount={pageCount}
            onSort={handleSortingChange}
            onPaginationChange={handlePaginationChange}
            isLoading={isLoading}
          />
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-600">Failed to load clients.</p>
          <button
            onClick={fetchClients}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No clients found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
