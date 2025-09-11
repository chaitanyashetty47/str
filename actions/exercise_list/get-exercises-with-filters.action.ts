'use server';

import { z } from "zod";
import { ActionState, createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { BodyPart } from "@prisma/client";

// ────────────────────────────────────────────────────────────────────────────
// Input validation schema
// ────────────────────────────────────────────────────────────────────────────
const getExercisesInput = z.object({
  page: z.number().min(0),
  pageSize: z.number().min(1).max(100),
  search: z.string().optional(),
  bodyPart: z.nativeEnum(BodyPart).optional(),
  sortBy: z.enum(["name", "type", "created_at"]),
  sortOrder: z.enum(["asc", "desc"]),
});

export type GetExercisesInput = z.infer<typeof getExercisesInput>;

export interface ExerciseWithDetails {
  id: string;
  name: string;
  type: BodyPart;
  is_reps_based: boolean;
  youtube_link: string | null;
  created_at: Date;
  created_by_id: string;
}

export type GetExercisesOutput = {
  exercises: ExerciseWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

// ────────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────────
async function getExercisesHandler({ 
  page = 0, 
  pageSize = 10, 
  search, 
  bodyPart, 
  sortBy = "name", 
  sortOrder = "asc" 
}: GetExercisesInput): Promise<ActionState<GetExercisesInput, GetExercisesOutput>> {
  try {
    // Build where clause
    const whereClause: any = {};

    // Search filter
    if (search && search.trim()) {
      whereClause.name = {
        contains: search.trim(),
        mode: 'insensitive'
      };
    }

    // Body part filter
    if (bodyPart) {
      whereClause.type = bodyPart;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get total count
    const totalCount = await prisma.workout_exercise_lists.count({
      where: whereClause
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = page * pageSize;

    // Get exercises
    const exercises = await prisma.workout_exercise_lists.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        type: true,
        is_reps_based: true,
        youtube_link: true,
        created_at: true,
        created_by_id: true,
      }
    });

    return { 
      data: { 
        exercises,
        totalCount,
        totalPages,
        currentPage: page,
        pageSize
      } 
    };

  } catch (error: any) {
    console.error("Get exercises error:", error);
    return { error: "Failed to fetch exercises. Please try again." };
  }
}

export const getExercisesWithFilters = createSafeAction<GetExercisesInput, GetExercisesOutput>(
  getExercisesInput,
  getExercisesHandler,
);