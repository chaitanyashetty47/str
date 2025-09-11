"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExercisesTable } from "./exercises-table";
import { ExerciseFormDialog } from "./exercise-form-dialog";
import { BodyPart } from "@prisma/client";

export interface ExerciseFilters {
  search: string;
  bodyPart: BodyPart | "all";
}

export interface Exercise {
  id: string;
  name: string;
  type: BodyPart;
  is_reps_based: boolean;
  youtube_link: string | null;
  created_at: Date;
  created_by_id: string;
}

export function ExercisesPage() {
  const [filters, setFilters] = useState<ExerciseFilters>({
    search: "",
    bodyPart: "all",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  const handleFiltersChange = useCallback((newFilters: Partial<ExerciseFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleCreateExercise = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleEditExercise = useCallback((exercise: Exercise) => {
    setEditingExercise(exercise);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
    setEditingExercise(null);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Exercise Management</h1>
        <div className="flex items-center gap-4">
          <Button onClick={handleCreateExercise}>
            <Plus className="size-4" />
            Create Exercise
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <ExercisesTable
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onEditExercise={handleEditExercise}
          />
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <ExerciseFormDialog
        isOpen={isCreateDialogOpen || editingExercise !== null}
        onClose={handleCloseDialog}
        exercise={editingExercise}
        mode={editingExercise ? "edit" : "create"}
      />
    </div>
  );
}