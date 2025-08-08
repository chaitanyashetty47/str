import { Database } from "@/utils/supabase/types";

// Base type from workout_plans table
type WorkoutPlanBase = Pick<
  Database["public"]["Tables"]["workout_plans"]["Row"],
  "id" | "name" | "category" | "days" | "duration_weeks"
>;

// Type for user data we want to include
type WorkoutPlanUser = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "name" | "email"
>;

// Combined type for workout plan with user data
export type WorkoutPlan = WorkoutPlanBase & {
  client: WorkoutPlanUser;
}; 