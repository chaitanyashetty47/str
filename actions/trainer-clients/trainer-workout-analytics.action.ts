"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { requireTrainerAccess } from "@/utils/user";

// ────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedTrainerId(): Promise<string | null> {
  try {
    const { userId } = await requireTrainerAccess();
    return userId;
  } catch {
    return null;
  }
}

// Calculate ORM using Epley formula: weight × (1 + reps/30) capped at 12 reps
function calculateORM(weight: number, reps: number): number {
  const cappedReps = Math.min(reps, 12);
  return Math.round(weight * (1 + cappedReps / 30));
}

// ────────────────────────────────────────────────────────────────────────────
// Types (same as client action to ensure compatibility)
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

export interface WeeklyORM {
  weekNumber: number;
  weekDate: string;
  bestORM: number | null;
}

export interface ExerciseProgressData {
  exerciseId: string;
  exerciseName: string;
  bodyPart: string;
  weeklyORMs: WeeklyORM[];
  bestOverallORM: number | null;
  totalImprovement: number | null; // from week 1 to latest
}

export interface OverallAnalyticsData {
  exercises: ExerciseProgressData[];
  planPRs: PRData[];
  totalPRsAchieved: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Trainer Week Analytics
// ────────────────────────────────────────────────────────────────────────────

const trainerWeekAnalyticsInput = z.object({
  planId: z.string().uuid(),
  weekNumber: z.number().min(1).max(52),
});

async function trainerWeekAnalyticsHandler({ 
  planId, 
  weekNumber 
}: z.infer<typeof trainerWeekAnalyticsInput>): Promise<ActionState<z.infer<typeof trainerWeekAnalyticsInput>, WeekAnalyticsData>> {
  const trainerId = await getAuthenticatedTrainerId();
  if (!trainerId) {
    return { error: "Trainer not authenticated" };
  }

  try {
    // First get basic plan info to get client_id and verify trainer ownership
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

    // Verify trainer has access to this client
    const trainerClientRelation = await prisma.trainer_clients.findFirst({
      where: {
        trainer_id: trainerId,
        client_id: basicPlan.client_id,
      },
    });

    if (!trainerClientRelation) {
      return { error: "Access denied. Client not assigned to this trainer." };
    }

    // Get plan and workout data for the specific week
    const plan = await prisma.workout_plans.findFirst({
      where: { 
        id: planId, 
        trainer_id: trainerId 
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
                      where: { client_id: basicPlan.client_id }, // Filter by client
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

    // Get all historical exercise logs for PR detection (for this client only)
    const allClientLogs = await prisma.exercise_logs.findMany({
      where: { client_id: basicPlan.client_id },
      select: {
        id: true,
        weight_used: true,
        reps_done: true,
        performed_date: true,
        workout_set_instructions: {
          select: {
            workout_day_exercises: {
              select: {
                list_exercise_id: true,
              },
            },
          },
        },
      },
    });

    // Process exercises and calculate analytics
    const exercises: ExerciseAnalytics[] = [];
    const prsAchieved: PRData[] = [];
    let totalSets = 0;
    let totalCompletedSets = 0;

    for (const day of plan.workout_days) {
      for (const exercise of day.workout_day_exercises) {
        const sets: SetAnalytics[] = [];
        let bestORM = 0;
        let totalVolume = 0;
        let completedSets = 0;

        // Get historical best ORM for this exercise (for PR detection)
        const exerciseHistoricalLogs = allClientLogs.filter(
          log => log.workout_set_instructions.workout_day_exercises.list_exercise_id === exercise.list_exercise_id
        );

        const historicalORMs = exerciseHistoricalLogs
          .filter(log => log.weight_used && log.reps_done)
          .map(log => calculateORM(log.weight_used!, log.reps_done!));

        const previousBestORM = historicalORMs.length > 0 ? Math.max(...historicalORMs) : 0;

        for (const setInstruction of exercise.workout_set_instructions) {
          totalSets++;
          const log = setInstruction.exercise_logs[0]; // Should be at most 1 due to client filter
          const isCompleted = !!log;
          
          if (isCompleted) {
            completedSets++;
            totalCompletedSets++;
          }

          const weight = log?.weight_used || null;
          const reps = log?.reps_done || null;
          const orm = (weight && reps) ? calculateORM(weight, reps) : null;
          
          // Check for PR
          const isPR = orm ? orm > previousBestORM : false;
          
          if (isPR && orm) {
            prsAchieved.push({
              exerciseId: exercise.list_exercise_id,
              exerciseName: exercise.workout_exercise_lists.name,
              previousPR: previousBestORM > 0 ? previousBestORM : null,
              newPR: orm,
              improvement: previousBestORM > 0 ? orm - previousBestORM : null,
              achievedDate: log?.performed_date?.toISOString() || new Date().toISOString(),
              setDetails: {
                weight: weight!,
                reps: reps!,
                setNumber: setInstruction.set_number,
              },
            });
          }

          if (orm && orm > bestORM) {
            bestORM = orm;
          }

          if (weight && reps) {
            totalVolume += weight * reps;
          }

          sets.push({
            setNumber: setInstruction.set_number,
            weight,
            reps,
            orm,
            isCompleted,
            isPR,
          });
        }

        const completionRate = exercise.workout_set_instructions.length > 0 
          ? Math.round((completedSets / exercise.workout_set_instructions.length) * 100)
          : 0;

        exercises.push({
          exerciseId: exercise.list_exercise_id,
          exerciseName: exercise.workout_exercise_lists.name,
          bodyPart: exercise.workout_exercise_lists.type,
          dayNumber: day.day_number,
          dayTitle: day.title,
          dayDate: day.day_date.toISOString(),
          sets,
          bestORM: bestORM > 0 ? bestORM : null,
          totalVolume,
          completionRate,
        });
      }
    }

    return {
      data: {
        weekNumber,
        exercises,
        prsAchieved,
        totalCompletedSets,
        totalSets,
      },
    };

  } catch (error) {
    console.error("Error in trainer week analytics:", error);
    return { error: "Failed to fetch week analytics" };
  }
}

export const getTrainerWeekAnalytics = createSafeAction<
  z.infer<typeof trainerWeekAnalyticsInput>,
  WeekAnalyticsData
>(trainerWeekAnalyticsInput, trainerWeekAnalyticsHandler);

// ────────────────────────────────────────────────────────────────────────────
// Trainer Overall Analytics
// ────────────────────────────────────────────────────────────────────────────

const trainerOverallAnalyticsInput = z.object({
  planId: z.string().uuid(),
});

async function trainerOverallAnalyticsHandler({ 
  planId 
}: z.infer<typeof trainerOverallAnalyticsInput>): Promise<ActionState<z.infer<typeof trainerOverallAnalyticsInput>, OverallAnalyticsData>> {
  const trainerId = await getAuthenticatedTrainerId();
  if (!trainerId) {
    return { error: "Trainer not authenticated" };
  }

  try {
    // First get basic plan info to get client_id and verify trainer ownership
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

    // Verify trainer has access to this client
    const trainerClientRelation = await prisma.trainer_clients.findFirst({
      where: {
        trainer_id: trainerId,
        client_id: basicPlan.client_id,
      },
    });

    if (!trainerClientRelation) {
      return { error: "Access denied. Client not assigned to this trainer." };
    }

    // Get plan with all workout data
    const plan = await prisma.workout_plans.findFirst({
      where: { 
        id: planId, 
        trainer_id: trainerId 
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
                      where: { client_id: basicPlan.client_id }, // Filter by client
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

    // Get all historical exercise logs for this client (for comprehensive PR detection)
    const allClientLogs = await prisma.exercise_logs.findMany({
      where: { client_id: basicPlan.client_id },
      select: {
        weight_used: true,
        reps_done: true,
        performed_date: true,
        workout_set_instructions: {
          select: {
            workout_day_exercises: {
              select: {
                list_exercise_id: true,
              },
            },
          },
        },
      },
    });

    // Group exercises by exercise ID
    const exerciseMap = new Map<string, {
      exerciseName: string;
      bodyPart: string;
      weeklyData: Map<number, { date: string; orms: number[] }>;
    }>();

    // Process all workout days to build exercise progress
    for (const day of plan.workout_days) {
      for (const exercise of day.workout_day_exercises) {
        const exerciseId = exercise.list_exercise_id;
        
        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            exerciseName: exercise.workout_exercise_lists.name,
            bodyPart: exercise.workout_exercise_lists.type,
            weeklyData: new Map(),
          });
        }

        const exerciseData = exerciseMap.get(exerciseId)!;
        
        if (!exerciseData.weeklyData.has(day.week_number)) {
          exerciseData.weeklyData.set(day.week_number, {
            date: day.day_date.toISOString(),
            orms: [],
          });
        }

        const weekData = exerciseData.weeklyData.get(day.week_number)!;

        // Process sets for this exercise on this day
        for (const setInstruction of exercise.workout_set_instructions) {
          const log = setInstruction.exercise_logs[0]; // Should be at most 1 due to client filter
          
          if (log?.weight_used && log?.reps_done) {
            const orm = calculateORM(log.weight_used, log.reps_done);
            weekData.orms.push(orm);
          }
        }
      }
    }

    // Convert to exercises array with weekly ORMs
    const exercises: ExerciseProgressData[] = [];
    const planPRs: PRData[] = [];

    for (const [exerciseId, data] of exerciseMap) {
      const weeklyORMs: WeeklyORM[] = [];
      let bestOverallORM = 0;

      // Get historical best for PR detection
      const exerciseHistoricalLogs = allClientLogs.filter(
        log => log.workout_set_instructions.workout_day_exercises.list_exercise_id === exerciseId
      );

      const historicalORMs = exerciseHistoricalLogs
        .filter(log => log.weight_used && log.reps_done)
        .map(log => calculateORM(log.weight_used!, log.reps_done!));

      const previousBestORM = historicalORMs.length > 0 ? Math.max(...historicalORMs) : 0;

      // Process weekly data
      for (let week = 1; week <= plan.duration_in_weeks; week++) {
        const weekData = data.weeklyData.get(week);
        let weekBestORM: number | null = null;

        if (weekData && weekData.orms.length > 0) {
          weekBestORM = Math.max(...weekData.orms);
          
          // Check for PRs in this week
          if (weekBestORM > previousBestORM) {
            // Find the specific set that achieved this PR
            const prLog = exerciseHistoricalLogs.find(log => {
              if (!log.weight_used || !log.reps_done) return false;
              const orm = calculateORM(log.weight_used, log.reps_done);
              return orm === weekBestORM;
            });

            if (prLog) {
              planPRs.push({
                exerciseId,
                exerciseName: data.exerciseName,
                previousPR: previousBestORM > 0 ? previousBestORM : null,
                newPR: weekBestORM,
                improvement: previousBestORM > 0 ? weekBestORM - previousBestORM : null,
                achievedDate: prLog.performed_date?.toISOString() || new Date().toISOString(),
                setDetails: {
                  weight: prLog.weight_used!,
                  reps: prLog.reps_done!,
                  setNumber: 1, // We don't have set number in this context
                },
              });
            }
          }

          if (weekBestORM > bestOverallORM) {
            bestOverallORM = weekBestORM;
          }
        }

        // Calculate week start date
        const planStartDate = new Date(plan.start_date);
        const weekStartDate = new Date(planStartDate);
        weekStartDate.setDate(planStartDate.getDate() + (week - 1) * 7);

        weeklyORMs.push({
          weekNumber: week,
          weekDate: weekStartDate.toISOString(),
          bestORM: weekBestORM,
        });
      }

      // Calculate total improvement (first week to last week with data)
      const firstWeekORM = weeklyORMs.find(w => w.bestORM !== null)?.bestORM || 0;
      const lastWeekORM = [...weeklyORMs].reverse().find(w => w.bestORM !== null)?.bestORM || 0;
      const totalImprovement = (firstWeekORM > 0 && lastWeekORM > 0) ? lastWeekORM - firstWeekORM : null;

      exercises.push({
        exerciseId,
        exerciseName: data.exerciseName,
        bodyPart: data.bodyPart,
        weeklyORMs,
        bestOverallORM: bestOverallORM > 0 ? bestOverallORM : null,
        totalImprovement,
      });
    }

    return {
      data: {
        exercises,
        planPRs,
        totalPRsAchieved: planPRs.length,
      },
    };

  } catch (error) {
    console.error("Error in trainer overall analytics:", error);
    return { error: "Failed to fetch overall analytics" };
  }
}

export const getTrainerOverallAnalytics = createSafeAction<
  z.infer<typeof trainerOverallAnalyticsInput>,
  OverallAnalyticsData
>(trainerOverallAnalyticsInput, trainerOverallAnalyticsHandler);