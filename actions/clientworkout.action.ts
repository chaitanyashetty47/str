"use server";

import { createClient } from "@/utils/supabase/server";
// import { redirect } from "next/navigation";
import { encodedRedirect } from "@/utils/utils";

interface WorkoutProgress {
  currentWeek: number;
  totalWeeks: number;
  daysRemaining: number;
  progressPercentage: number;
}

// Define the workout type as a const to use in type definitions
const WORKOUT_TYPES = {
  legs: "Legs",
  chest_triceps: "Chest & Triceps",
  back_biceps: "Back & Biceps",
  full_body: "Full Body",
} as const;

// Create a type from the keys of WORKOUT_TYPES
type WorkoutType = keyof typeof WORKOUT_TYPES;

// Interface for the workout day
interface WorkoutDay {
  id: string;
  day_number: number;
  workout_type: WorkoutType;
  plan_id: string;
}

interface WorkoutPlanFilters {
  searchQuery?: string;
  status?: 'active' | 'previous';
}

export async function getClientCurrentWorkoutPlan() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return encodedRedirect("error", "/sign-in", "Session expired");
  }

  const currentDate = new Date().toISOString();

  //get the current active workout plan for the client
  const { data: workoutPlan, error: workoutPlanError } = await supabase
    .from("workout_plans")
    .select(`
      id,
      name,
      category,
      days,
      duration_weeks,
      description,
      start_date,
      end_date,
      trainer:users!workout_plans_trainer_id_fkey (
        name,
        email
      )
    `)
    .eq("user_id", user.id)
    .lte("start_date", currentDate)
    .gte("end_date", currentDate)
    .single();

  if (workoutPlanError?.code === 'PGRST116') {
    return encodedRedirect("error", "/home", "No active workout plan found. Please contact your trainer.");
  }

  if (workoutPlanError) {
    console.error("Error fetching workout plan:", workoutPlanError);
    return encodedRedirect("error", "/home", "Failed to fetch workout plan");
  }

  // Calculate progress metrics
  const now = new Date();
  const startDate = new Date(workoutPlan.start_date);
  const endDate = new Date(workoutPlan.end_date);
  
  // Calculate total duration and elapsed time in milliseconds
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedTime = now.getTime() - startDate.getTime();
  
  // Calculate progress percentage (0-100)
  const progressPercentage = Math.min(Math.max(Math.round((elapsedTime / totalDuration) * 100), 0), 100);
  
  // Calculate days remaining
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate current week (1-based)
  const currentWeek = Math.min(
    Math.max(Math.ceil(elapsedTime / (7 * 24 * 60 * 60 * 1000)), 1),
    workoutPlan.duration_weeks
  );

  const progress: WorkoutProgress = {
    currentWeek,
    totalWeeks: workoutPlan.duration_weeks,
    daysRemaining,
    progressPercentage
  };

  return { 
    error: null, 
    data: {
      ...workoutPlan,
      progress
    }
  };
}

export async function getUpcomingWorkouts(planId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return encodedRedirect("error", "/sign-in", "Session expired");
  }

  const { data: workoutDays, error: workoutDaysError } = await supabase
    .from("workout_days")
    .select("*")
    .eq("plan_id", planId);

  if (workoutDaysError) {
    console.error("Error fetching workout days:", workoutDaysError);
    return { error: workoutDaysError, data: null };
  }

  // Transform the workout data with proper typing and formatting
  const formattedWorkouts = workoutDays?.map((workout) => ({
    ...workout,
    workout_type: WORKOUT_TYPES[workout.workout_type as WorkoutType] // Format the workout type
  }));

  return { data: formattedWorkouts, error: null };
}

