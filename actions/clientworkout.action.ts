"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
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



