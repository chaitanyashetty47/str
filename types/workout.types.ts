import { Database } from "@/utils/supabase/types";

// Base type from workout_plans table
type WorkoutPlanBase = Pick<
  Database["public"]["Tables"]["workout_plans"]["Row"],
  | "id" 
  | "name" 
  | "category" 
  | "days" 
  | "duration_weeks"
  | "trainer_id"
  | "user_id"
  | "description"
  | "start_date"
  | "end_date"
>;

// Type for user data we want to include
type WorkoutPlanUser = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "name" | "email"
>;

// Combined type for workout plan with user data
export type WorkoutPlan = WorkoutPlanBase & {
  client?: WorkoutPlanUser;
};

// Type for workout plan filters
export interface WorkoutPlanFilters {
  searchQuery?: string;
  clientId?: string;
  status?: 'active' | 'previous';
}

export interface WorkoutExercise {
  id: string;
  workout_plan_id?: string;
  workout_day_id?: string;
  day?: number;
  name: string;
  sets: number;
  reps: string | number;
  rest_time?: string;
  youtube_link?: string;
  notes?: string;
  exercise_id?: string;
} 