export async function getAllWorkoutPlanForClient(filters?: WorkoutPlanFilters) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return encodedRedirect("error", "/sign-in", "Session expired");
  }

  // Start building the query
  let query = supabase
    .from("workout_plans")
    .select(`
      id,
      name,
      category,
      days,
      duration_weeks,
      start_date,
      end_date,
      trainer:users!workout_plans_trainer_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq("user_id", user.id);

  // Apply filters if provided
  if (filters) {
    // Filter by plan name search query
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      query = query.ilike("name", `%${filters.searchQuery}%`);
    }

    // Filter by plan status (active/previous based on date)
    if (filters.status) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const currentDate = now.toISOString();
      
      if (filters.status === 'active') {
        // Active plans: end_date is after or equal to today's date
        query = query.gte("end_date", currentDate);
      } else if (filters.status === 'previous') {
        // Previous plans: end_date is before today's date
        query = query.lt("end_date", currentDate);
      }
    }
  }

  // Complete the query with sorting
  const { data: plans, error: plansError } = await query
    .order("start_date", { ascending: false });

  if (plansError) {
    console.error("Error fetching plans:", plansError);
    return { error: plansError.message, data: null };
  }

  // Process the plans to add formatted dates and status
  const processedPlans = plans.map(plan => {
    const startDate = new Date(plan.start_date);
    const endDate = new Date(plan.end_date);
    const now = new Date();
    
    return {
      ...plan,
      startDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysPerWeek: plan.days,
      duration: `${plan.duration_weeks} weeks`,
      status: endDate >= now ? 'active' : 'previous',
      trainer: plan.trainer.name || 'Unknown Trainer'
    };
  });

  return { data: processedPlans, error: null };
}

/**
 * Fetches comprehensive details for a specific workout plan, including:
 * - Basic plan information
 * - Workout days with associated exercises
 * - Weekly progress tracking
 * - Completion statistics
 * 
 * @param planId The unique identifier of the workout plan
 * @returns Full workout plan details or redirects on error
 */
export async function getWorkoutPlanDetails(planId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return encodedRedirect("error", "/sign-in", "Session expired");
  }

  // Fetch the workout plan with related trainer data
  const { data: workoutPlan, error: planError } = await supabase
    .from("workout_plans")
    .select(`
      id,
      name,
      description,
      category,
      days,
      duration_weeks,
      start_date,
      end_date,
      trainer:users!workout_plans_trainer_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq("id", planId)
    .single();

  if (planError) {
    console.error("Error fetching workout plan:", planError);
    return encodedRedirect("error", "/workouts", "Failed to fetch workout plan");
  }

  // Fetch all workout days with their exercises
  const { data: workoutDays, error: daysError } = await supabase
    .from("workout_days")
    .select(`
      id,
      day_number,
      workout_type,
      exercises:exercises_workout(
        id,
        sets,
        reps,
        weight,
        notes,
        rest_time,
        exercise:exercise(
          id,
          name,
          youtube_link
        )
      )
    `)
    .eq("plan_id", planId)
    .order("day_number", { ascending: true });

  if (daysError) {
    console.error("Error fetching workout days:", daysError);
    return encodedRedirect("error", "/workouts", "Failed to fetch workout details");
  }

  // Format workout days and exercises for the UI
  const formattedWorkoutDays = workoutDays.map(day => ({
    id: day.id,
    day_number: day.day_number,
    workout_type: WORKOUT_TYPES[day.workout_type as WorkoutType] || day.workout_type,
    exercises: day.exercises.map(ex => ({
      id: ex.id,
      name: ex.exercise.name,
      sets: ex.sets,
      reps: ex.reps,
      notes: ex.notes,
      weight: ex.weight,
      youtube_link: ex.exercise.youtube_link,
    }))
  }));

  // Fetch weekly progress data
  const { data: weeklyData, error: weeklyError } = await supabase
    .from("workout_plan_weeks")
    .select("id, week_number, status, start_date, end_date")
    .eq("plan_id", planId)
    .order("week_number", { ascending: true });

  if (weeklyError) {
    console.error("Error fetching weekly progress:", weeklyError);
    // Continue execution even if weekly data fails
  }

  // Calculate overall progress based on today's date relative to plan dates
  const now = new Date();
  const startDate = new Date(workoutPlan.start_date);
  const endDate = new Date(workoutPlan.end_date);
  
  // Calculate total duration and elapsed time in milliseconds
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedTime = now.getTime() - startDate.getTime();
  
  // Calculate progress percentage (0-100)
  const progressPercentage = Math.min(Math.max(Math.round((elapsedTime / totalDuration) * 100), 0), 100);

  // Calculate completion rate based on logged workouts (placeholder logic)
  // In a real implementation, you would count completed workouts vs. total workouts
  // const { data: completedWorkouts, error: completedError } = await supabase
  //   .from("user_workout_logs")
  //   .select("id")
  //   .eq("plan_week_id", weeklyData?.[0]?.id || '')
  //   .count();

  // Format weekly progress for UI
  const weeks = weeklyData?.map(week => {
    const weekStartDate = new Date(week.start_date);
    const weekEndDate = new Date(week.end_date);
    let status: "completed" | "active" | "upcoming" = "upcoming";
    
    if (now > weekEndDate) {
      status = "completed";
    } else if (now >= weekStartDate && now <= weekEndDate) {
      status = "active";
    }
    
    return {
      week_number: week.week_number,
      status: week.status || status,
    };
  }) || [];

  // Return the complete workout plan details
  return {
    error: null,
    data: {
      ...workoutPlan,
      workout_days: formattedWorkoutDays,
      weeks: weeks,
      progress: progressPercentage,
      completion_rate: 75, // In a real app, calculate this based on completed workouts
      days_per_week: workoutPlan.days || formattedWorkoutDays.length,
    }
  };
}

