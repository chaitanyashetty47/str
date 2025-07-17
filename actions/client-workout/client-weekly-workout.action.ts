"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { createClient } from "@/utils/supabase/server";
import { getWeekDateRangeRaw } from "@/utils/date-utils";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
export interface WorkoutSet {
  setNumber: number;
  targetWeight: number; // Always in kg
  targetReps: number;
  targetRpe?: number;
  restTime: number;
  notes: string;
  // Logged values (null if not logged yet)
  loggedWeight?: number | null; // Always in kg
  loggedReps?: number | null;
  loggedRpe?: number | null;
  isCompleted: boolean;
}

export interface WorkoutExercise {
  dayExerciseId: string; // workout_day_exercises.id for logging
  listExerciseId: string;
  name: string;
  bodyPart: string;
  thumbnailUrl: string | null;
  instructions: string;
  youtubeLink: string | null;
  sets: WorkoutSet[];
  completedSets: number;
  totalSets: number;
  isCompleted: boolean; // All sets logged
}

export interface WorkoutDay {
  dayId: string; // workout_days.id
  dayNumber: 1 | 2 | 3 | 4 | 5;
  title: string;
  dayDate: string; // ISO date string
  exercises: WorkoutExercise[];
  completedSets: number;
  totalSets: number;
  progressPercentage: number; // 0-100 based on sets completed
  isCompleted: boolean; // All exercises completed
}

export interface WeeklyWorkoutData {
  planId: string;
  planTitle: string;
  weekNumber: number;
  startDate: string; // Monday of the week
  endDate: string; // Sunday of the week
  totalWeeks: number;
  days: WorkoutDay[];
  totalCompletedSets: number;
  totalSets: number;
  weekProgressPercentage: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Main Action
// ────────────────────────────────────────────────────────────────────────────
const weeklyWorkoutInput = z.object({
  workoutId: z.string().uuid(),
  // startDate: z.string(), // Simple date string like "2025-06-29"
  // endDate: z.string(),   // Simple date string like "2025-07-05"
  weekNumber: z.number(),
});

async function weeklyWorkoutHandler({ 
  workoutId, 
  // startDate, 
  // endDate,
  weekNumber 
}: z.infer<typeof weeklyWorkoutInput>): Promise<ActionState<z.infer<typeof weeklyWorkoutInput>, WeeklyWorkoutData>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  try {
    // Convert simple date strings to proper Date objects for database queries
    // const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    // const endDateTime = new Date(endDate + 'T23:59:59.999Z');
    

    // Fetch the plan with days in the date range
    const plan = await prisma.workout_plans.findFirst({
      where: { 
        id: workoutId, 
        client_id: userId 
      },
      select: {
        id: true,
        title: true,
        duration_in_weeks: true,
        workout_days: {
          where: {
            week_number: weekNumber,
            // day_date: {
            //   gte: startDateTime,
            //   lte: endDateTime,
            // },
          },
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
                      // where: {
                      //   date: {
                      //     gte: startDateTime,
                      //     lte: endDateTime,
                      //   },
                      // },
                      select:{
                        id:true,
                        client_id:true,
                        weight_used:true,
                        reps_done:true,
                        rpe:true,
                      }
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

    // Calculate week number based on start date
    const weekStartDate = new Date(plan.workout_days[0].day_date );
    // Start date is a Monday so add six days to get the Sunday
    const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    // const weekNumber = Math.floor((startDateTime.getTime() - planStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

    // Process days
    const days: WorkoutDay[] = [];
    let totalCompletedSets = 0;
    let totalSets = 0;

    for (const dbDay of plan.workout_days) {
      const exercises: WorkoutExercise[] = [];
      let dayCompletedSets = 0;
      let dayTotalSets = 0;

      for (const dbExercise of dbDay.workout_day_exercises) {
        const sets: WorkoutSet[] = [];
        let exerciseCompletedSets = 0;

        for (const dbSet of dbExercise.workout_set_instructions) {
          // Find corresponding log entry for this set
          const logEntry = dbSet.exercise_logs.find(
            log => log.client_id === userId
          );

          const workoutSet: WorkoutSet = {
            setNumber: dbSet.set_number,
            targetWeight: dbSet.weight_prescribed || 0,
            targetReps: dbSet.reps || 0,
            targetRpe: undefined, // RPE not in current schema
            restTime: dbSet.rest_time || 0,
            notes: dbSet.notes || "",
            loggedWeight: logEntry?.weight_used || null,
            loggedReps: logEntry?.reps_done || null,
            loggedRpe: logEntry?.rpe || null,
            isCompleted: !!logEntry,
          };

          sets.push(workoutSet);
          dayTotalSets++;
          
          if (workoutSet.isCompleted) {
            exerciseCompletedSets++;
            dayCompletedSets++;
          }
        }

        const exercise: WorkoutExercise = {
          dayExerciseId: dbExercise.id,
          listExerciseId: dbExercise.list_exercise_id,
          name: dbExercise.workout_exercise_lists.name,
          bodyPart: dbExercise.workout_exercise_lists.type,
          thumbnailUrl: dbExercise.workout_exercise_lists.gif_url,
          instructions: dbExercise.instructions || "",
          youtubeLink: dbExercise.workout_exercise_lists.youtube_link || dbExercise.youtube_link,
          sets,
          completedSets: exerciseCompletedSets,
          totalSets: sets.length,
          isCompleted: exerciseCompletedSets === sets.length,
        };

        exercises.push(exercise);
      }

      const day: WorkoutDay = {
        dayId: dbDay.id,
        dayNumber: dbDay.day_number as 1 | 2 | 3 | 4 | 5,
        title: dbDay.title,
        dayDate: dbDay.day_date.toISOString(),
        exercises,
        completedSets: dayCompletedSets,
        totalSets: dayTotalSets,
        progressPercentage: dayTotalSets > 0 ? Math.round((dayCompletedSets / dayTotalSets) * 100) : 0,
        isCompleted: dayTotalSets > 0 && dayCompletedSets === dayTotalSets,
      };

      days.push(day);
      totalCompletedSets += dayCompletedSets;
      totalSets += dayTotalSets;
    }

    const totalWeeks = plan.duration_in_weeks;

    const result: WeeklyWorkoutData = {
      planId: plan.id,
      planTitle: plan.title,
      weekNumber,
      startDate: weekStartDate.toISOString(),
      endDate: weekEndDate.toISOString(),
      totalWeeks,
      days,
      totalCompletedSets,
      totalSets,
      weekProgressPercentage: totalSets > 0 ? Math.round((totalCompletedSets / totalSets) * 100) : 0,
    };

    return { data: result };

  } catch (error) {
    console.error("Error fetching weekly workout data:", error);
    return { error: "Failed to fetch workout data" };
  }
}

export const getWeeklyWorkoutDays = createSafeAction<
  z.infer<typeof weeklyWorkoutInput>,
  WeeklyWorkoutData
>(weeklyWorkoutInput, weeklyWorkoutHandler);

 