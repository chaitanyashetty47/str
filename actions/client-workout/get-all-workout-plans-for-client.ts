'use server';

import { z } from "zod";
import { ActionState, createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { WorkoutCategory, WorkoutPlanStatus } from "@prisma/client";

// ────────────────────────────────────────────────────────────────────────────
// Input validation schema
// ────────────────────────────────────────────────────────────────────────────
const getClientWorkoutPlansInput = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "upcoming", "previous", "all"]).default("all").optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional()
  }).optional(),
  sortBy: z.enum(["title", "start_date", "end_date", "created_at"]).default("start_date").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional()
});

export type GetClientWorkoutPlansInput = z.infer<typeof getClientWorkoutPlansInput>;

export interface ClientWorkoutPlan {
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
  // Computed status for UI
  computedStatus: "active" | "upcoming" | "previous";
}

export type GetClientWorkoutPlansOutput = {
  plans: ClientWorkoutPlan[];
};

// ────────────────────────────────────────────────────────────────────────────
// Helper function to compute status based on dates
// ────────────────────────────────────────────────────────────────────────────
function computeStatus(startDate: Date, endDate: Date): "active" | "upcoming" | "previous" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (startDate > today) return "upcoming";
  if (endDate < today) return "previous";
  return "active";
}

// ────────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────────
async function getClientWorkoutPlansHandler({ 
  search, 
  status = "all",
  dateRange,
  sortBy = "start_date", 
  sortOrder = "desc" 
}: GetClientWorkoutPlansInput): Promise<ActionState<GetClientWorkoutPlansInput, GetClientWorkoutPlansOutput>> {
  try {
    // Get authenticated user
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { error: "User not authenticated" };
    }

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

    // Date range filter - show plans that overlap with the selected range
    if (dateRange?.from && dateRange?.to) {
      whereClause.OR = [
        // Plan starts within range
        {
          start_date: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        },
        // Plan ends within range
        {
          end_date: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        },
        // Plan spans the entire range
        {
          AND: [
            { start_date: { lte: dateRange.from } },
            { end_date: { gte: dateRange.to } }
          ]
        }
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get workout plans
    const plans = await prisma.workout_plans.findMany({
      where: whereClause,
      orderBy,
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

    // Add computed status and apply status filtering
    const plansWithComputedStatus = plans.map(plan => ({
      ...plan,
      computedStatus: computeStatus(plan.start_date, plan.end_date)
    }));

    // Apply status filter after fetching (more flexible)
    const filteredPlans = status === "all" 
      ? plansWithComputedStatus
      : plansWithComputedStatus.filter(plan => plan.computedStatus === status);

    return { 
      data: { 
        plans: filteredPlans
      } 
    };

  } catch (error: any) {
    console.error("Get client workout plans error:", error);
    return { error: "Failed to fetch workout plans. Please try again." };
  }
}

export const getClientWorkoutPlans = createSafeAction<GetClientWorkoutPlansInput, GetClientWorkoutPlansOutput>(
  getClientWorkoutPlansInput,
  getClientWorkoutPlansHandler,
);
