'use server';

import { z } from "zod";
import { ActionState, createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { requireTrainerAccess } from "@/utils/user";
import { BodyPart } from "@prisma/client";

// ────────────────────────────────────────────────────────────────────────────
// Input validation schema
// ────────────────────────────────────────────────────────────────────────────
const updateExerciseInput = z.object({
  exerciseId: z.string().uuid("Invalid exercise ID"),
  name: z.string().min(1, "Exercise name is required"),
  type: z.nativeEnum(BodyPart, { required_error: "Body part is required" }),
  is_reps_based: z.boolean(),
  youtube_link: z.string().url("Invalid YouTube URL").optional().or(z.literal("")),
});

export type UpdateExerciseInput = z.infer<typeof updateExerciseInput>;
export type UpdateExerciseOutput = { 
  success: boolean; 
  message: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────────
async function updateExerciseHandler({ 
  exerciseId,
  name, 
  type, 
  is_reps_based = false, 
  youtube_link 
}: UpdateExerciseInput): Promise<ActionState<UpdateExerciseInput, UpdateExerciseOutput>> {
  try {
    // Check if authenticated user is a trainer
    const { userId: trainerId } = await requireTrainerAccess();
    if (!trainerId) {
      return { error: "Trainer access required" };
    }

    // Check if exercise exists
    const existingExercise = await prisma.workout_exercise_lists.findUnique({
      where: { id: exerciseId }
    });

    if (!existingExercise) {
      return { error: "Exercise not found" };
    }

    // Check if another exercise with the same name exists (excluding current exercise)
    if (name !== existingExercise.name) {
      const duplicateExercise = await prisma.workout_exercise_lists.findUnique({
        where: { name }
      });

      if (duplicateExercise) {
        return { error: "An exercise with this name already exists" };
      }
    }

    // Update the exercise
    await prisma.workout_exercise_lists.update({
      where: { id: exerciseId },
      data: {
        name,
        type,
        is_reps_based,
        youtube_link: youtube_link || null,
      }
    });

    return { 
      data: { 
        success: true, 
        message: "Exercise updated successfully"
      } 
    };

  } catch (error: any) {
    console.error("Update exercise error:", error);
    return { error: "Failed to update exercise. Please try again." };
  }
}

export const updateExercise = createSafeAction<UpdateExerciseInput, UpdateExerciseOutput>(
  updateExerciseInput,
  updateExerciseHandler,
);
