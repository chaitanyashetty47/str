"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AdminClientsFilters } from "./admin-clients-filters";
import { AdminClientsTable } from "./admin-clients-table";
import { AssignCategoryTrainerModal } from "./assign-category-trainer-modal";
import { EditClientTrainersModal } from "./edit-client-trainers-modal";
import { useAdminClients } from "@/hooks/use-admin-clients";
import { AdminClient, SubscriptionCategory } from "@/types/admin-client";

export function AdminClientsPage() {
  const {
    clients,
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
  } = useAdminClients();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory | null>(null);

  const handleAssignTrainer = (client: AdminClient, category: SubscriptionCategory) => {
    setSelectedClient(client);
    setSelectedCategory(category);
    setIsAssignModalOpen(true);
  };

  const handleEditClient = (client: AdminClient) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleTrainerAssigned = async () => {
    // First refresh the data
    await fetchClients();
    // Then close the modal after a brief delay to ensure data is refreshed
    setTimeout(() => {
      setIsAssignModalOpen(false);
      setSelectedClient(null);
      setSelectedCategory(null);
    }, 100);
  };

  const handleTrainersUpdated = async () => {
    // First refresh the data
    await fetchClients();
    // Then close the modal after a brief delay to ensure data is refreshed
    setTimeout(() => {
      setIsEditModalOpen(false);
      setSelectedClient(null);
    }, 100);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedClient(null);
    setSelectedCategory(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">
            Manage client trainer assignments and active subscriptions
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
          <AdminClientsFilters
            filters={filters}
            onFiltersChange={updateFilters}
          />
        </div>
        <div className="p-3">
          <AdminClientsTable
            clients={clients}
            sorting={sorting}
            pagination={pagination}
            pageCount={pageCount}
            onSort={handleSortingChange}
            onPaginationChange={handlePaginationChange}
            onAssignTrainer={handleAssignTrainer}
            onEditClient={handleEditClient}
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

      {/* Assign Trainer Modal */}
      {selectedClient && selectedCategory && (
        <AssignCategoryTrainerModal
          isOpen={isAssignModalOpen}
          onClose={handleCloseAssignModal}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          clientEmail={selectedClient.email}
          category={selectedCategory}
          onTrainerAssigned={handleTrainerAssigned}
        />
      )}

      {/* Edit Client Trainers Modal */}
      <EditClientTrainersModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        client={selectedClient}
        onTrainersUpdated={handleTrainersUpdated}
      />
    </div>
  );
}
