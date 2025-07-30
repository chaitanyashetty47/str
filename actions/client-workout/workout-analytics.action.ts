"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { createClient } from "@/utils/supabase/server";

// ────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error || !user ? null : user.id;
}

// Calculate ORM using Epley formula: weight × (1 + reps/30) capped at 12 reps
function calculateORM(weight: number, reps: number): number {
  const cappedReps = Math.min(reps, 12);
  return Math.round(weight * (1 + cappedReps / 30));
}

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface SetAnalytics {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  orm: number | null;
  isCompleted: boolean;
  isPR: boolean; // New PR achieved in this set
}

export interface ExerciseAnalytics {
  exerciseId: string;
  exerciseName: string;
  bodyPart: string;
  dayNumber: number;
  dayTitle: string;
  dayDate: string;
  sets: SetAnalytics[];
  bestORM: number | null;
  totalVolume: number; // weight × reps × sets
  completionRate: number; // percentage of sets completed
}

export interface WeekAnalyticsData {
  weekNumber: number;
  exercises: ExerciseAnalytics[];
  prsAchieved: PRData[];
  totalCompletedSets: number;
  totalSets: number;
}

export interface PRData {
  exerciseId: string;
  exerciseName: string;
  previousPR: number | null;
  newPR: number;
  improvement: number | null; // kg improvement
  achievedDate: string;
  setDetails: {
    weight: number;
    reps: number;
    setNumber: number;
  };
}

export interface OverallAnalyticsData {
  exercises: ExerciseProgressData[];
  planPRs: PRData[];
  totalPRsAchieved: number;
}

export interface ExerciseProgressData {
  exerciseId: string;
  exerciseName: string;
  bodyPart: string;
  weeklyORMs: WeeklyORM[];
  bestOverallORM: number | null;
  totalImprovement: number | null; // from week 1 to latest
}

