"use server";

import { createClient } from "@/utils/supabase/server";
import prisma from "@/utils/prisma/prismaClient";
import { unstable_cache } from 'next/cache';
import type {
  TrainerDashboardData,
  TrainerDashboardStats,
  UpcomingWorkout,
  RecentActivity,
  OngoingPlan,
  ClientPR,
  NewlyAssignedClient,
} from "@/types/trainer.dashboard";

// Helper function to get current week's Monday and Sunday
function getCurrentWeekRange(): { monday: Date; sunday: Date } {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  // Calculate days to subtract to get to Monday (0 = Sunday, so Sunday -> 6 days back to Monday)
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { monday, sunday };
}

// Helper function for stats
async function fetchTrainerStats(
  trainerId: string,
  currentDate: Date
): Promise<TrainerDashboardStats> {
  // Get trainer's clients
  const clientIds = await prisma.trainer_clients
    .findMany({
      where: { trainer_id: trainerId },
      select: { client_id: true },
    })
    .then((clients) => clients.map((c) => c.client_id));

  const [totalClients, activePlans] = await Promise.all([
    prisma.trainer_clients.count({ where: { trainer_id: trainerId } }),
    prisma.workout_plans.count({
      where: {
        trainer_id: trainerId,
        start_date: { lte: currentDate },
        end_date: { gte: currentDate },
      },
    }),
  ]);

  // Calculate week progress percentage across all clients (plan-based weeks)
  let weekProgressPercentage = 0;
  
  if (clientIds.length > 0) {
    // Get all active plans for this trainer
    const activePlans = await prisma.workout_plans.findMany({
      where: {
        trainer_id: trainerId,
        start_date: { lte: currentDate },
        end_date: { gte: currentDate },
      },
    });

    let totalWeekSets = 0;
    let totalWeekCompletedSets = 0;

    // Calculate progress for each plan's current week
    for (const plan of activePlans) {
      // Calculate current week for this plan
      const elapsedMs = currentDate.getTime() - plan.start_date.getTime();
      const currentWeek = Math.min(
        plan.duration_in_weeks,
        Math.max(1, Math.ceil(elapsedMs / (7 * 24 * 60 * 60 * 1000)))
      );

      // Get workout days for current week of this plan
      const currentWeekDays = await prisma.workout_days.findMany({
        where: {
          plan_id: plan.id,
          week_number: currentWeek,
          is_deleted: false, // Filter out soft-deleted days
        },
        include: {
          workout_day_exercises: {
            where: { is_deleted: false }, // Filter out soft-deleted exercises
            include: {
              workout_set_instructions: {
                where: { is_deleted: false }, // Filter out soft-deleted sets
                include: {
                  exercise_logs: {
                    where: {
                      client_id: plan.client_id, // Only logs for this specific client
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Count sets for this plan's current week
      for (const day of currentWeekDays) {
        for (const exercise of day.workout_day_exercises) {
          for (const setInstruction of exercise.workout_set_instructions) {
            totalWeekSets++;
            if (setInstruction.exercise_logs.length > 0) {
              totalWeekCompletedSets++;
            }
          }
        }
      }
    }

    weekProgressPercentage = totalWeekSets > 0 ? Math.round((totalWeekCompletedSets / totalWeekSets) * 100) : 0;
  }

  return { totalClients, activePlans, weekProgressPercentage };
}

// Helper function for upcoming workouts
async function fetchUpcomingWorkouts(
  trainerId: string,
  currentDate: Date
): Promise<UpcomingWorkout[]> {
  const nextWeek = new Date(currentDate);
  nextWeek.setDate(currentDate.getDate() + 7);

  const upcomingDays = await prisma.workout_days.findMany({
    where: {
      is_deleted: false, // Filter out soft-deleted days
      workout_plans: {
        trainer_id: trainerId,
        start_date: { lte: currentDate },
        end_date: { gte: currentDate },
        status: "PUBLISHED",
      },
      day_date: {
        gte: currentDate,
        lte: nextWeek,
      },
    },
    include: {
      workout_plans: {
        select: {
          client: {
            select: {
              name: true,
            },
          },
        },
      },
      workout_day_exercises: {
        where: { is_deleted: false }, // Filter out soft-deleted exercises
        include: {
          workout_exercise_lists: {
            select: {
              name: true,
            },
          },
          workout_set_instructions: {
            where: { is_deleted: false }, // Filter out soft-deleted sets
            include: {
              exercise_logs: {
                where: {
                  performed_date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      day_date: 'asc',
    },
    take: 5,
  });

  return upcomingDays.map((day) => {
    const exercises = day.workout_day_exercises.map((ex) => ex.workout_exercise_lists.name);
    
    // Check if workout is completed (all sets have logs)
    const totalSets = day.workout_day_exercises.reduce(
      (sum, ex) => sum + ex.workout_set_instructions.length,
      0
    );
    const completedSets = day.workout_day_exercises.reduce(
      (sum, ex) => sum + ex.workout_set_instructions.filter(set => set.exercise_logs.length > 0).length,
      0
    );

    return {
      client: day.workout_plans.client?.name || "Unknown User",
      workoutTitle: day.title,
      scheduledDate: day.day_date.toISOString().split('T')[0],
      exercises,
      status: (totalSets > 0 && completedSets === totalSets) ? "completed" : "pending",
    };
  });
}

// Helper function for recent activity
async function fetchRecentActivity(trainerId: string): Promise<RecentActivity[]> {
  const clientIds = await prisma.trainer_clients
    .findMany({
      where: { trainer_id: trainerId },
      select: { client_id: true },
    })
    .then((clients) => clients.map((c) => c.client_id));

  if (clientIds.length === 0) {
    return [];
  }

  const recentLogs = await prisma.exercise_logs.findMany({
    where: {
      client_id: { in: clientIds },
    },
    include: {
      users_profile: {
        select: {
          name: true,
        },
      },
      workout_set_instructions: {
        include: {
          workout_day_exercises: {
            include: {
              workout_exercise_lists: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      performed_date: "desc",
    },
    take: 5,
  });

  return recentLogs.map((log) => ({
    client: log.users_profile?.name || "Unknown User",
    exerciseName: log.workout_set_instructions.workout_day_exercises.workout_exercise_lists.name,
    weight: log.weight_used || 0,
    reps: log.reps_done || 0,
    loggedDate: log.performed_date?.toISOString().split('T')[0] || "N/A",
  }));
}

// Helper function for ongoing plans
async function fetchOngoingPlans(
  trainerId: string,
  currentDate: Date
): Promise<OngoingPlan[]> {
  const activePlans = await prisma.workout_plans.findMany({
    where: {
      trainer_id: trainerId,
      start_date: { lte: currentDate },
      end_date: { gte: currentDate },
      status: "PUBLISHED",
    },
    include: {
      client: {
        select: {
          name: true,
        },
      },
      workout_days: {
        include: {
          workout_day_exercises: {
            include: {
              workout_set_instructions: {
                include: {
                  exercise_logs: true, // Get all logs, we'll filter by client_id later
                },
              },
            },
          },
        },
      },
    },
  });

  return activePlans.map((plan) => {
    // Calculate current week for this plan
    const elapsedMs = currentDate.getTime() - plan.start_date.getTime();
    const currentWeek = Math.min(
      plan.duration_in_weeks,
      Math.max(1, Math.ceil(elapsedMs / (7 * 24 * 60 * 60 * 1000)))
    );

    // Calculate weekly progress (current week only, plan-based)
    const currentWeekDays = plan.workout_days.filter((day) => 
      day.week_number === currentWeek
    );

    let weeklyTotalSets = 0;
    let weeklyCompletedSets = 0;

    for (const day of currentWeekDays) {
      for (const exercise of day.workout_day_exercises) {
        for (const setInstruction of exercise.workout_set_instructions) {
          weeklyTotalSets++;
          // Check if this specific client has logged this set
          const hasLog = setInstruction.exercise_logs.some(log => 
            log.client_id === plan.client_id
          );
          if (hasLog) {
            weeklyCompletedSets++;
          }
        }
      }
    }

    // Calculate overall progress (weeks 1 to current week, set-based)
    const overallWeekDays = plan.workout_days.filter((day) => 
      day.week_number <= currentWeek
    );

    let overallTotalSets = 0;
    let overallCompletedSets = 0;

    for (const day of overallWeekDays) {
      for (const exercise of day.workout_day_exercises) {
        for (const setInstruction of exercise.workout_set_instructions) {
          overallTotalSets++;
          // Check if this specific client has logged this set
          const hasLog = setInstruction.exercise_logs.some(log => 
            log.client_id === plan.client_id
          );
          if (hasLog) {
            overallCompletedSets++;
          }
        }
      }
    }

    const weeklyProgressPercentage = weeklyTotalSets > 0 
      ? Math.round((weeklyCompletedSets / weeklyTotalSets) * 100) 
      : 0;

    const overallProgressPercentage = overallTotalSets > 0 
      ? Math.round((overallCompletedSets / overallTotalSets) * 100) 
      : 0;

    return {
      clientName: plan.client?.name || "Unknown Client",
      planTitle: plan.title,
      weeklyProgressPercentage,
      overallProgressPercentage,
      currentWeek,
      totalWeeks: plan.duration_in_weeks,
      planId: plan.id,
    };
  });
}

// Helper function for client PRs
async function fetchClientPRs(trainerId: string): Promise<ClientPR[]> {
  const clientIds = await prisma.trainer_clients
    .findMany({
      where: { trainer_id: trainerId },
      select: { client_id: true },
    })
    .then((clients) => clients.map((c) => c.client_id));

  if (clientIds.length === 0) {
    return [];
  }

  const recentPRs = await prisma.client_max_lifts.findMany({
    where: {
      client_id: { in: clientIds },
      is_invalid: false, // NEW: Filter out invalid PRs
    },
    include: {
      users_profile: {
        select: {
          name: true,
        },
      },
      workout_exercise_lists: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      last_updated: "desc",
    },
    take: 10, // Get last 10 PRs across all clients
  });

  return recentPRs.map((pr) => ({
    id: pr.id,
    clientName: pr.users_profile?.name || "Unknown Client",
    exerciseName: pr.workout_exercise_lists.name,
    weight: pr.max_weight ?? 0,
    reps: null, // Max lifts don't store reps, they're calculated 1RMs
    oneRepMax: pr.max_weight ?? 0, // This is already the calculated 1RM
    date: pr.date_achieved.toISOString().split('T')[0],
  }));
}

// Helper function for newly assigned clients without workout plans
async function fetchNewlyAssignedClients(trainerId: string): Promise<NewlyAssignedClient[]> {
  const currentDate = new Date();
  
  // Get clients who need new plans (no active or future plans)
  // Using a different approach: get all trainer clients first, then filter out those with active/future plans
  const allTrainerClients = await prisma.trainer_clients.findMany({
    where: {
      trainer_id: trainerId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          workout_plans_as_client: {
            select: {
              start_date: true,
              end_date: true,
              status: true
            }
          }
        }
      }
    },
    orderBy: {
      assigned_at: 'desc'
    }
  });

  // Filter out clients who have active or future plans
  const newlyAssignedClients = allTrainerClients.filter(trainerClient => {
    const hasActiveOrFuturePlan = trainerClient.client.workout_plans_as_client.some(plan => {
      // Check if plan is active (current date falls within plan dates)
      const isActive = plan.start_date <= currentDate && plan.end_date >= currentDate;
      // Check if plan is future (plan starts in the future)
      const isFuture = plan.start_date > currentDate;
      
      return isActive || isFuture;
    });
    
    return !hasActiveOrFuturePlan;
  });

  // Process and format the data
  return newlyAssignedClients.map(client => ({
    id: client.id,
    clientId: client.client_id,
    clientName: client.client.name,
    clientEmail: client.client.email,
    assignedAt: client.assigned_at.toISOString(),
    category: client.category,
    daysSinceAssignment: Math.floor(
      (currentDate.getTime() - client.assigned_at.getTime()) / (1000 * 60 * 60 * 24)
    )
  }));
}

// Cached function for fetching dashboard data
const getCachedTrainerDashboardData = unstable_cache(
  async (trainerId: string): Promise<TrainerDashboardData> => {
    const currentDate = new Date();

    try {
      const [stats, upcomingWorkouts, recentActivity, ongoingPlans, clientPRs, newlyAssignedClients] = await Promise.all([
        fetchTrainerStats(trainerId, currentDate),
        fetchUpcomingWorkouts(trainerId, currentDate),
        fetchRecentActivity(trainerId),
        fetchOngoingPlans(trainerId, currentDate),
        fetchClientPRs(trainerId),
        fetchNewlyAssignedClients(trainerId),
      ]);

      return {
        stats,
        upcomingWorkouts,
        recentActivity,
        ongoingPlans,
        clientPRs,
        newlyAssignedClients,
      };
    } catch (error) {
      console.error("Error fetching trainer dashboard data:", error);
      throw new Error("Failed to load dashboard data. Please try again later.");
    }
  },
  ['trainer-dashboard-data'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['trainer-dashboard']
  }
);

// Main export function that handles authentication and uses the cached function
export async function getTrainerDashboardData(): Promise<TrainerDashboardData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  return getCachedTrainerDashboardData(user.id);
}
