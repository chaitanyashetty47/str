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

// Single week output for the lazy-loading action
export interface SingleWeekOutput {
  weekNumber: number;
  days: DayDetail[];
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
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
  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    for (let dayNum = 1; dayNum <= 7; dayNum++) { // Support 7 days, not just 5
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + (weekNum - 1) * 7 + (dayNum - 1));
      dayDate.setHours(0, 0, 0, 0);
      
      if (dayDate.getTime() === today.getTime()) {
        currentWeek = weekNum; // Update current week if we found a match
        currentDay = dayNum;
        break;
      }
    }
    if (currentDay !== 1) break; // Found the day, exit outer loop
  }

  // Calculate set-based progress (like fetchOngoingPlans)
  let overallTotalSets = 0;
  let overallCompletedSets = 0;
  let weeklyTotalSets = 0;
  let weeklyCompletedSets = 0;

  console.log(`🔍 [calculateProgress] Debug Info:`);
  console.log(`   - Current Week: ${currentWeek}`);
  console.log(`   - Current Day: ${currentDay}`);
  console.log(`   - Total Weeks: ${totalWeeks}`);
  console.log(`   - Workout Days Count: ${workoutDays.length}`);
  console.log(`   - Client ID: ${clientId}`);

  // Calculate overall progress (weeks 1 to current week, set-based)
  const overallWeekDays = workoutDays.filter((day) => 
    day.week_number <= currentWeek
  );

  console.log(`📊 [Overall Progress] Debug:`);
  console.log(`   - Overall Week Days Count: ${overallWeekDays.length}`);
  console.log(`   - Overall Week Days:`, overallWeekDays.map(d => ({ week: d.week_number, day: d.day_number })));

  // Group by week for better debugging
  const weekBreakdown = new Map<number, { total: number; completed: number }>();
  
  for (const day of overallWeekDays) {
    const weekNum = day.week_number;
    if (!weekBreakdown.has(weekNum)) {
      weekBreakdown.set(weekNum, { total: 0, completed: 0 });
    }
    
    for (const exercise of day.workout_day_exercises) {
      for (const setInstruction of exercise.workout_set_instructions) {
        overallTotalSets++;
        weekBreakdown.get(weekNum)!.total++;
        
        // Check if this specific client has logged this set - using same logic as weekly workout action
        const logEntry = setInstruction.exercise_logs?.find(
          (log: any) => log.client_id === clientId
        );
        if (logEntry) {
          overallCompletedSets++;
          weekBreakdown.get(weekNum)!.completed++;
        }
      }
    }
  }

  console.log(`   - Week Breakdown:`, Object.fromEntries(weekBreakdown));

  console.log(`   - Overall Total Sets: ${overallTotalSets}`);
  console.log(`   - Overall Completed Sets: ${overallCompletedSets}`);
  console.log(`   - Overall Weeks Included: 1 to ${currentWeek}`);

  // Calculate weekly progress (current week only, set-based) - using same logic as client-weekly-workout.action.ts
  const currentWeekDays = workoutDays.filter((day) => 
    day.week_number === currentWeek
  );

  console.log(`📈 [Weekly Progress] Debug:`);
  console.log(`   - Current Week Days Count: ${currentWeekDays.length}`);
  console.log(`   - Current Week Days:`, currentWeekDays.map(d => ({ week: d.week_number, day: d.day_number })));

  for (const day of currentWeekDays) {
    for (const exercise of day.workout_day_exercises) {
      for (const setInstruction of exercise.workout_set_instructions) {
        weeklyTotalSets++;
        // Check if this specific client has logged this set - using same logic as weekly workout action
        const logEntry = setInstruction.exercise_logs?.find(
          (log: any) => log.client_id === clientId
        );
        if (logEntry) {
          weeklyCompletedSets++;
        }
      }
    }
  }

  console.log(`   - Weekly Total Sets: ${weeklyTotalSets}`);
  console.log(`   - Weekly Completed Sets: ${weeklyCompletedSets}`);
  console.log(`   - Weekly Week: ${currentWeek} only`);

  // Calculate progress percentages
  const progressPercentage = overallTotalSets > 0 
    ? Math.round((overallCompletedSets / overallTotalSets) * 100) 
    : 0;

  const weeklyProgressPercentage = weeklyTotalSets > 0 
    ? Math.round((weeklyCompletedSets / weeklyTotalSets) * 100) 
    : 0;

  console.log(`🎯 [Final Progress] Debug:`);
  console.log(`   - Overall Progress: ${progressPercentage}% (${overallCompletedSets}/${overallTotalSets})`);
  console.log(`   - Weekly Progress: ${weeklyProgressPercentage}% (${weeklyCompletedSets}/${weeklyTotalSets})`);

  const daysRemaining = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return {
    currentWeek,
    currentDay: currentDay as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    totalWeeks,
    daysRemaining,
    progressPercentage,
    weeklyProgressPercentage,
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
          where: {
            is_deleted: false, // Get all weeks, not just current week
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
    return { error: "Plan not found" };
  }

  // Calculate progress with workout data for set-based calculation
  const progress = calculateProgress(
    plan.start_date,
    plan.end_date,
    plan.duration_in_weeks,
    plan.workout_days,
    userId
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
      week_number: weekNumber,
      is_deleted: false // Filter out soft-deleted days
    },
    orderBy: { day_number: "asc" },
    include: {
      workout_day_exercises: {
        where: { is_deleted: false }, // Filter out soft-deleted exercises
        orderBy: { order: "asc" },
        include: {
          workout_exercise_lists: true,
          workout_set_instructions: {
            where: { is_deleted: false }, // Filter out soft-deleted sets
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
