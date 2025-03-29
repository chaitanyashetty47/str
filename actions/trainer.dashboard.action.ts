"use server";

import { createClient } from "@/utils/supabase/server";
import { Database } from "@/utils/supabase/types";

type WorkoutType = Database["public"]["Enums"]["workout_type"];

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
  const { count: totalClients, error: clientsError } = await supabase
    .from("trainer_clients")
    .select("*", { count: "exact", head: true })
    .eq("trainer_id", trainerId);
  
  if (clientsError) {
    console.error("Error fetching clients:", clientsError);
  }
  
  // Fetch active workout plans count
  const { count: activePlans, error: plansError } = await supabase
    .from("workout_plans")
    .select("*", { count: "exact", head: true })
    .eq("trainer_id", trainerId);
  
  if (plansError) {
    console.error("Error fetching plans:", plansError);
  }
  
  // Fetch completed workout days to estimate completed sessions
  const { count: completedSessions, error: sessionsError } = await supabase
    .from("workout_day_completion")
    .select("*", { count: "exact", head: true })
    .eq("user_id", trainerId);
  
  if (sessionsError) {
    console.error("Error fetching sessions:", sessionsError);
  }
  
  // 1. Fetch active workout plans (where current date is between start_date and end_date)
  const { data: activePlanData, error: activePlanError } = await supabase
    .from("workout_plans")
    .select(`
      id,
      name,
      start_date,
      end_date,
      user_id,
      users!workout_plans_user_id_fkey(id, name)
    `)
    .eq("trainer_id", trainerId)
    .lte("start_date", currentDate) // Plan has started
    .gte("end_date", currentDate)   // Plan hasn't ended
    .order("start_date", { ascending: true });
  
  if (activePlanError) {
    console.error("Error fetching active plans:", activePlanError);
  }
  
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
      const { data: currentWeekData, error: weekError } = await supabase
        .from("workout_plan_weeks")
        .select("id, week_number, start_date, end_date")
        .eq("plan_id", plan.id)
        .lte("start_date", currentDate)  // Week has started
        .gte("end_date", currentDate)    // Week hasn't ended
        .single();
      
      // Handle no rows found error gracefully
      if (weekError) {
        if (isNoRowsError(weekError)) {
          console.log(`No current week found for plan ${plan.id}`);
          continue; // Skip this plan if no current week
        } else {
          console.error(`Error fetching current week for plan ${plan.id}:`, weekError);
          continue;
        }
      }
      
      if (!currentWeekData) {
        continue; // No current week found for this plan
      }
      
      // 3. Get all workout days for this plan
      const { data: workoutDaysData, error: daysError } = await supabase
        .from("workout_days")
        .select("id, day_number, workout_type")
        .eq("plan_id", plan.id);
      
      if (daysError) {
        console.error(`Error fetching workout days for plan ${plan.id}:`, daysError);
        continue;
      }
      
      if (!workoutDaysData || workoutDaysData.length === 0) {
        continue; // No workout days found for this plan
      }
      
      // 4. Find which workout days are completed for the current week
      const { data: completedDaysData, error: completedError } = await supabase
        .from("workout_day_completion")
        .select("workout_day_id")
        .eq("plan_id", plan.id)
        .eq("week_number", currentWeekData.week_number);
      
      if (completedError) {
        console.error(`Error fetching completed days for plan ${plan.id}, week ${currentWeekData.week_number}:`, completedError);
        continue;
      }
      
      // Make a set of completed workout day IDs for easy lookup
      const completedDayIds = new Set(completedDaysData?.map(day => day.workout_day_id) || []);
      
      // 5. Add pending workout days to upcoming sessions
      for (const workoutDay of workoutDaysData) {
        if (!completedDayIds.has(workoutDay.id)) {
          // This workout day is pending
          upcomingSessions.push({
            client: plan.users?.name || "Unknown User",
            sessionType: workoutDay.workout_type,
            status: "Pending"
          });
        }
      }
    }
  }
  
  // Sort sessions and limit to 5
  upcomingSessions = upcomingSessions.slice(0, 5);
  
  // Fetch recent client activities (using workout completions with associated workout info)
  const { data: recentUpdatesData, error: recentError } = await supabase
    .from("workout_day_completion")
    .select(`
      id,
      completed_at,
      week_number,
      plan_id,
      workout_day_id,
      users!workout_day_completion_user_id_fkey(id, name)
    `)
    .order("completed_at", { ascending: false })
    .limit(3);
  
  if (recentError) {
    console.error("Error fetching recent updates:", recentError);
  }
  
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
      const { data: workoutDay, error: workoutDayError } = await supabase
        .from("workout_days")
        .select("day_number, workout_type")
        .eq("id", update.workout_day_id)
        .single();
      
      if (workoutDayError) {
        if (isNoRowsError(workoutDayError)) {
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
            workoutType: "legs" as WorkoutType
          });
        } else {
          console.error(`Error fetching workout day for completion ${update.id}:`, workoutDayError);
          // Add without workout details
          recentUpdates.push({
            client: update.users?.name || "Unknown User",
            action: "Completed workout",
            time: new Date(update.completed_at || "").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            weekNumber: update.week_number || 1,
            day: 1,
            workoutType: "legs" as WorkoutType
          });
        }
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
        day: workoutDay?.day_number || 1,
        workoutType: (workoutDay?.workout_type || "legs") as WorkoutType
      });
    }
  }
  
  // We're not using mock data anymore as requested
  // Just return the actual data we found
  
  return {
    stats: {
      totalClients: totalClients || 0,
      activePlans: activePlans || 0,
      completedSessions: completedSessions || 0,
    },
    upcomingSessions,
    recentUpdates,
  };
}
