import { z } from "zod";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { BodyPart } from "@prisma/client";

interface MaxLiftOutput {
  id: string; // NEW: PR ID for invalidation
  exerciseName: string;
  exerciseType: BodyPart;
  maxWeight?: number; // For weight-based exercises
  maxReps?: number;   // For reps-based exercises
  exerciseTypeEnum: "WEIGHT_BASED" | "REPS_BASED"; // NEW: Track exercise type
  dateAchieved: Date;
  isInvalid?: boolean; // NEW: Track invalidation status
}

interface UniqueExerciseOption {
  exerciseName: string;
  exerciseType: BodyPart;
  exerciseId: string;
}

interface MaxLiftsData {
  uniqueExercises: UniqueExerciseOption[];
  allMaxLifts: MaxLiftOutput[];
}

export async function getMaxLiftsData(): Promise<MaxLiftsData> {
  const userId = await getAuthenticatedUserId();
  
  // Get all max lifts data (excluding invalid PRs)
  const maxLifts = await prisma.client_max_lifts.findMany({
    where: {
      client_id: userId!,
      is_invalid: false, // NEW: Filter out invalid PRs
    },
    select: {
      id: true,              // NEW: Include PR ID
      list_exercise_id: true,
      max_weight: true,
      max_reps: true,        // NEW: Include max reps
      exercise_type: true,   // NEW: Include exercise type
      date_achieved: true,
      is_invalid: true,      // NEW: Include invalidation status
      workout_exercise_lists: {
        select: {
          name: true,
          type: true,
        },
      },
    },
  });

  // Transform all max lifts data
  const allMaxLifts = maxLifts.map((lift) => ({
    id: lift.id, // NEW: Include PR ID for invalidation
    exerciseName: lift.workout_exercise_lists.name,
    maxWeight: lift.max_weight ?? undefined,     // Convert null to undefined
    maxReps: lift.max_reps ?? undefined,         // Convert null to undefined
    exerciseType: lift.workout_exercise_lists.type,
    exerciseTypeEnum: lift.exercise_type, // NEW: Track exercise type enum
    dateAchieved: lift.date_achieved,
    isInvalid: lift.is_invalid, // NEW: Track invalidation status
  }));

  // Create unique exercises from the existing data
  const uniqueExercisesMap = new Map<string, UniqueExerciseOption>();
  
  maxLifts.forEach((lift) => {
    const key = lift.list_exercise_id;
    if (!uniqueExercisesMap.has(key)) {
      uniqueExercisesMap.set(key, {
        exerciseName: lift.workout_exercise_lists.name,
        exerciseType: lift.workout_exercise_lists.type,
        exerciseId: lift.list_exercise_id,
      });
    }
  });

  const uniqueExercises = Array.from(uniqueExercisesMap.values());

  return {
    uniqueExercises,
    allMaxLifts,
  };
}


// Keep the original functions for backward compatibility (optional)
export async function getMaxLifts(): Promise<MaxLiftOutput[]> {
  const data = await getMaxLiftsData();
  return data.allMaxLifts;
}

export async function getUniqueExerciseOptions(): Promise<UniqueExerciseOption[]> {
  const data = await getMaxLiftsData();
  return data.uniqueExercises;
}

// NEW: Get all PRs including invalid ones (for admin/debugging purposes)
export async function getAllMaxLiftsData(includeInvalid: boolean = false): Promise<MaxLiftsData> {
  const userId = await getAuthenticatedUserId();
  
  const maxLifts = await prisma.client_max_lifts.findMany({
    where: {
      client_id: userId!,
      ...(includeInvalid ? {} : { is_invalid: false }), // Conditionally filter invalid PRs
    },
    select: {
      id: true,              // NEW: Include PR ID
      list_exercise_id: true,
      max_weight: true,
      max_reps: true,
      exercise_type: true,
      date_achieved: true,
      is_invalid: true, // Include invalidation status
      workout_exercise_lists: {
        select: {
          name: true,
          type: true,
        },
      },
    },
  });

  // Transform all max lifts data
  const allMaxLifts = maxLifts.map((lift) => ({
    id: lift.id, // NEW: Include PR ID for invalidation
    exerciseName: lift.workout_exercise_lists.name,
    maxWeight: lift.max_weight ?? undefined,
    maxReps: lift.max_reps ?? undefined,
    exerciseType: lift.workout_exercise_lists.type,
    exerciseTypeEnum: lift.exercise_type,
    dateAchieved: lift.date_achieved,
    isInvalid: lift.is_invalid, // NEW: Include invalidation status
  }));

  // Create unique exercises from the existing data
  const uniqueExercisesMap = new Map<string, UniqueExerciseOption>();
  
  maxLifts.forEach((lift) => {
    const key = lift.list_exercise_id;
    if (!uniqueExercisesMap.has(key)) {
      uniqueExercisesMap.set(key, {
        exerciseName: lift.workout_exercise_lists.name,
        exerciseType: lift.workout_exercise_lists.type,
        exerciseId: lift.list_exercise_id,
      });
    }
  });

  const uniqueExercises = Array.from(uniqueExercisesMap.values());

  return {
    uniqueExercises,
    allMaxLifts,
  };
}