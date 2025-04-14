"use server";

import { createClient } from "@/utils/supabase/server";
import { getBodyPartDisplayName } from "@/constants/workout-types";
import prisma from "@/utils/prisma/prismaClient";
import { unstable_cache } from 'next/cache';
import type {
  TrainerDashboardData,
  TrainerDashboardStats,
  UpcomingSession,
  RecentUpdate,
} from "@/types/trainer.dashboard";

// --- Helper Function for Stats ---
async function fetchTrainerStats(
  trainerId: string,
  currentDate: Date
): Promise<TrainerDashboardStats> {
  const clientIds = await prisma.trainer_clients
    .findMany({
      where: { trainer_id: trainerId },
      select: { client_id: true },
    })
    .then((clients) => clients.map((c) => c.client_id));

  const [totalClients, activePlans, completedSessions] = await Promise.all([
    prisma.trainer_clients.count({ where: { trainer_id: trainerId } }),
    prisma.workout_plans.count({
      where: {
        trainer_id: trainerId,
        start_date: { lte: currentDate },
        end_date: { gte: currentDate },
      },
    }),
    clientIds.length > 0
      ? prisma.workout_day_completion.count({
          where: {
            user_id: { in: clientIds },
          },
        })
      : 0,
  ]);

  return { totalClients, activePlans, completedSessions };
}

// --- Helper Function for Upcoming Sessions ---
async function fetchUpcomingSessions(
  trainerId: string,
  currentDate: Date
): Promise<UpcomingSession[]> {
  const activePlans = await prisma.workout_plans.findMany({
    where: {
      trainer_id: trainerId,
      start_date: { lte: currentDate },
      end_date: { gte: currentDate },
    },
    select: {
      id: true,
      users_workout_plans_clients: {
        select: {
          name: true,
        },
      },
      workout_plan_weeks: {
        where: {
          start_date: { lte: currentDate },
          end_date: { gte: currentDate },
        },
        select: {
          id: true,
          week_number: true,
        },
        take: 1,
      },
    },
  });

  const upcomingSessions: UpcomingSession[] = [];

  for (const plan of activePlans) {
    if (!plan.workout_plan_weeks?.[0]) continue;

    const currentWeek = plan.workout_plan_weeks[0];

    // Get workout days and their completion status in a single query
    const workoutDaysWithCompletion = await prisma.workout_days.findMany({
      where: {
        plan_id: plan.id,
      },
      select: {
        id: true,
        workout_type: true,
        workout_day_completion: {
          where: {
            week_number: currentWeek.week_number,
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Add pending sessions
    for (const day of workoutDaysWithCompletion) {
      if (day.workout_day_completion.length === 0) {
        upcomingSessions.push({
          client: plan.users_workout_plans_clients?.name || "Unknown User",
          sessionType: getBodyPartDisplayName(day.workout_type),
          status: "Pending",
        });

        // Break if we have 5 sessions
        if (upcomingSessions.length >= 5) {
          return upcomingSessions;
        }
      }
    }
  }

  return upcomingSessions;
}

// --- Helper Function for Recent Updates ---
async function fetchRecentUpdates(trainerId: string): Promise<RecentUpdate[]> {
  const clientIds = await prisma.trainer_clients
    .findMany({
      where: { trainer_id: trainerId },
      select: { client_id: true },
    })
    .then((clients) => clients.map((c) => c.client_id));

  if (clientIds.length === 0) {
    return [];
  }

  const recentCompletions = await prisma.workout_day_completion.findMany({
    where: {
      user_id: { in: clientIds },
    },
    select: {
      completed_at: true,
      week_number: true,
      users: {
        select: {
          name: true,
        },
      },
      workout_days: {
        select: {
          day_number: true,
          workout_type: true,
        },
      },
    },
    orderBy: {
      completed_at: "desc",
    },
    take: 3,
  });

  return recentCompletions.map((update) => ({
    client: update.users?.name || "Unknown User",
    action: "Completed workout",
    time: update.completed_at
      ? new Date(update.completed_at).toISOString().split('T')[0]
      : "N/A",
    weekNumber: update.week_number || 1,
    day: update.workout_days?.day_number || 1,
    workoutType: getBodyPartDisplayName(update.workout_days?.workout_type || "unknown"),
  }));
}

// Cached function for fetching dashboard data
const getCachedTrainerDashboardData = unstable_cache(
  async (trainerId: string): Promise<TrainerDashboardData> => {
    const currentDate = new Date();

    try {
      const [stats, upcomingSessions, recentUpdates] = await Promise.all([
        fetchTrainerStats(trainerId, currentDate),
        fetchUpcomingSessions(trainerId, currentDate),
        fetchRecentUpdates(trainerId),
      ]);

      return {
        stats,
        upcomingSessions,
        recentUpdates,
      };
    } catch (error) {
      console.error("Error fetching trainer dashboard data:", error);
      throw new Error("Failed to load dashboard data. Please try again later.");
    }
  },
  ['trainer-dashboard-data'],
  {
    revalidate: 300, // Cache for 5 minutes (300 seconds)
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