/**
 * Fetches workout details for a specific day and week to be logged by the user
 * - Gets exercise details including programmed sets, reps, and weights
 * - Fetches previous logs if they exist for this workout/day
 * 
 * @param planId Workout plan ID 
 * @param dayNumber Day number in the workout plan
 * @param weekNumber Week number in the workout plan
 * @returns Workout details with exercise information
 */
export async function getWorkoutDayForLogging(planId: string, dayNumber: number, weekNumber: number) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return encodedRedirect("error", "/sign-in", "Session expired");
  }

  // Get the workout plan to verify ownership
  const { data: workoutPlan, error: planError } = await supabase
    .from("workout_plans")
    .select("id, name, description, category, duration_weeks")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();

  if (planError) {
    console.error("Error fetching workout plan:", planError);
    return encodedRedirect("error", "/workouts", "Failed to fetch workout plan");
  }

  // Get the workout day with exercises
  const { data: workoutDay, error: dayError } = await supabase
    .from("workout_days")
    .select(`
      id,
      day_number,
      workout_type,
      exercises:exercises_workout(
        id,
        sets,
        reps,
        weight,
        notes,
        rest_time,
        exercise:exercise(
          id,
          name,
          youtube_link
        )
      )
    `)
    .eq("plan_id", planId)
    .eq("day_number", dayNumber)
    .single();

  if (dayError) {
    console.error("Error fetching workout day:", dayError);
    return encodedRedirect("error", "/workouts", "Failed to fetch workout details");
  }

  // Check if user has previously logged this workout
  const { data: previousLogs, error: logsError } = await supabase
    .from("user_workout_logs")
    .select(`
      id,
      date_logged,
      exercise_id,
      workout_log_sets (
        id,
        set_number,
        weight,
        reps
      )
    `)
    .eq("user_id", user.id)
    .eq("workout_day_id", workoutDay.id)
    .eq("week_number", weekNumber)
    .order("date_logged", { ascending: false });

  // Ensure previousLogs is treated as an array
  const logData = Array.isArray(previousLogs) ? previousLogs : [];
  const hasLogs = logData.length > 0;
  
  // Create a map of exercise IDs to their logged sets for easier access
  const exerciseLogMap: Record<string, Array<{id: string, set_number: number, weight: number, reps: number}>> = {};
  
  if (hasLogs) {
    // Group log sets by exercise_id
    logData.forEach(log => {
      if (log.exercise_id && log.workout_log_sets) {
        if (!exerciseLogMap[log.exercise_id]) {
          exerciseLogMap[log.exercise_id] = [];
        }
        // Add all sets from this log to the exercise's sets array
        exerciseLogMap[log.exercise_id].push(...log.workout_log_sets);
      }
    });
  }

  // Format exercises for UI
  const formattedExercises = workoutDay.exercises.map(ex => {
    // Get previously logged sets for this exercise if they exist
    const previousSets = exerciseLogMap[ex.id] || [];
    
    // Sort sets by set number
    previousSets.sort((a, b) => a.set_number - b.set_number);

    return {
      id: ex.id,
      name: ex.exercise.name,
      programmedSets: ex.sets,
      programmedReps: ex.reps,
      programmedWeight: ex.weight || 0,
      notes: ex.notes,
      youtube_link: ex.exercise.youtube_link,
      // Include previous logged data if available
      previousSets: previousSets.length > 0 ? previousSets : null,
      // Include log IDs for each exercise to use when updating
      logId: hasLogs ? logData.find(log => log.exercise_id === ex.id)?.id : null
    };
  });

  return {
    error: null,
    data: {
      planId,
      workoutPlan: {
        id: workoutPlan.id,
        name: workoutPlan.name,
        description: workoutPlan.description,
        category: workoutPlan.category,
        durationWeeks: workoutPlan.duration_weeks
      },
      workoutDay: {
        id: workoutDay.id,
        dayNumber: workoutDay.day_number,
        workoutType: WORKOUT_TYPES[workoutDay.workout_type as WorkoutType] || workoutDay.workout_type,
        exercises: formattedExercises,
      },
      weekNumber,
      hasPreviousLog: hasLogs,
      previousLogDate: hasLogs
        ? new Date(logData[0].date_logged).toLocaleDateString() 
        : null
    }
  };
}

