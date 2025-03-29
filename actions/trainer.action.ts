"use server";

import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";

/**
 * Interface for client progress data
 */
interface ClientProgressData {
  id: string;
  name: string;
  plan: string;
  planId: string;
  progress: number;
  status: "On Track" | "Behind Schedule" | "Exceeding Goals";
  metrics: {
    attendance: number;
    goalCompletion: number;
    improvement: string;
  };
  recentMilestones: string[];
}

/**
 * Interface for client workout log data with detailed sets information
 */
interface ClientWorkoutLogData {
  dayId: string;
  dayNumber: number;
  workoutType: string;
  weekNumber: number;
  exercises: {
    id: string;
    name: string;
    sets: {
      setNumber: number;
      weight: number;
      reps: number;
      isPR: boolean;
    }[];
    notes: string | null;
  }[];
  completedAt: string | null;
}

/**
 * Fetches the progress data for all clients assigned to the current trainer
 * Calculates completion metrics based on workout day completions
 * 
 * @returns An array of client progress data objects
 */
export async function getClientsProgress(): Promise<{ data: ClientProgressData[] | null; error: string | null }> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: "Session expired" };
  }

  try {
    // First get all clients assigned to this trainer
    const { data: clients, error: clientsError } = await supabase
      .from("trainer_clients")
      .select(`
        client:users!trainer_clients_client_id_fkey (
          id, 
          name
        )
      `)
      .eq("trainer_id", user.id);

    if (clientsError) throw new Error(clientsError.message);
    if (!clients.length) return { data: [], error: null };

    // Extract client IDs
    const clientIds = clients.map(relation => relation.client.id);

    // Get all active workout plans for these clients
    const { data: plans, error: plansError } = await supabase
      .from("workout_plans")
      .select(`
        id,
        name,
        category,
        days,
        duration_weeks,
        start_date,
        end_date,
        user_id
      `)
      .in("user_id", clientIds)
      .gte("end_date", new Date().toISOString()); // Only get active plans

    if (plansError) throw new Error(plansError.message);

    // For each plan, get completion data
    const clientProgress = await Promise.all(
      plans.map(async (plan) => {
        // Find the client name
        const client = clients.find(c => c.client.id === plan.user_id)?.client;
        if (!client) return null;

        // Get count of completed workouts for this plan
        const { data: completions, error: completionsError } = await supabase
          .from("workout_day_completion")
          .select("id", { count: 'exact' })
          .eq("plan_id", plan.id)
          .eq("user_id", plan.user_id);

        if (completionsError) throw new Error(completionsError.message);

        // Calculate metrics
        const totalWorkouts = (plan.days || 0) * plan.duration_weeks;
        const completedWorkouts = completions?.length || 0;
        const completionRate = totalWorkouts > 0 
          ? Math.round((completedWorkouts / totalWorkouts) * 100)
          : 0;
        
        // Determine improvement by checking recent completion rate vs overall
        // For this example, we'll just use a placeholder calculation
        // In a real app, you'd compare recent weeks vs earlier weeks
        const improvement = await determineImprovement(plan.user_id, plan.id, plan.category);
        
        // Generate status based on completion rate
        const status = determineStatus(completionRate);
        
        // Generate milestones based on completion data
        const milestones = generateMilestones(completionRate, plan.category);

        return {
          id: client.id,
          name: client.name,
          plan: plan.name,
          planId: plan.id,
          progress: completionRate,
          status,
          metrics: {
            attendance: completionRate, // We're using the same metric for attendance
            goalCompletion: completionRate, // And goal completion for simplicity
            improvement,
          },
          recentMilestones: milestones,
        };
      })
    );

    // Filter out any null values and return
    return { 
      data: clientProgress.filter(Boolean) as ClientProgressData[], 
      error: null 
    };
  } catch (error) {
    console.error("Error fetching client progress:", error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Helper function to determine client's status based on completion rate
 */
function determineStatus(completionRate: number): "On Track" | "Behind Schedule" | "Exceeding Goals" {
  if (completionRate >= 80) return "Exceeding Goals";
  if (completionRate >= 60) return "On Track";
  return "Behind Schedule";
}

/**
 * Helper function to calculate improvement trend based on workout type and progressive overload
 * For strength and hypertrophy plans, this calculates different aspects of progressive overload
 * For deload periods, we don't measure improvement but rather recovery compliance
 * 
 * @param userId The client's user ID
 * @param planId The workout plan ID
 * @param category The workout category (strength, hypertrophy, endurance, deload)
 * @returns A percentage string indicating improvement
 */
async function determineImprovement(userId: string, planId: string, category: string): Promise<string> {
  const supabase = await createClient();
  
  try {
    // For deload periods, we don't measure performance improvement
    if (category === "deload") {
      // Instead check completion rate as an indicator of recovery compliance
      const { data: completions } = await supabase
        .from("workout_day_completion")
        .select("id", { count: 'exact' })
        .eq("plan_id", planId)
        .eq("user_id", userId);
      
      const { data: plan } = await supabase
        .from("workout_plans")
        .select("days, duration_weeks")
        .eq("id", planId)
        .single();
      
      if (plan) {
        const totalWorkouts = (plan.days || 0) * plan.duration_weeks;
        const completedWorkouts = completions?.length || 0;
        const recoveryAdherence = totalWorkouts > 0 
          ? (completedWorkouts / totalWorkouts) * 100 
          : 0;
        
        // For deload, we just indicate recovery adherence
        return recoveryAdherence >= 80 ? "+5%" : "+0%";
      }
      
      return "+0%";
    }
    
    // Define time periods for comparison
    const now = new Date();
    const recentPeriodEnd = now.toISOString();
    const recentPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(); // Last 14 days
    const previousPeriodEnd = recentPeriodStart;
    const previousPeriodStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(); // 14-28 days ago

    // Get recent workout logs with their sets
    const { data: recentLogs, error: recentError } = await supabase
      .from('user_workout_logs')
      .select(`
        id,
        exercise_id,
        completed_sets,
        completed_reps,
        weight_used,
        date_logged,
        workout_log_sets (
          id,
          set_number,
          weight,
          reps
        )
      `)
      .eq('user_id', userId)
      .gte('date_logged', recentPeriodStart)
      .lte('date_logged', recentPeriodEnd);

    if (recentError) throw recentError;

    // Get previous workout logs with their sets for comparison
    const { data: previousLogs, error: previousError } = await supabase
      .from('user_workout_logs')
      .select(`
        id,
        exercise_id,
        completed_sets,
        completed_reps,
        weight_used,
        date_logged,
        workout_log_sets (
          id,
          set_number,
          weight,
          reps
        )
      `)
      .eq('user_id', userId)
      .gte('date_logged', previousPeriodStart)
      .lte('date_logged', previousPeriodEnd);

    if (previousError) throw previousError;
    
    // If we don't have enough data for comparison
    if (!recentLogs?.length || !previousLogs?.length) {
      return "+0%";
    }

    // Group logs by exercise
    const recentByExercise = groupByExercise(recentLogs);
    const previousByExercise = groupByExercise(previousLogs);
    
    const exerciseImprovements = [];
    
    // Calculate improvement for each exercise that exists in both periods
    for (const exerciseId in recentByExercise) {
      if (previousByExercise[exerciseId]) {
        const recentMetrics = calculateExerciseMetrics(recentByExercise[exerciseId]);
        const previousMetrics = calculateExerciseMetrics(previousByExercise[exerciseId]);
        
        // Calculate improvement percentages
        const weightImprovement = calculatePercentageChange(
          recentMetrics.averageWeight, 
          previousMetrics.averageWeight
        );
        
        const volumeImprovement = calculatePercentageChange(
          recentMetrics.totalVolume, 
          previousMetrics.totalVolume
        );
        
        const intensityImprovement = calculatePercentageChange(
          recentMetrics.maxWeight,
          previousMetrics.maxWeight
        );
        
        exerciseImprovements.push({
          exerciseId,
          weightImprovement,
          volumeImprovement,
          intensityImprovement
        });
      }
    }
    
    if (exerciseImprovements.length === 0) {
      return "+0%";
    }
    
    // Calculate overall improvement using weights based on training category
    const overallImprovement = calculateImprovementByCategory(exerciseImprovements, category);
    
    // Format the result as a percentage string
    return (overallImprovement >= 0 ? "+" : "") + Math.round(overallImprovement) + "%";
  } catch (error) {
    console.error('Error calculating improvement:', error);
    return "+0%"; // Default fallback
  }
}

/**
 * Groups workout logs by exercise ID
 */
function groupByExercise(logs: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  
  logs.forEach(log => {
    const exerciseId = log.exercise_id;
    if (!grouped[exerciseId]) {
      grouped[exerciseId] = [];
    }
    grouped[exerciseId].push(log);
  });
  
  return grouped;
}

/**
 * Calculates exercise metrics from a set of logs
 */
function calculateExerciseMetrics(logs: any[]) {
  let totalWeight = 0;
  let totalReps = 0;
  let totalSets = 0;
  let maxWeight = 0;
  let totalVolume = 0;
  
  logs.forEach(log => {
    // Use log-level metrics if available
    if (log.weight_used) {
      totalWeight += log.weight_used * log.completed_sets;
      totalReps += log.completed_reps;
      totalSets += log.completed_sets;
      maxWeight = Math.max(maxWeight, log.weight_used);
      totalVolume += log.weight_used * log.completed_reps;
    } 
    // Otherwise calculate from individual sets
    else if (log.workout_log_sets && log.workout_log_sets.length > 0) {
      log.workout_log_sets.forEach((set: any) => {
        totalWeight += set.weight;
        totalReps += set.reps;
        totalSets++;
        maxWeight = Math.max(maxWeight, set.weight);
        totalVolume += set.weight * set.reps;
      });
    }
  });
  
  return {
    averageWeight: totalSets > 0 ? totalWeight / totalSets : 0,
    averageReps: totalSets > 0 ? totalReps / totalSets : 0,
    maxWeight,
    totalVolume,
    totalSets
  };
}

/**
 * Calculates percentage change between two values
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculates overall improvement with different weightings based on workout category
 */
function calculateImprovementByCategory(improvements: any[], category: string): number {
  if (improvements.length === 0) return 0;
  
  let weightWeighting: number;
  let volumeWeighting: number;
  let intensityWeighting: number;
  
  // Assign different weightings based on workout category
  switch (category.toLowerCase()) {
    case 'strength':
      // For strength training, prioritize weight increases and max intensity
      weightWeighting = 0.4;    // 40% weight to average weight increases
      volumeWeighting = 0.2;    // 20% weight to volume increases
      intensityWeighting = 0.4; // 40% weight to max weight increases
      break;
      
    case 'hypertrophy':
      // For hypertrophy, prioritize volume
      weightWeighting = 0.2;    // 20% weight to average weight increases
      volumeWeighting = 0.6;    // 60% weight to volume increases
      intensityWeighting = 0.2; // 20% weight to max weight increases
      break;
      
    case 'endurance':
      // For endurance, volume is key
      weightWeighting = 0.1;    // 10% weight to average weight increases
      volumeWeighting = 0.7;    // 70% weight to volume increases
      intensityWeighting = 0.2; // 20% weight to max weight increases
      break;
      
    default:
      // Balanced default
      weightWeighting = 0.3;
      volumeWeighting = 0.4;
      intensityWeighting = 0.3;
  }
  
  // Calculate weighted improvement
  let totalImprovement = 0;
  
  improvements.forEach(imp => {
    const weightedImprovement = 
      imp.weightImprovement * weightWeighting +
      imp.volumeImprovement * volumeWeighting +
      imp.intensityImprovement * intensityWeighting;
      
    totalImprovement += weightedImprovement;
  });
  
  // Return average improvement across all exercises
  return totalImprovement / improvements.length;
}

/**
 * Helper function to generate appropriate milestones based on progress
 */
function generateMilestones(completionRate: number, category: string): string[] {
  const milestones: string[] = [];
  
  // Add milestone based on completion percentage
  if (completionRate >= 25) milestones.push("Completed 25% of workouts");
  if (completionRate >= 50) milestones.push("Halfway through program");
  if (completionRate >= 75) milestones.push("75% completion milestone");
  
  // Add category-specific milestone
  switch (category) {
    case "strength":
      milestones.push("Strength gains recorded");
      break;
    case "hypertrophy":
      milestones.push("Muscle growth observed");
      break;
    case "endurance":
      milestones.push("Endurance improvements");
      break;
    case "deload":
      milestones.push("Recovery phase progressing");
      break;
    default:
      milestones.push("Program progression on track");
  }
  
  return milestones;
}

/**
 * Updates the workout day completion for a client
 * When a client logs a workout, this ensures the workout_day_completion table is updated
 */
export async function updateWorkoutDayCompletion(
  userId: string,
  planId: string,
  workoutDayId: string,
  weekNumber: number
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();
  
  try {
    // Insert or update the completion record
    const { error } = await supabase
      .from("workout_day_completion")
      .upsert({
        user_id: userId,
        plan_id: planId,
        workout_day_id: workoutDayId,
        week_number: weekNumber,
        completed_at: new Date().toISOString()
      });
      
    if (error) throw new Error(error.message);
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating workout completion:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetches detailed progress data for a specific client's workout plan
 * Includes all logged workouts with sets and personal records
 * 
 * @param planId The workout plan ID
 * @returns An array of workout log data organized by day and week
 */
export async function getClientDetailedProgress(planId: string): Promise<{ 
  data: {
    clientName: string;
    planName: string;
    planCategory: string;
    planDuration: number;
    logs: ClientWorkoutLogData[];
  } | null; 
  error: string | null 
}> {
  const supabase = await createClient();

  try {
    // Get current user (trainer)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: "Session expired" };
    }

    // First get the workout plan with client info
    const { data: plan, error: planError } = await supabase
      .from("workout_plans")
      .select(`
        id,
        name,
        category,
        duration_weeks,
        user_id,
        users!workout_plans_user_id_fkey (
          id,
          name
        )
      `)
      .eq("id", planId)
      .single();

    if (planError) throw new Error(planError.message);
    if (!plan) return { data: null, error: "Workout plan not found" };

    // Ensure this client belongs to the trainer
    const { data: clientRelation, error: relationError } = await supabase
      .from("trainer_clients")
      .select("client_id")
      .eq("trainer_id", user.id)
      .eq("client_id", plan.user_id)
      .single();

    if (relationError && relationError.code !== 'PGRST116') throw new Error(relationError.message);
    if (!clientRelation) return { data: null, error: "You don't have access to this client's data" };

    // Get all workout days for this plan
    const { data: workoutDays, error: daysError } = await supabase
      .from("workout_days")
      .select(`
        id,
        day_number,
        workout_type
      `)
      .eq("plan_id", planId)
      .order("day_number");

    if (daysError) throw new Error(daysError.message);
    
    if (!workoutDays || workoutDays.length === 0) {
      return {
        data: {
          clientName: plan.users.name,
          planName: plan.name,
          planCategory: plan.category,
          planDuration: plan.duration_weeks,
          logs: []
        },
        error: null
      };
    }
    
    // Get workout day IDs for query
    const workoutDayIds = workoutDays.map(d => d.id);

    // Get all workout logs for this plan
    const { data: workoutLogs, error: logsError } = await supabase
      .from("user_workout_logs")
      .select(`
        id,
        date_logged,
        workout_day_id,
        week_number,
        exercise_id,
        workout_log_sets (
          id,
          set_number,
          weight,
          reps
        )
      `)
      .eq("user_id", plan.user_id)
      .in("workout_day_id", workoutDayIds)
      .order("date_logged", { ascending: false });

    if (logsError) throw new Error(logsError.message);
    
    // If no logs exist yet, return empty array
    if (!workoutLogs || workoutLogs.length === 0) {
      return {
        data: {
          clientName: plan.users.name,
          planName: plan.name,
          planCategory: plan.category,
          planDuration: plan.duration_weeks,
          logs: []
        },
        error: null
      };
    }

    // Get all exercises associated with this plan's workout days
    const { data: exercises, error: exercisesError } = await supabase
      .from("exercises_workout")
      .select(`
        id,
        workout_day_id,
        exercise:exercise (
          id,
          name
        ),
        notes
      `)
      .in("workout_day_id", workoutDayIds);

    if (exercisesError) throw new Error(exercisesError.message);

    // Get personal records for this client
    const { data: personalRecords, error: prError } = await supabase
      .from("pr_history")
      .select(`
        exercise_id,
        weight,
        reps,
        one_rm,
        date_achieved
      `)
      .eq("user_id", plan.user_id);

    if (prError) throw new Error(prError.message);
    
    // Default to empty array if no PRs exist yet
    const safePersonalRecords = personalRecords || [];

    // Get workout day completions to know which days were fully completed
    const { data: completions, error: completionsError } = await supabase
      .from("workout_day_completion")
      .select(`
        workout_day_id,
        week_number,
        completed_at
      `)
      .eq("plan_id", planId)
      .eq("user_id", plan.user_id);

    if (completionsError) throw new Error(completionsError.message);
    
    // Default to empty array if no completions exist yet
    const safeCompletions = completions || [];

    // Create a map to efficiently look up exercise names and notes
    const exerciseLookup: Record<string, { name: string; notes: string | null }> = {};
    
    for (const entry of exercises) {
      if (entry.exercise) {
        exerciseLookup[entry.id] = {
          name: entry.exercise.name,
          notes: entry.notes
        };
      }
    }
    
    // Diagnostic: Check which exercise_ids from logs are missing in the lookup
    const missingExerciseIds = workoutLogs
      .map(logEntry => logEntry.exercise_id)
      .filter(id => id && !exerciseLookup[id]);
    
    if (missingExerciseIds.length > 0) {
      // Additional debugging: Fetch details about missing exercises
      const { data: missingExercises } = await supabase
        .from("exercises_workout")
        .select(`id, workout_day_id, exercise:exercise(id, name)`)
        .in("id", missingExerciseIds.slice(0, 10));
      
      // Add missing exercises to lookup if possible
      if (missingExercises) {
        for (const entry of missingExercises) {
          if (entry.exercise) {
            exerciseLookup[entry.id] = {
              name: entry.exercise.name,
              notes: null
            };
          }
        }
      }
    }

    // Organize workout logs by day and week
    const organizedLogs: ClientWorkoutLogData[] = [];
    const processedDays = new Set<string>();

    // Group logs by day and week
    for (const workoutLog of workoutLogs) {
      // Skip logs with missing required data
      if (!workoutLog.workout_day_id || !workoutLog.exercise_id) {
        continue;
      }

      // Create a unique key for this day/week combination
      const dayWeekKey = `${workoutLog.workout_day_id}-${workoutLog.week_number}`;
      
      if (!processedDays.has(dayWeekKey)) {
        // Find the day information
        const day = workoutDays.find(d => d.id === workoutLog.workout_day_id);
        if (!day) {
          continue;
        }

        // Find all logs for this day/week
        const logsForDay = workoutLogs.filter(
          l => l.workout_day_id === workoutLog.workout_day_id && l.week_number === workoutLog.week_number
        );

        // Find completion information
        const completion = safeCompletions.find(
          c => c.workout_day_id === workoutLog.workout_day_id && c.week_number === workoutLog.week_number
        );

        // Map exercise logs with their sets
        const exercisesWithSets = [];
        
        for (const dayLog of logsForDay) {
          // Skip invalid logs
          if (!dayLog.exercise_id) continue;
          
          // Find the exercise data including sets
          const exerciseWorkoutId = dayLog.exercise_id;
          const exerciseInfo = exerciseLookup[exerciseWorkoutId];
          
          if (!exerciseInfo) {
            continue;
          }

          // Ensure workout_log_sets exists and is an array
          const logSets = dayLog.workout_log_sets || [];
          
          if (logSets.length === 0) {
            continue;
          }

          // Check which sets are PRs
          const setsWithPRStatus = logSets.map(set => {
            // Calculate estimated 1RM for this set using Epley formula
            const estimatedOneRM = set.weight * (1 + (set.reps / 30.0));

            // Check if this is a PR
            const isPR = safePersonalRecords.some(pr => 
              pr.exercise_id === exerciseWorkoutId && 
              pr.one_rm !== null && // Guard against null one_rm
              Math.abs(pr.one_rm - estimatedOneRM) < 0.01 &&
              pr.weight === set.weight &&
              pr.reps === set.reps
            );

            return {
              setNumber: set.set_number,
              weight: set.weight,
              reps: set.reps,
              isPR
            };
          });

          exercisesWithSets.push({
            id: exerciseWorkoutId,
            name: exerciseInfo.name,
            sets: setsWithPRStatus,
            notes: exerciseInfo.notes
          });
        }

        // Add to organized logs if we have exercises
        if (exercisesWithSets.length > 0) {
          organizedLogs.push({
            dayId: day.id,
            dayNumber: day.day_number,
            workoutType: day.workout_type,
            weekNumber: workoutLog.week_number,
            exercises: exercisesWithSets,
            completedAt: completion?.completed_at || null
          });
          
          // Mark this day/week as processed
          processedDays.add(dayWeekKey);
        }
      }
    }

    // Sort logs by week and day
    organizedLogs.sort((a, b) => {
      if (a.weekNumber !== b.weekNumber) {
        return b.weekNumber - a.weekNumber; // Latest week first
      }
      return a.dayNumber - b.dayNumber; // Day order within week
    });

    return {
      data: {
        clientName: plan.users.name,
        planName: plan.name,
        planCategory: plan.category,
        planDuration: plan.duration_weeks,
        logs: organizedLogs
      },
      error: null
    };
  } catch (error) {
    console.error("Error fetching client detailed progress:", error);
    return { 
      data: null, 
      error: (error as Error).message 
    };
  }
}
