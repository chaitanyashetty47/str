'use server';

import { z } from "zod";
import { ActionState, createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { WorkoutCategory, WorkoutPlanStatus } from "@prisma/client";

// ────────────────────────────────────────────────────────────────────────────
// Input validation schema
// ────────────────────────────────────────────────────────────────────────────
const getAllWorkoutPlansInput = z.object({
  page: z.number().min(0),
  pageSize: z.number().min(1).max(100),
  search: z.string().optional(),
  category: z.nativeEnum(WorkoutCategory).optional(),
  status: z.enum(["active", "upcoming", "previous", "all"]),
  sortBy: z.enum(["title", "start_date", "end_date", "created_at"]),
  sortOrder: z.enum(["asc", "desc"]),
});

export type GetAllWorkoutPlansInput = z.infer<typeof getAllWorkoutPlansInput>;

export interface WorkoutPlanWithDetails {
  id: string;
  title: string;
  description: string | null;
  category: WorkoutCategory;
  status: WorkoutPlanStatus;
  start_date: Date;
  end_date: Date;
  duration_in_weeks: number;
  created_at: Date;
  trainer: {
    id: string;
    name: string;
  };
}

export type GetAllWorkoutPlansOutput = {
  plans: WorkoutPlanWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

// ────────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────────
async function getAllWorkoutPlansHandler({ 
  page = 0, 
  pageSize = 10, 
  search, 
  category, 
  status = "active",
  sortBy = "start_date", 
  sortOrder = "desc" 
}: GetAllWorkoutPlansInput): Promise<ActionState<GetAllWorkoutPlansInput, GetAllWorkoutPlansOutput>> {
  try {
    // Get authenticated user
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Build where clause
    const whereClause: any = {
      client_id: userId,
      status: "PUBLISHED", // Only show published plans
    };

    // Search filter
    if (search && search.trim()) {
      whereClause.title = {
        contains: search.trim(),
        mode: 'insensitive'
      };
    }

    // Category filter
    if (category) {
      whereClause.category = category;
    }

    // Status filter (active, upcoming, previous)
    if (status !== "all") {
      switch (status) {
        case "active":
          whereClause.start_date = { lte: today };
          whereClause.end_date = { gte: today };
          break;
        case "upcoming":
          whereClause.start_date = { gt: today };
          break;
        case "previous":
          whereClause.end_date = { lt: today };
          break;
      }
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get total count
    const totalCount = await prisma.workout_plans.count({
      where: whereClause
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = page * pageSize;

    // Get workout plans
    const plans = await prisma.workout_plans.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        status: true,
        start_date: true,
        end_date: true,
        duration_in_weeks: true,
        created_at: true,
        trainer: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return { 
      data: { 
        plans,
        totalCount,
        totalPages,
        currentPage: page,
        pageSize
      } 
    };

  } catch (error: any) {
    console.error("Get all workout plans error:", error);
    return { error: "Failed to fetch workout plans. Please try again." };
  }
}

export const getAllWorkoutPlans = createSafeAction<GetAllWorkoutPlansInput, GetAllWorkoutPlansOutput>(
  getAllWorkoutPlansInput,
  getAllWorkoutPlansHandler,
);
