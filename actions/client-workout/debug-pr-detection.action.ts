"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { createClient } from "@/utils/supabase/server";

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error || !user ? null : user.id;
}

// Calculate ORM using Epley formula
function calculateORM(weight: number, reps: number): number {
  const cappedReps = Math.min(reps, 12);
  return Math.round(weight * (1 + cappedReps / 30));
}

export interface PRDebugData {
  planInfo: {
    id: string;
    startDate: string;
    weekStartDate: string;
  };
  existingPRs: {
    exerciseId: string;
    exerciseName: string;
    maxWeight: number;
    dateAchieved: string;
  }[];
  exerciseLogs: {
    exerciseId: string;
    exerciseName: string;
    setNumber: number;
    weight: number;
    reps: number;
    calculatedORM: number;
    loggedDate: string;
    shouldBePR: boolean;
    exceedsPreviousPR: boolean;
    exceedsWeekBest: boolean;
  }[];
  weekBestORMs: Record<string, number>;
}

const debugInput = z.object({
  planId: z.string().uuid(),
  weekNumber: z.number().min(1).max(52),
});

async function debugPRDetectionHandler({ 
  planId, 
  weekNumber 
}: z.infer<typeof debugInput>): Promise<ActionState<z.infer<typeof debugInput>, PRDebugData>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  try {
    // Get plan and verify ownership
    const plan = await prisma.workout_plans.findFirst({
      where: { 
        id: planId, 
        client_id: userId 
      },
      select: {
        id: true,
        start_date: true,
        workout_days: {
          where: { week_number: weekNumber },
          orderBy: { day_number: "asc" },
          include: {
            workout_day_exercises: {
              orderBy: { order: "asc" },
              include: {
                workout_exercise_lists: true,
                workout_set_instructions: {
                  orderBy: { set_number: "asc" },
                  include: {
                    exercise_logs: {
                      where: { client_id: userId },
                      select: {
                        id: true,
                        weight_used: true,
                        reps_done: true,
                        performed_date: true,
                        scheduled_date: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!plan) {
      return { error: "Workout plan not found" };
    }

    // Calculate week start date
    const weekStartDate = new Date(plan.start_date);
    weekStartDate.setDate(weekStartDate.getDate() + (weekNumber - 1) * 7);
    
    // Get existing PRs before this week
    const existingPRsQuery = await prisma.client_max_lifts.findMany({
      where: {
        client_id: userId,
        date_achieved: { lt: weekStartDate },
      },
      include: {
        workout_exercise_lists: true,
      },
      orderBy: { date_achieved: "desc" },
    });

    // Get ALL PRs for comparison
    const allPRs = await prisma.client_max_lifts.findMany({
      where: {
        client_id: userId,
      },
      include: {
        workout_exercise_lists: true,
      },
      orderBy: { date_achieved: "desc" },
    });

    console.log("🔍 DEBUG INFO:");
    console.log(`Plan start date: ${plan.start_date}`);
    console.log(`Week ${weekNumber} start date: ${weekStartDate}`);
    console.log(`Found ${existingPRsQuery.length} existing PRs before week start`);
    console.log(`Found ${allPRs.length} total PRs in database`);

    const prMap = new Map(existingPRsQuery.map(pr => [pr.list_exercise_id, pr.max_weight]));
    const weekBestORMs = new Map<string, number>();

    const exerciseLogs: PRDebugData['exerciseLogs'] = [];

    // Process all exercise logs
    for (const day of plan.workout_days) {
      for (const dayExercise of day.workout_day_exercises) {
        const exerciseId = dayExercise.list_exercise_id;
        const exerciseName = dayExercise.workout_exercise_lists.name;

        for (const setInstruction of dayExercise.workout_set_instructions) {
          const logEntry = setInstruction.exercise_logs[0];
          
          if (logEntry && logEntry.weight_used && logEntry.reps_done) {
            const orm = calculateORM(logEntry.weight_used, logEntry.reps_done);
            const previousPR = prMap.get(exerciseId) || null;
            const currentWeekBest = weekBestORMs.get(exerciseId) || 0;
            
            const exceedsPreviousPR = !previousPR || orm > previousPR;
            const exceedsWeekBest = orm > currentWeekBest;
            const shouldBePR = exceedsPreviousPR && exceedsWeekBest;

            if (shouldBePR) {
              weekBestORMs.set(exerciseId, orm);
            }

            exerciseLogs.push({
              exerciseId,
              exerciseName,
              setNumber: setInstruction.set_number,
              weight: logEntry.weight_used,
              reps: logEntry.reps_done,
              calculatedORM: orm,
              loggedDate: logEntry.performed_date.toISOString(),
              shouldBePR,
              exceedsPreviousPR,
              exceedsWeekBest,
            });

            console.log(`📊 ${exerciseName} Set ${setInstruction.set_number}:`);
            console.log(`   Weight: ${logEntry.weight_used}kg, Reps: ${logEntry.reps_done}, ORM: ${orm}kg`);
            console.log(`   Previous PR: ${previousPR || 'none'}, Week Best: ${currentWeekBest}`);
            console.log(`   Exceeds Previous: ${exceedsPreviousPR}, Exceeds Week Best: ${exceedsWeekBest}`);
            console.log(`   Should be PR: ${shouldBePR}`);
          }
        }
      }
    }

    const result: PRDebugData = {
      planInfo: {
        id: plan.id,
        startDate: plan.start_date.toISOString(),
        weekStartDate: weekStartDate.toISOString(),
      },
      existingPRs: existingPRsQuery.map(pr => ({
        exerciseId: pr.list_exercise_id,
        exerciseName: pr.workout_exercise_lists.name,
        maxWeight: pr.max_weight ?? 0,
        dateAchieved: pr.date_achieved.toISOString(),
      })),
      exerciseLogs,
      weekBestORMs: Object.fromEntries(weekBestORMs),
    };

    console.log("📋 All PRs in database:", allPRs.map(pr => ({
      exercise: pr.workout_exercise_lists.name,
      weight: pr.max_weight,
      date: pr.date_achieved.toISOString(),
    })));

    return { data: result };

  } catch (error) {
    console.error("Error debugging PR detection:", error);
    return { error: "Failed to debug PR detection" };
  }
}

export const debugPRDetection = createSafeAction(debugInput, debugPRDetectionHandler); 