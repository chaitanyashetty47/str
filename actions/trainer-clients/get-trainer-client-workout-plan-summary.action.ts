"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { requireTrainerAccess } from "@/utils/user";

// ────────────────────────────────────────────────────────────────────────────
// Types (same as client action to ensure compatibility)
// ────────────────────────────────────────────────────────────────────────────
 export interface ProgressMetrics {
  currentWeek: number;
  currentDay: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  totalWeeks: number;
  daysRemaining: number;
  progressPercentage: number;        // Overall progress (set-based)
  weeklyProgressPercentage: number;  // Current week progress (set-based)
}

export interface SetInstruction {
  setNumber: number;
  weight: string;
  reps: string;
  rest: number;
  notes: string;
}

export interface ExerciseDetail {
  listExerciseId: string;
  name: string;
  bodyPart: string;
  thumbnailUrl: string | null;
  instructions: string;
  youtubeLink: string | null; // from workout_exercise_lists table
  sets: SetInstruction[];
}

export interface DayDetail {
  dayNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  dayDate: string; // ISO date string from day_date field
  exercises: ExerciseDetail[];
  estimatedTimeMinutes: number;
}

export interface WeekDetail {
  weekNumber: number;
  title: string;
  days: DayDetail[];
}

export interface FullWorkoutPlan {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  progress: ProgressMetrics;
  weeks: WeekDetail[];
}