export interface WeeklyORM {
  weekNumber: number;
  bestORM: number | null;
  weekDate: string; // ISO date of week start
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Get Weekly Analytics - ORM data for specific week
// ────────────────────────────────────────────────────────────────────────────

const weekAnalyticsInput = z.object({
  planId: z.string().uuid(),
  weekNumber: z.number().min(1).max(52),
});

async function weekAnalyticsHandler({ 
  planId, 
  weekNumber 
}: z.infer<typeof weekAnalyticsInput>): Promise<ActionState<z.infer<typeof weekAnalyticsInput>, WeekAnalyticsData>> {
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

    // Get existing PRs before this week to identify new PRs
    const weekStartDate = new Date(plan.start_date);
    weekStartDate.setDate(weekStartDate.getDate() + (weekNumber - 1) * 7);
    
    const existingPRs = await prisma.client_max_lifts.findMany({
      where: {
        client_id: userId,
        date_achieved: { lt: weekStartDate },
      },
      select: {
        list_exercise_id: true,
        max_weight: true,
      },
    });

    const prMap = new Map(existingPRs.map(pr => [pr.list_exercise_id, pr.max_weight]));

    // Process exercises
    const exerciseMap = new Map<string, ExerciseAnalytics>();
    const prsAchieved: PRData[] = [];
    const weekBestORMs = new Map<string, number>(); // Track best ORM per exercise across the week
    let totalCompletedSets = 0;
    let totalSets = 0;

    for (const day of plan.workout_days) {
      for (const dayExercise of day.workout_day_exercises) {
        const exerciseId = dayExercise.list_exercise_id;
        const exerciseName = dayExercise.workout_exercise_lists.name;
        const bodyPart = dayExercise.workout_exercise_lists.type;

        // Create unique key for exercise per day
        const exerciseKey = `${exerciseId}-${day.day_number}`;

        if (!exerciseMap.has(exerciseKey)) {
          exerciseMap.set(exerciseKey, {
            exerciseId,
            exerciseName,
            bodyPart,
            dayNumber: day.day_number,
            dayTitle: day.title,
            dayDate: day.day_date.toISOString(),
            sets: [],
            bestORM: null,
            totalVolume: 0,
            completionRate: 0,
          });
        }

        const exercise = exerciseMap.get(exerciseKey)!;
        const previousPR = prMap.get(exerciseId) || null;

        for (const setInstruction of dayExercise.workout_set_instructions) {
          const logEntry = setInstruction.exercise_logs[0]; // Should be only one per set
          const isCompleted = !!logEntry;
          
          let orm: number | null = null;
          let isPR = false;
          let volume = 0;

          if (isCompleted && logEntry.weight_used && logEntry.reps_done) {
            orm = calculateORM(logEntry.weight_used, logEntry.reps_done);
            volume = logEntry.weight_used * logEntry.reps_done;
            
            // Get current week's best ORM for this exercise
            const currentWeekBest = weekBestORMs.get(exerciseId) || 0;
            
            // Check if this is a new PR
            // Must exceed BOTH previous PR and current week's best
            const exceedsPreviousPR = !previousPR || orm > previousPR;
            const exceedsWeekBest = orm > currentWeekBest;
            
            if (exceedsPreviousPR && exceedsWeekBest) {
              isPR = true;
              weekBestORMs.set(exerciseId, orm); // Update week best for this exercise
              
              // Update or add to PRs list - only keep the best PR for this exercise this week
              const existingPRIndex = prsAchieved.findIndex(pr => pr.exerciseId === exerciseId);
              const newPRData = {
                exerciseId,
                exerciseName,
                previousPR,
                newPR: orm,
                improvement: previousPR ? orm - previousPR : null,
                achievedDate: logEntry.performed_date.toISOString(),
                setDetails: {
                  weight: logEntry.weight_used,
                  reps: logEntry.reps_done,
                  setNumber: setInstruction.set_number,
                },
              };
              
              if (existingPRIndex >= 0) {
                // Update existing PR if this one is better
                prsAchieved[existingPRIndex] = newPRData;
              } else {
                // Add new PR
                prsAchieved.push(newPRData);
              }
            }
          }

          exercise.sets.push({
            setNumber: setInstruction.set_number,
            weight: logEntry?.weight_used || null,
            reps: logEntry?.reps_done || null,
            orm,
            isCompleted,
            isPR,
          });

          exercise.totalVolume += volume;
          if (orm && (!exercise.bestORM || orm > exercise.bestORM)) {
            exercise.bestORM = orm;
          }

          totalSets++;
          if (isCompleted) totalCompletedSets++;
        }

        // Calculate completion rate
        const completedSets = exercise.sets.filter(s => s.isCompleted).length;
        exercise.completionRate = exercise.sets.length > 0 
          ? Math.round((completedSets / exercise.sets.length) * 100) 
          : 0;
      }
    }

    const result: WeekAnalyticsData = {
      weekNumber,
      exercises: Array.from(exerciseMap.values()),
      prsAchieved,
      totalCompletedSets,
      totalSets,
    };

    return { data: result };

  } catch (error) {
    console.error("Error fetching week analytics:", error);
    return { error: "Failed to fetch week analytics" };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Get Overall Analytics - ORM progression across all weeks
// ────────────────────────────────────────────────────────────────────────────

const overallAnalyticsInput = z.object({
  planId: z.string().uuid(),
});

async function overallAnalyticsHandler({ 
  planId 
}: z.infer<typeof overallAnalyticsInput>): Promise<ActionState<z.infer<typeof overallAnalyticsInput>, OverallAnalyticsData>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  try {
    // Get plan with all workout data
    const plan = await prisma.workout_plans.findFirst({
      where: { 
        id: planId, 
        client_id: userId 
      },
      select: {
        id: true,
        start_date: true,
        duration_in_weeks: true,
        workout_days: {
          orderBy: [{ week_number: "asc" }, { day_number: "asc" }],
          include: {
            workout_day_exercises: {
              include: {
                workout_exercise_lists: true,
                workout_set_instructions: {
                  include: {
                    exercise_logs: {
                      where: { client_id: userId },
                      select: {
                        weight_used: true,
                        reps_done: true,
                        performed_date: true,
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

    // Get all PRs achieved during plan duration
    const planStartDate = new Date(plan.start_date);
    const planEndDate = new Date(planStartDate);
    planEndDate.setDate(planEndDate.getDate() + (plan.duration_in_weeks * 7));

    const planPRs = await prisma.client_max_lifts.findMany({
      where: {
        client_id: userId,
        date_achieved: {
          gte: planStartDate,
          lte: planEndDate,
        },
      },
      include: {
        workout_exercise_lists: true,
      },
      orderBy: { date_achieved: "asc" },
    });

    // Process exercise progression data
    const exerciseProgressMap = new Map<string, ExerciseProgressData>();

    // Group data by week and exercise
    const weeklyData = new Map<number, Map<string, number>>(); // week -> exerciseId -> bestORM

    for (const day of plan.workout_days) {
      const weekNumber = day.week_number;
      
      if (!weeklyData.has(weekNumber)) {
        weeklyData.set(weekNumber, new Map());
      }
      
      const weekData = weeklyData.get(weekNumber)!;

      for (const dayExercise of day.workout_day_exercises) {
        const exerciseId = dayExercise.list_exercise_id;
        const exerciseName = dayExercise.workout_exercise_lists.name;
        const bodyPart = dayExercise.workout_exercise_lists.type;

        // Initialize exercise progress data if not exists
        if (!exerciseProgressMap.has(exerciseId)) {
          exerciseProgressMap.set(exerciseId, {
            exerciseId,
            exerciseName,
            bodyPart,
            weeklyORMs: [],
            bestOverallORM: null,
            totalImprovement: null,
          });
        }

        let weekBestORM = weekData.get(exerciseId) || null;

        // Find best ORM for this exercise in this week
        for (const setInstruction of dayExercise.workout_set_instructions) {
          const logEntry = setInstruction.exercise_logs[0];
          
          if (logEntry && logEntry.weight_used && logEntry.reps_done) {
            const orm = calculateORM(logEntry.weight_used, logEntry.reps_done);
            
            if (!weekBestORM || orm > weekBestORM) {
              weekBestORM = orm;
            }
          }
        }

        if (weekBestORM) {
          weekData.set(exerciseId, weekBestORM);
        }
      }
    }

    // Build weekly ORM arrays for each exercise
    for (const [exerciseId, exerciseProgress] of exerciseProgressMap) {
      const weeklyORMs: WeeklyORM[] = [];
      
      for (let week = 1; week <= plan.duration_in_weeks; week++) {
        const weekStartDate = new Date(planStartDate);
        weekStartDate.setDate(weekStartDate.getDate() + (week - 1) * 7);
        
        const weekData = weeklyData.get(week);
        const bestORM = weekData?.get(exerciseId) || null;
        
        weeklyORMs.push({
          weekNumber: week,
          bestORM,
          weekDate: weekStartDate.toISOString(),
        });

        // Update best overall ORM
        if (bestORM && (!exerciseProgress.bestOverallORM || bestORM > exerciseProgress.bestOverallORM)) {
          exerciseProgress.bestOverallORM = bestORM;
        }
      }

      exerciseProgress.weeklyORMs = weeklyORMs;
      
      // Calculate total improvement (first week with data vs last week with data)
      const firstORM = weeklyORMs.find(w => w.bestORM)?.bestORM;
      const lastORM = weeklyORMs.slice().reverse().find(w => w.bestORM)?.bestORM;
      
      if (firstORM && lastORM && lastORM > firstORM) {
        exerciseProgress.totalImprovement = lastORM - firstORM;
      }
    }

    // Convert plan PRs to our format
    const formattedPlanPRs: PRData[] = planPRs.map(pr => ({
      exerciseId: pr.list_exercise_id,
      exerciseName: pr.workout_exercise_lists.name,
      previousPR: null, // Would need additional query to get previous PR
      newPR: pr.max_weight,
      improvement: null, // Would need additional calculation
      achievedDate: pr.date_achieved.toISOString(),
      setDetails: {
        weight: 0, // Not available in max_lifts table
        reps: 0,
        setNumber: 0,
      },
    }));

    const result: OverallAnalyticsData = {
      exercises: Array.from(exerciseProgressMap.values()),
      planPRs: formattedPlanPRs,
      totalPRsAchieved: formattedPlanPRs.length,
    };

    return { data: result };

  } catch (error) {
    console.error("Error fetching overall analytics:", error);
    return { error: "Failed to fetch overall analytics" };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Export Actions
// ────────────────────────────────────────────────────────────────────────────

export const getWeekAnalytics = createSafeAction(weekAnalyticsInput, weekAnalyticsHandler);
export const getOverallAnalytics = createSafeAction(overallAnalyticsInput, overallAnalyticsHandler); 