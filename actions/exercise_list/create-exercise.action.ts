'use server';

import { z } from "zod";
import { ActionState, createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { requireTrainerAccess } from "@/utils/user";
import { BodyPart } from "@prisma/client";
// import { v4 as uuidv4 } from 'uuid';

// ────────────────────────────────────────────────────────────────────────────
// Input validation schema
// ────────────────────────────────────────────────────────────────────────────
const createExerciseInput = z.object({
  name: z.string().min(1, "Exercise name is required"),
  type: z.nativeEnum(BodyPart, { required_error: "Body part is required" }),
  is_reps_based: z.boolean(),
  youtube_link: z.string().url("Invalid YouTube URL").optional().or(z.literal("")),
});

export type CreateExerciseInput = z.infer<typeof createExerciseInput>;
export type CreateExerciseOutput = { 
  success: boolean; 
  message: string;
  exerciseId?: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────────
async function createExerciseHandler({ 
  name, 
  type, 
  is_reps_based = false, 
  youtube_link 
}: CreateExerciseInput): Promise<ActionState<CreateExerciseInput, CreateExerciseOutput>> {
  try {
    // Check if authenticated user is a trainer
    const { userId: trainerId } = await requireTrainerAccess();
    if (!trainerId) {
      return { error: "Trainer access required" };
    }

    // Check if exercise name already exists
    const existingExercise = await prisma.workout_exercise_lists.findUnique({
      where: { name }
    });

    if (existingExercise) {
      return { error: "An exercise with this name already exists" };
    }

    // Create the exercise
    const exercise = await prisma.workout_exercise_lists.create({
      data: {
        // id: uuidv4(),   
        name,
        type,
        is_reps_based,
        youtube_link: youtube_link || null,
        created_by_id: trainerId,
      }
    });

    return { 
      data: { 
        success: true, 
        message: "Exercise created successfully",
        exerciseId: exercise.id
      } 
    };

  } catch (error: any) {
    console.error("Create exercise error:", error);
    return { error: "Failed to create exercise. Please try again." };
  }
}

export const createExercise = createSafeAction<CreateExerciseInput, CreateExerciseOutput>(
  createExerciseInput,
  createExerciseHandler,
);