// ────────────────────────────────────────────────────────────────────────────
// Enhanced type that includes client information for trainer view
// ────────────────────────────────────────────────────────────────────────────
export interface TrainerClientWorkoutPlan extends FullWorkoutPlan {
  client: {
    id: string;
    name: string;
    email: string;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helper functions (copied from client action to maintain consistency)
// ────────────────────────────────────────────────────────────────────────────
function calculateProgress(
  start: Date, 
  end: Date, 
  totalWeeks: number, 
  workoutDays: any[], 
  clientId: string
): ProgressMetrics {
  const now = new Date();

  // Clamp dates to avoid negative numbers
  const totalDurationMs = Math.max(end.getTime() - start.getTime(), 1);
  const elapsedMs = Math.max(now.getTime() - start.getTime(), 0);

  // Calculate current week using the same logic as fetchOngoingPlans
  let currentWeek = Math.min(
    totalWeeks,
    Math.max(1, Math.ceil(elapsedMs / (7 * 24 * 60 * 60 * 1000))),
  );

  // Calculate current day using in-memory date matching
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Strip time for date comparison

  let currentDay = 1; // Default fallback to Day 1 of Week 1

  // Find which workout day matches today's date
  for (const day of workoutDays) {
    const dayDate = new Date(day.day_date);
    dayDate.setHours(0, 0, 0, 0); // Strip time for comparison
    
    if (dayDate.getTime() === today.getTime()) {
      currentDay = day.day_number;
      break;
    }
  }

  // Calculate days remaining
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

  // Calculate set-based progress
  let totalSets = 0;
  let completedSets = 0;
  let currentWeekSets = 0;
  let currentWeekCompletedSets = 0;

  for (const day of workoutDays) {
    const isCurrentWeekDay = day.week_number === currentWeek;
    
    for (const exercise of day.workout_day_exercises) {
      for (const setInstruction of exercise.workout_set_instructions) {
        totalSets++;
        if (isCurrentWeekDay) currentWeekSets++;
        
        // Check if this set has been logged by the client
        const hasLog = setInstruction.exercise_logs.some((log: any) => log.client_id === clientId);
        if (hasLog) {
          completedSets++;
          if (isCurrentWeekDay) currentWeekCompletedSets++;
        }
      }
    }
  }

  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  const weeklyProgressPercentage = currentWeekSets > 0 ? (currentWeekCompletedSets / currentWeekSets) * 100 : 0;

  return {
    currentWeek,
    currentDay: currentDay as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    totalWeeks,
    daysRemaining,
    progressPercentage,
    weeklyProgressPercentage,
  };
}

async function getAuthenticatedTrainerId(): Promise<string | null> {
  try {
    const { userId } = await requireTrainerAccess();
    return userId;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main action - Get client workout plan for trainer view
// ────────────────────────────────────────────────────────────────────────────
const trainerClientPlanInput = z.object({
  planId: z.string().uuid(),
});

async function trainerClientPlanHandler({ 
  planId
}: z.infer<typeof trainerClientPlanInput>): Promise<ActionState<z.infer<typeof trainerClientPlanInput>, TrainerClientWorkoutPlan>> {
  const trainerId = await getAuthenticatedTrainerId();
  if (!trainerId) {
    return { error: "Trainer not authenticated" };
  }

  // First get basic plan info to get the client_id
  const basicPlan = await prisma.workout_plans.findFirst({
    where: { 
      id: planId, 
      trainer_id: trainerId, // Only fetch plans owned by this trainer
    },
    select: {
      id: true,
      client_id: true,
    },
  });

  if (!basicPlan) {
    return { error: "Workout plan not found or access denied" };
  }

  // Additional check: Verify trainer has access to this client
  const trainerClientRelation = await prisma.trainer_clients.findFirst({
    where: {
      trainer_id: trainerId,
      client_id: basicPlan.client_id,
    },
  });

  if (!trainerClientRelation) {
    return { error: "Access denied. Client not assigned to this trainer." };
  }

  // Now fetch the complete plan with all nested data
  const plan = await prisma.workout_plans.findFirst({
    where: { 
      id: planId, 
      trainer_id: trainerId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      workout_days: {
        where: {
          is_deleted: false,
        },
        orderBy: [{ week_number: "asc" }, { day_number: "asc" }],
        include: {
          workout_day_exercises: {
            orderBy: { order: "asc" },
            include: {
              workout_exercise_lists: true,
              workout_set_instructions: {
                orderBy: { set_number: "asc" },
                include: {
                  exercise_logs: {
                    where: {
                      client_id: basicPlan.client_id, // Only get logs for this specific client
                    },
                    select: {
                      id: true,
                      client_id: true,
                      weight_used: true,
                      reps_done: true,
                      rpe: true,
                    }
                  }
                }
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return { error: "Workout plan not found or access denied" };
  }

  // Calculate progress with workout data for set-based calculation
  const progress = calculateProgress(
    plan.start_date,
    plan.end_date,
    plan.duration_in_weeks,
    plan.workout_days,
    basicPlan.client_id // Use client ID from the basic plan
  );

  // Group days by week (same logic as client action)
  const weeksMap = new Map<number, DayDetail[]>();

  for (const dbDay of plan.workout_days) {
    const exercises: ExerciseDetail[] = dbDay.workout_day_exercises.map((ex) => {
      const sets: SetInstruction[] = ex.workout_set_instructions.map((s) => ({
        setNumber: s.set_number,
        weight: s.weight_prescribed?.toString() ?? "",
        reps: s.reps?.toString() ?? "",
        rest: s.rest_time ?? 0,
        notes: s.notes ?? "",
      }));

      return {
        listExerciseId: ex.list_exercise_id,
        name: ex.workout_exercise_lists.name,
        bodyPart: ex.workout_exercise_lists.type,
        thumbnailUrl: ex.workout_exercise_lists.gif_url,
        instructions: ex.instructions ?? "",
        youtubeLink: ex.workout_exercise_lists.youtube_link,
        sets,
      };
    });

    const dayDetail: DayDetail = {
      dayNumber: dbDay.day_number as 1 | 2 | 3 | 4 | 5,
      title: dbDay.title,
      dayDate: dbDay.day_date.toISOString(),
      exercises,
      estimatedTimeMinutes: 0,
    };

    const weekDays = weeksMap.get(dbDay.week_number) ?? [];
    weekDays.push(dayDetail);
    weeksMap.set(dbDay.week_number, weekDays);
  }

  // Convert to ordered weeks array
  const weeks: WeekDetail[] = Array.from(weeksMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([weekNumber, days]) => ({
      weekNumber,
      title: `Week ${weekNumber}`,
      days: days.sort((a, b) => a.dayNumber - b.dayNumber),
    }));

  const output: TrainerClientWorkoutPlan = {
    id: plan.id,
    title: plan.title,
    description: plan.description ?? "",
    category: plan.category,
    startDate: plan.start_date.toISOString(),
    endDate: plan.end_date.toISOString(),
    durationWeeks: plan.duration_in_weeks,
    progress,
    weeks,
    client: {
      id: plan.client.id,
      name: plan.client.name,
      email: plan.client.email,
    },
  };

  return { data: output };
}

export const getTrainerClientWorkoutPlanFull = createSafeAction<
  z.infer<typeof trainerClientPlanInput>,
  TrainerClientWorkoutPlan
>(trainerClientPlanInput, trainerClientPlanHandler);