/**
 * Interface for logged set data
 */
interface LoggedSet {
  setNumber: number;
  weight: number;
  reps: number;
  setId?: string; // Optional ID for updating existing sets
}

/**
 * Interface for logged exercise data
 */
interface LoggedExercise {
  exerciseId: string;
  sets: LoggedSet[];
  logId?: string; // Optional ID for updating existing log
}

/**
 * Logs a completed workout with all sets for each exercise
 * - Creates entries in user_workout_logs and workout_log_sets tables
 * - Updates existing entries if logId or setId is provided
 * - PR tracking is handled by database trigger
 * 
 * @param planId Workout plan ID
 * @param dayId Workout day ID 
 * @param weekNumber Week number being logged
 * @param exercises Array of exercises with their sets data
 * @returns Success status or error
 */
export async function logWorkoutCompletion(
  planId: string,
  dayId: string,
  weekNumber: number,
  exercises: LoggedExercise[]
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Session expired", success: false };
  }

  // Start a transaction to ensure all records are created together
  try {
    // 1. Get plan week ID if it exists
    const { data: planWeek } = await supabase
      .from("workout_plan_weeks")
      .select("id")
      .eq("plan_id", planId)
      .eq("week_number", weekNumber)
      .single();
      
    const planWeekId = planWeek?.id || null;
    console.log("planWeekId", planWeekId);

    // 2. Process each exercise
    for (const exercise of exercises) {
      console.log("Processing exercise:", exercise.exerciseId);
      
      let logId = exercise.logId;
      
      // If no existing log ID, create a new log entry
      if (!logId) {
        console.log("Creating new workout log entry");
        const { data: logEntry, error: logError } = await supabase
          .from("user_workout_logs")
          .insert({
            user_id: user.id,
            exercise_id: exercise.exerciseId,
            workout_day_id: dayId,
            plan_week_id: planWeekId,
            week_number: weekNumber,
            date_logged: new Date().toISOString(),
            completed_sets: exercise.sets.length,
            completed_reps: exercise.sets.reduce((total, set) => total + set.reps, 0),
            weight_used: Math.max(...exercise.sets.map(set => set.weight))
          })
          .select("id")
          .single();

        if (logError) {
          console.error("Error creating workout log:", logError);
          return { error: "Failed to log workout", success: false };
        }
        
        if (!logEntry || !logEntry.id) {
          console.error("No log entry ID was returned");
          return { error: "Failed to create workout log record", success: false };
        }
        
        logId = logEntry.id;
        console.log("Created log entry:", logId);
      } else {
        // Update existing log
        console.log("Updating existing workout log:", logId);
        const { error: updateError } = await supabase
          .from("user_workout_logs")
          .update({
            completed_sets: exercise.sets.length,
            completed_reps: exercise.sets.reduce((total, set) => total + set.reps, 0),
            weight_used: Math.max(...exercise.sets.map(set => set.weight)),
            date_logged: new Date().toISOString(), // Update the timestamp
          })
          .eq("id", logId);
          
        if (updateError) {
          console.error("Error updating workout log:", updateError);
          return { error: "Failed to update workout log", success: false };
        }
      }

      // Process each set
      for (const set of exercise.sets) {
        if (set.setId) {
          // Update existing set
          console.log(`Updating set ${set.setNumber} with ID ${set.setId}`);
          const { error: updateError } = await supabase
            .from("workout_log_sets")
            .update({
              weight: Math.max(set.weight, 0.1), // Ensure weight > 0
              reps: Math.max(set.reps, 1),      // Ensure reps > 0
            })
            .eq("id", set.setId);
            
          if (updateError) {
            console.error(`Error updating set ${set.setNumber}:`, updateError);
            return { error: `Failed to update set ${set.setNumber}`, success: false };
          }
        } else {
          // Create new set
          const { error: insertError } = await supabase
            .from("workout_log_sets")
            .insert({
              log_id: logId,
              set_number: set.setNumber,
              weight: Math.max(set.weight, 0.1), // Ensure weight > 0
              reps: Math.max(set.reps, 1)        // Ensure reps > 0
            });
            
          if (insertError) {
            console.error(`Error creating set ${set.setNumber}:`, insertError);
            return { error: `Failed to log set ${set.setNumber}`, success: false };
          }
        }
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in workout logging transaction:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}



