"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { AdminTrainersFilters } from "./admin-trainers-filters";
import { AdminTrainersTable } from "./admin-trainers-table";
import { InviteTrainerModal } from "./invite-trainer-modal";
import { useAdminTrainers } from "@/hooks/use-admin-trainers";

export function AdminTrainersPage() {
  const {
    trainers,
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
    fetchTrainers,
  } = useAdminTrainers();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleInviteTrainer = () => {
    setIsInviteModalOpen(true);
  };

  const handleTrainerInvited = () => {
    fetchTrainers(); // Refresh the trainers list
    setIsInviteModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trainer Management</h1>
          <p className="text-muted-foreground">
            Manage trainers, view their specializations and client assignments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {total} total trainers
          </span>
          <Button onClick={handleInviteTrainer} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Trainer
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <AdminTrainersFilters
            filters={filters}
            onFiltersChange={updateFilters}
          />
        </div>
        <div className="p-3">
          <AdminTrainersTable
            trainers={trainers}
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
          <p className="text-red-600">Failed to load trainers.</p>
          <button
            onClick={fetchTrainers}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && trainers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No trainers found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search criteria or invite new trainers.
          </p>
        </div>
      )}

      {/* Invite Trainer Modal */}
      <InviteTrainerModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onTrainerInvited={handleTrainerInvited}
      />
    </div>
  );
}
