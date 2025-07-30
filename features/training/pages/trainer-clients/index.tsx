"use client";

import { useTrainerClients } from "@/hooks/use-trainer-clients";
import { TrainerClientsTable } from "@/components/trainer-clients/table";
import { TrainerClientsFilters } from "@/components/trainer-clients/filters";
import { TrainerClientsResponse } from "@/types/trainer-clients.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TrainerClientsPageProps {
  initialData?: TrainerClientsResponse;
}

export default function TrainerClientsPage({ initialData }: TrainerClientsPageProps) {
  const {
    data,
    total,
    pageCount,
    isLoading,
    error,
    filters,
    sorting,
    pagination,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    handleRefresh,
  } = useTrainerClients(initialData);

  // Handle add client (placeholder for now)
  const handleAddClient = () => {
    console.log("Add client functionality to be implemented");
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">My Clients</h2>
        </div>
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          <p className="font-medium">Error loading clients</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">My Clients</h2>
        {/* <Button onClick={handleAddClient}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Client
        </Button> */}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <TrainerClientsFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={handleClearFilters}
            />
            
            <TrainerClientsTable
              data={data}
              totalCount={total}
              pageCount={pageCount}
              sorting={sorting}
              pagination={pagination}
              onSortingChange={handleSortingChange}
              onPaginationChange={handlePaginationChange}
              isLoading={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 