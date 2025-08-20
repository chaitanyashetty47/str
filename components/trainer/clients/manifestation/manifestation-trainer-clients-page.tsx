"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useManifestationTrainerClients } from "@/hooks/use-manifestation-trainer-clients";
import { ManifestationTrainerClientsFilters } from "./manifestation-trainer-clients-filters";
import { ManifestationTrainerClientsTable } from "./manifestation-trainer-clients-table";
import { ManifestationTrainerClientsTablePagination } from "./manifestation-trainer-clients-table-pagination";

export function ManifestationTrainerClientsPage() {
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
  } = useManifestationTrainerClients();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchClients();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">
            Failed to load clients
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message || "Something went wrong. Please try again."}
          </p>
        </div>
        <Button onClick={fetchClients} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Manifestation Clients</h1>
          <p className="text-muted-foreground">
            Manage your manifestation and all-in-one plan clients.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {total} total client{total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filters */}
      <ManifestationTrainerClientsFilters
        filters={filters}
        onFiltersChange={updateFilters}
      />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            View and manage your manifestation training clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManifestationTrainerClientsTable
            data={clients}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pageCount > 1 && (
        <ManifestationTrainerClientsTablePagination
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          pageCount={pageCount}
        />
      )}
    </div>
  );
}

