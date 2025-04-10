"use server";

import { createClient } from "@/utils/supabase/server";
import { getBodyPartDisplayName } from "@/constants/workout-types";
import prisma from "@/utils/prisma/prismaClient";

type WorkoutType = string;

interface TrainerDashboardData {
  stats: {
    totalClients: number;
    activePlans: number;
    completedSessions: number;
  };
  upcomingSessions: {
    client: string;
    sessionType: WorkoutType;
    status: string;
  }[];
  recentUpdates: {
    client: string;
    action: string;
    time: string;
    weekNumber: number;
    day: number;
    workoutType: WorkoutType;
  }[];
}

// Helper function to check if error is a "no rows" error (PGRST116)
function isNoRowsError(error: any): boolean {
  return error?.code === 'PGRST116' || 
         error?.message?.includes('JSON object requested, multiple (or no) rows returned');
}

export async function getTrainerDashboardData(): Promise<TrainerDashboardData> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const trainerId = user.id;
  const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
  
  // Fetch total clients count
  let totalClients = 0;
  let clientsError = null;

  try {
    totalClients = await prisma.trainer_clients.count({
      where: {
        trainer_id: trainerId,
      },
    });
  } catch (error) {
    clientsError = error;
  }
  // const { count: totalClients, error: clientsError } = await supabase
  //   .from("trainer_clients")
  //   .select("*", { count: "exact", head: true })
  //   .eq("trainer_id", trainerId);
  
  // if (clientsError) {
  //   console.error("Error fetching clients:", clientsError);
  // }
  
  // Fetch active workout plans using Prisma
  const activePlanData = await prisma.workout_plans.findMany({
    where: {
      trainer_id: trainerId,
      start_date: {
        lte: new Date(currentDate), // Plan has started
      },
      end_date: {
        gte: new Date(currentDate), // Plan hasn't ended
      },
    },
    select: {
      id: true,
      name: true,
      start_date: true,
      end_date: true,
      user_id: true,
      users_workout_plans_clients: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      start_date: 'asc',
    },
  });

  // const { data: activePlanData, error: activePlanError } = await supabase
  //   .from("workout_plans")
  //   .select(`
  //     id,
  //     name,
  //     start_date,
  //     end_date,
  //     user_id,
  //     users!workout_plans_user_id_fkey(id, name)
  //   `)
  //   .eq("trainer_id", trainerId)
  //   .lte("start_date", currentDate) // Plan has started
  //   .gte("end_date", currentDate)   // Plan hasn't ended
  //   .order("start_date", { ascending: true });
  
  // if (activePlanError) {
  //   console.error("Error fetching active plans:", activePlanError);
  // }
  
  // Fetch completed workout days to estimate completed sessions


  let completedSessionsError = null;
  let completedSessions = 0;
  try {

    const clientResults  = await prisma.trainer_clients.findMany({
      where: {
        trainer_id: trainerId,
      },
      select: {
        client_id: true,
      },
    });

    const clientIds = clientResults.map(c => c.client_id); // Extract string[] of client IDs

 
    completedSessions = await prisma.workout_day_completion.count({
      where: {
        user_id: {
          in: clientIds,
        },
      },
    });
  } catch (error) {
    completedSessionsError = error;
  }

  // const { count: completedSessions, error: sessionsError } = await supabase
  //   .from("workout_day_completion")
  //   .select("*", { count: "exact", head: true })
  //   .eq("user_id", trainerId);
  
  // if (sessionsError) {
  //   console.error("Error fetching sessions:", sessionsError);
  // }
  
  // 1. Fetch active workout plans (where current date is between start_date and end_date)

  
  
  // Array to store upcoming sessions
  let upcomingSessions: {
    client: string;
    sessionType: WorkoutType;
    status: string;
  }[] = [];
  
  // Process each active plan
  if (activePlanData && activePlanData.length > 0) {
    for (const plan of activePlanData) {
      // 2. Find the current week for this plan
      const currentWeekData = await prisma.workout_plan_weeks.findFirst({
        where: {
          plan_id: plan.id,
          start_date: {
            lte: new Date(currentDate), // Week has started
          },
          end_date: {
            gte: new Date(currentDate), // Week hasn't ended
          },
        },
        select: {
          id: true,
          week_number: true,
          start_date: true,
          end_date: true,
        },
      });

      // const { data: currentWeekData, error: weekError } = await supabase
      //   .from("workout_plan_weeks")
      //   .select("id, week_number, start_date, end_date")
      //   .eq("plan_id", plan.id)
      //   .lte("start_date", currentDate)  // Week has started
      //   .gte("end_date", currentDate)    // Week hasn't ended
      //   .single();
      
      // Handle no rows found error gracefully
      // if (weekError) {
      //   if (isNoRowsError(weekError)) {
      //     console.log(`No current week found for plan ${plan.id}`);
      //     continue; // Skip this plan if no current week
      //   } else {
      //     console.error(`Error fetching current week for plan ${plan.id}:`, weekError);
      //     continue;
      //   }
      // }
      
      if (!currentWeekData) {
        continue; // No current week found for this plan
      }
      
      // 3. Get all workout days for this plan
      const workoutDaysData = await prisma.workout_days.findMany({
        where: {
          plan_id: plan.id,
        },
        select: {
          id: true,
          day_number: true,
          workout_type: true,
        },
      });

      // const { data: workoutDaysData, error: daysError } = await supabase
      //   .from("workout_days")
      //   .select("id, day_number, workout_type")
      //   .eq("plan_id", plan.id);
      
      // if (daysError) {
      //   console.error(`Error fetching workout days for plan ${plan.id}:`, daysError);
      //   continue;
      // }
      
      if (!workoutDaysData || workoutDaysData.length === 0) {
        continue; // No workout days found for this plan
      }
      
      // 4. Find which workout days are completed for the current week
      const completedDaysData = await prisma.workout_day_completion.findMany({
        where: {
          plan_id: plan.id,
          week_number: currentWeekData.week_number,
        },
        select: {
          workout_day_id: true,
        },
      });

      // const { data: completedDaysData, error: completedError } = await supabase
      //   .from("workout_day_completion")
      //   .select("workout_day_id")
      //   .eq("plan_id", plan.id)
      //   .eq("week_number", currentWeekData.week_number);
      
      // if (completedError) {
      //   console.error(`Error fetching completed days for plan ${plan.id}, week ${currentWeekData.week_number}:`, completedError);
      //   continue;
      // }
      
      // Make a set of completed workout day IDs for easy lookup
      const completedDayIds = new Set(completedDaysData?.map(day => day.workout_day_id) || []);
      
      // 5. Add pending workout days to upcoming sessions
      for (const workoutDay of workoutDaysData) {
        if (!completedDayIds.has(workoutDay.id)) {
          // This workout day is pending
          upcomingSessions.push({
            client: plan.users_workout_plans_clients?.name || "Unknown User",
            sessionType: getBodyPartDisplayName(workoutDay.workout_type),
            status: "Pending"
          });
        }
      }
    }
  }
  
  // Sort sessions and limit to 5
  upcomingSessions = upcomingSessions.slice(0, 5);
  
  // Fetch recent client activities (using workout completions with associated workout info)
  const recentUpdatesData = await prisma.workout_day_completion.findMany({
    select: {
      id: true,
      completed_at: true,
      week_number: true,
      plan_id: true,
      workout_day_id: true,
      users: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      completed_at: 'desc'
    },
    take: 3
  });
  
  // Format recent updates with workout details
  const recentUpdates: TrainerDashboardData["recentUpdates"] = [];
  
  if (recentUpdatesData && recentUpdatesData.length > 0) {
    for (const update of recentUpdatesData) {
      // Skip if workout_day_id is null
      if (!update.workout_day_id) {
        console.error(`Missing workout_day_id for completion ${update.id}`);
        continue;
      }
      
      // Fetch workout day details to get the day number and workout type
      const workoutDay = await prisma.workout_days.findUnique({
        where: {
          id: update.workout_day_id
        },
        select: {
          day_number: true,
          workout_type: true
        }
      });
      
      if (!workoutDay) {
        // No workout day found, but we can still show the update with default values
        recentUpdates.push({
          client: update.users?.name || "Unknown User",
          action: "Completed workout",
          time: new Date(update.completed_at || "").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          weekNumber: update.week_number || 1,
          day: 1,
          workoutType: "unknown"
        });
        continue;
      }

      // Add complete update with workout details
      recentUpdates.push({
        client: update.users?.name || "Unknown User",
        action: "Completed workout",
        time: new Date(update.completed_at || "").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        weekNumber: update.week_number || 1,
        day: workoutDay.day_number || 1,
        workoutType: getBodyPartDisplayName(workoutDay.workout_type || "unknown")
      });
    }
  }
  
  // We're not using mock data anymore as requested
  // Just return the actual data we found
  
  return {
    stats: {
      totalClients: totalClients || 0,
      activePlans: activePlanData.length || 0,
      completedSessions: completedSessions || 0,
    },
    upcomingSessions,
    recentUpdates,
  };
}
