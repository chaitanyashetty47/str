"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { createClient } from "@/utils/supabase/server";
// Removed unstable_cache import since we're not using it for now
// import { unstable_cache as cache } from "next/cache";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface ProgressMetrics {
  currentWeek: number;
  currentDay: number;
  totalWeeks: number;
  daysRemaining: number;
  progressPercentage: number;
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
  dayNumber: 1 | 2 | 3 | 4 | 5;
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

// Single week output for the lazy-loading action
export interface SingleWeekOutput {
  weekNumber: number;
  days: DayDetail[];
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function calculateProgress(start: Date, end: Date, totalWeeks: number): ProgressMetrics {
  const now = new Date();

  // Clamp dates to avoid negative numbers
  const totalDurationMs = Math.max(end.getTime() - start.getTime(), 1);
  const elapsedMs = Math.max(now.getTime() - start.getTime(), 0);

  const progressPercentage = Math.min(
    100,
    Math.round((elapsedMs / totalDurationMs) * 100),
  );

  const daysRemaining = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const currentWeek = Math.min(
    totalWeeks,
    Math.max(1, Math.ceil(elapsedMs / (7 * 24 * 60 * 60 * 1000))),
  );

  // Calculate current day (assuming 5 training days per week)
  const weekProgress = (elapsedMs % (7 * 24 * 60 * 60 * 1000)) / (7 * 24 * 60 * 60 * 1000);
  const currentDay = Math.min(5, Math.max(1, Math.ceil(weekProgress * 5))) as 1 | 2 | 3 | 4 | 5;

  return {
    currentWeek,
    currentDay,
    totalWeeks,
    daysRemaining,
    progressPercentage,
  };
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. getClientWorkoutPlanFull - Fetch complete plan with all weeks/days/exercises
// ────────────────────────────────────────────────────────────────────────────
const fullPlanInput = z.object({
  planId: z.string().uuid(),
});

async function fullPlanHandler({ planId }: z.infer<typeof fullPlanInput>): Promise<ActionState<z.infer<typeof fullPlanInput>, FullWorkoutPlan>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  // Fetch the complete plan with all nested data
  const plan = await prisma.workout_plans.findFirst({
    where: { 
      id: planId, 
      client_id: userId 
    },
    include: {
      workout_days: {
        orderBy: [{ week_number: "asc" }, { day_number: "asc" }],
        include: {
          workout_day_exercises: {
            orderBy: { order: "asc" },
            include: {
              workout_exercise_lists: true,
              workout_set_instructions: {
                orderBy: { set_number: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return { error: "Plan not found" };
  }

  // Calculate progress
  const progress = calculateProgress(
    plan.start_date,
    plan.end_date,
    plan.duration_in_weeks,
  );

  // Group days by week
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
      estimatedTimeMinutes: 0, // Could be calculated based on exercises and rest times
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

  const output: FullWorkoutPlan = {
    id: plan.id,
    title: plan.title,
    description: plan.description ?? "",
    category: plan.category,
    startDate: plan.start_date.toISOString(),
    endDate: plan.end_date.toISOString(),
    durationWeeks: plan.duration_in_weeks,
    progress,
    weeks,
  };

  return { data: output };
}

// Export without cache wrapper so authentication works
export const getClientWorkoutPlanFull = createSafeAction<
  z.infer<typeof fullPlanInput>,
  FullWorkoutPlan
>(fullPlanInput, fullPlanHandler);

// ────────────────────────────────────────────────────────────────────────────
// 2. getWeekDetail - Fetch specific week details (for lazy loading)
// ────────────────────────────────────────────────────────────────────────────
const weekDetailInput = z.object({
  planId: z.string().uuid(),
  weekNumber: z.number().min(1).max(52),
});

async function weekDetailHandler({ planId, weekNumber }: z.infer<typeof weekDetailInput>): Promise<ActionState<z.infer<typeof weekDetailInput>, SingleWeekOutput>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  // Guard - ensure user owns this plan
  const planExists = await prisma.workout_plans.findFirst({
    where: { id: planId, client_id: userId },
    select: { id: true },
  });

  if (!planExists) {
    return { error: "Plan not found" };
  }

  // Fetch specific week's days
  const days = await prisma.workout_days.findMany({
    where: { 
      plan_id: planId, 
      week_number: weekNumber 
    },
    orderBy: { day_number: "asc" },
    include: {
      workout_day_exercises: {
        orderBy: { order: "asc" },
        include: {
          workout_exercise_lists: true,
          workout_set_instructions: {
            orderBy: { set_number: "asc" },
          },
        },
      },
    },
  });

  // Map to DTO
  const daysDto: DayDetail[] = days.map((d) => ({
    dayNumber: d.day_number as 1 | 2 | 3 | 4 | 5,
    title: d.title,
    dayDate: d.day_date.toISOString(),
    exercises: d.workout_day_exercises.map((ex) => ({
      listExerciseId: ex.list_exercise_id,
      name: ex.workout_exercise_lists.name,
      bodyPart: ex.workout_exercise_lists.type,
      thumbnailUrl: ex.workout_exercise_lists.gif_url,
      instructions: ex.instructions ?? "",
      youtubeLink: ex.workout_exercise_lists.youtube_link,
      sets: ex.workout_set_instructions.map((set) => ({
        setNumber: set.set_number,
        weight: set.weight_prescribed?.toString() ?? "",
        reps: set.reps?.toString() ?? "",
        rest: set.rest_time ?? 0,
        notes: set.notes ?? "",
      })),
    })),
    estimatedTimeMinutes: 0,
  }));

  return { 
    data: { 
      weekNumber, 
      days: daysDto 
    } 
  };
}

// Export without cache wrapper so authentication works  
export const getWeekDetail = createSafeAction<
  z.infer<typeof weekDetailInput>,
  SingleWeekOutput
>(weekDetailInput, weekDetailHandler);
